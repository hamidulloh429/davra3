const express = require('express');
const { query } = require('../db');
const { requireUser } = require('../middleware/auth');
const { validateRequired, validateStringLength } = require('../validators');
const { logAction } = require('../services/auditLog');
const router = express.Router({ mergeParams: true });

// Helper to sanitize text from XSS
const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Helper to resolve community by UUID or SLUG
const resolveCommunity = async (idOrSlug) => {
  if (!idOrSlug) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUUID) {
    const res = await query('SELECT id, slug, name, owner_id FROM communities WHERE id = $1', [idOrSlug]);
    return res.rows[0] || null;
  } else {
    const res = await query('SELECT id, slug, name, owner_id FROM communities WHERE slug = $1', [idOrSlug]);
    return res.rows[0] || null;
  }
};

// GET /api/communities/:id/messages — Get message history
router.get('/', async (req, res, next) => {
  try {
    const communityParam = req.params.id;
    const { page = 1, limit = 50, before } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Resolve community by UUID or slug
    const community = await resolveCommunity(communityParam);
    if (!community) {
      return res.status(404).json({ error: true, message: "Davra topilmadi." });
    }

    const communityId = community.id;

    // Permission check: Must be an authenticated user and a member of this Davra (or Admin)
    const isAdmin = req.session && req.session.adminId;
    const isAuthUser = (req.isAuthenticated && req.isAuthenticated() && req.user) || (req.session && req.session.userId);
    const currentUserId = req.user ? req.user.id : (req.session ? req.session.userId : null);

    if (!isAdmin && !isAuthUser) {
      return res.status(401).json({ error: true, message: "Chatda qatnashish uchun avval tizimga kiring." });
    }

    if (!isAdmin && currentUserId) {
      const membership = await query(
        'SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2',
        [communityId, currentUserId]
      );
      const isOwner = community.owner_id === currentUserId;

      if (membership.rows.length === 0 && !isOwner) {
        return res.status(403).json({ 
          error: true, 
          message: "Siz ushbu davraning a'zosi emassiz. Xabarlarni ko'rish uchun avval davraga a'zo bo'ling." 
        });
      }
    }

    let sql = `
      SELECT 
        m.id, 
        m.community_id, 
        m.user_id, 
        m.content, 
        m.created_at, 
        m.updated_at,
        u.full_name as user_name, 
        u.avatar_url as user_avatar, 
        u.bio as user_bio, 
        u.location as user_location,
        cm.role as user_role
      FROM community_messages m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN community_members cm ON (cm.community_id = m.community_id AND cm.user_id = m.user_id)
      WHERE m.community_id = $1
    `;
    const params = [communityId];

    if (before) {
      sql += ` AND m.created_at < $2 ORDER BY m.created_at DESC LIMIT $3`;
      params.push(new Date(before), parsedLimit);
    } else {
      sql += ` ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`;
      params.push(parsedLimit, offset);
    }

    const result = await query(sql, params);

    const countRes = await query('SELECT COUNT(*) FROM community_messages WHERE community_id = $1', [communityId]);
    const total = parseInt(countRes.rows[0].count, 10);

    // Messages are fetched in DESC order for pagination, reverse to show chronological order
    const messages = result.rows.reverse();

    res.json({
      success: true,
      messages,
      total,
      page: parsedPage,
      hasMore: offset + result.rows.length < total
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    next(error);
  }
});

// POST /api/communities/:id/messages — Send a new message
router.post('/', requireUser, async (req, res, next) => {
  try {
    const communityParam = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    // Validate required & length
    const reqErr = validateRequired(content, 'Xabar matni');
    if (reqErr) return res.status(400).json({ error: true, message: reqErr });

    const lenErr = validateStringLength(content, 1, 2000, 'Xabar matni');
    if (lenErr) return res.status(400).json({ error: true, message: lenErr });

    // Resolve community
    const community = await resolveCommunity(communityParam);
    if (!community) {
      return res.status(404).json({ error: true, message: "Davra topilmadi." });
    }

    const communityId = community.id;

    // Check membership
    let userRole = 'member';
    const membership = await query(
      'SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2',
      [communityId, userId]
    );

    if (membership.rows.length === 0) {
      if (community.owner_id === userId) {
        userRole = 'owner';
        await query(
          `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING`,
          [communityId, userId]
        );
      } else {
        return res.status(403).json({ 
          error: true, 
          message: "Siz ushbu davraning a'zosi emassiz. Xabar yozish uchun avval davraga a'zo bo'ling." 
        });
      }
    } else {
      userRole = membership.rows[0].role;
    }

    const cleanContent = sanitizeText(content.trim());

    // Prevent rapid duplicate spamming (same content within 3 seconds)
    const recentDuplicate = await query(
      `SELECT id FROM community_messages 
       WHERE community_id = $1 AND user_id = $2 AND content = $3 AND created_at > NOW() - INTERVAL '3 seconds'`,
      [communityId, userId, cleanContent]
    );
    if (recentDuplicate.rows.length > 0) {
      return res.status(429).json({ 
        error: true, 
        message: "Iltimos, juda tez ketma-ket bir xil xabar yubormang." 
      });
    }

    // Ensure full user details are present
    let userFullName = req.user.full_name;
    let userAvatarUrl = req.user.avatar_url;
    let userBio = req.user.bio || '';
    let userLocation = req.user.location || '';

    if (!userFullName) {
      const uRes = await query('SELECT full_name, avatar_url, bio, location FROM users WHERE id = $1', [userId]);
      if (uRes.rows.length > 0) {
        userFullName = uRes.rows[0].full_name;
        userAvatarUrl = uRes.rows[0].avatar_url;
        userBio = uRes.rows[0].bio || '';
        userLocation = uRes.rows[0].location || '';
      }
    }

    // Insert message into database
    const insertRes = await query(
      `INSERT INTO community_messages (community_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [communityId, userId, cleanContent]
    );

    const createdMsg = insertRes.rows[0];

    const messagePayload = {
      id: createdMsg.id,
      community_id: createdMsg.community_id,
      user_id: createdMsg.user_id,
      content: createdMsg.content,
      created_at: createdMsg.created_at,
      updated_at: createdMsg.updated_at,
      user_name: userFullName || 'Foydalanuvchi',
      user_avatar: userAvatarUrl,
      user_bio: userBio,
      user_location: userLocation,
      user_role: userRole
    };

    // Emit real-time message to socket room (both by ID and by SLUG)
    const io = req.app.get('io');
    if (io) {
      io.to(`community_${communityId}`).emit('new_message', messagePayload);
      if (community.slug && community.slug !== communityId) {
        io.to(`community_${community.slug}`).emit('new_message', messagePayload);
      }
    }

    res.status(201).json({
      success: true,
      message: messagePayload
    });
  } catch (error) {
    console.error('Error creating message:', error);
    next(error);
  }
});

// DELETE /api/communities/:id/messages/:msgId — Delete a message
router.delete('/:msgId', async (req, res, next) => {
  try {
    const { id: communityParam, msgId } = req.params;
    const isAdmin = req.session && req.session.adminId;
    const isAuthUser = (req.isAuthenticated && req.isAuthenticated() && req.user) || (req.session && req.session.userId);
    const currentUserId = req.user ? req.user.id : (req.session ? req.session.userId : null);

    if (!isAdmin && !isAuthUser) {
      return res.status(401).json({ error: true, message: "Avtorizatsiya talab qilinadi." });
    }

    const community = await resolveCommunity(communityParam);
    if (!community) {
      return res.status(404).json({ error: true, message: "Davra topilmadi." });
    }

    const communityId = community.id;

    const msgCheck = await query('SELECT * FROM community_messages WHERE id = $1 AND community_id = $2', [msgId, communityId]);
    if (msgCheck.rows.length === 0) {
      return res.status(404).json({ error: true, message: "Xabar topilmadi." });
    }
    const message = msgCheck.rows[0];

    // Permission check: User can delete own message; Community owner or Admin can delete any message
    if (!isAdmin && message.user_id !== currentUserId) {
      const isOwner = community.owner_id === currentUserId;
      if (!isOwner) {
        return res.status(403).json({ error: true, message: "Sizda bu xabarni o'chirish huquqi yo'q." });
      }
    }

    await query('DELETE FROM community_messages WHERE id = $1', [msgId]);

    if (isAdmin) {
      await logAction(req.session.adminId, 'delete_chat_message', 'community_message', msgId, { community_id: communityId });
    }

    // Broadcast deletion to socket room
    const io = req.app.get('io');
    if (io) {
      io.to(`community_${communityId}`).emit('delete_message', { messageId: msgId, communityId });
      if (community.slug && community.slug !== communityId) {
        io.to(`community_${community.slug}`).emit('delete_message', { messageId: msgId, communityId });
      }
    }

    res.json({ success: true, message: "Xabar muvaffaqiyatli o'chirildi." });
  } catch (error) {
    console.error('Error deleting message:', error);
    next(error);
  }
});

module.exports = router;
