const express = require('express');
const { query, getClient } = require('../db');
const { requireUser } = require('../middleware/auth');
const router = express.Router();

const slugify = (text) => {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

router.get('/', async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count,
        (SELECT COUNT(*) FROM events e WHERE e.community_id = c.id AND e.event_date > NOW()) as event_count
      FROM communities c
      WHERE c.visibility = 'public'
    `;
    const params = [];
    let paramIdx = 1;

    if (search) {
      sql += ` AND c.name ILIKE $${paramIdx}`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (category) {
      sql += ` AND c.category = $${paramIdx}`;
      params.push(category);
      paramIdx++;
    }

    if (sort === 'popular') {
      sql += ' ORDER BY member_count DESC, c.created_at DESC';
    } else {
      sql += ' ORDER BY c.created_at DESC';
    }

    const result = await query(sql, params);
    res.json({ communities: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireUser, async (req, res, next) => {
  const client = await getClient();
  try {
    const { name, description, category, cover_image, visibility } = req.body;
    
    if (!name) return res.status(400).json({ error: true, message: "Jamiyat nomi kiritilishi shart." });
    
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'jamiyat';
    
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;
    while(slugExists) {
      const check = await client.query('SELECT id FROM communities WHERE slug = $1', [slug]);
      if (check.rows.length === 0) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    await client.query('BEGIN');
    
    const insertCommunity = await client.query(
      `INSERT INTO communities (name, slug, description, category, cover_image, owner_id, visibility)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, slug, description || '', category || 'Umumiy', cover_image || '', req.user.id, visibility || 'public']
    );
    const newCommunity = insertCommunity.rows[0];

    await client.query(
      `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [newCommunity.id, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ community: newCommunity });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const commRes = await query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id = c.id) as member_count 
       FROM communities c WHERE c.slug = $1`,
      [slug]
    );

    if (commRes.rows.length === 0) return res.status(404).json({ error: true, message: "Jamiyat topilmadi." });
    const community = commRes.rows[0];

    const membersRes = await query(
      `SELECT u.id, u.full_name, u.avatar_url, cm.role 
       FROM community_members cm 
       JOIN users u ON cm.user_id = u.id 
       WHERE cm.community_id = $1 
       ORDER BY cm.joined_at DESC LIMIT 20`,
      [community.id]
    );
    
    const eventsRes = await query(
      `SELECT * FROM events WHERE community_id = $1 ORDER BY event_date ASC LIMIT 10`,
      [community.id]
    );

    res.json({
      community,
      members: membersRes.rows,
      events: eventsRes.rows
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireUser, async (req, res, next) => {
  try {
    const commId = req.params.id;
    const { name, description, category, cover_image, visibility } = req.body;
    
    const check = await query('SELECT owner_id FROM communities WHERE id = $1', [commId]);
    if (check.rows.length === 0) return res.status(404).json({ error: true, message: "Jamiyat topilmadi." });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: true, message: "Faqat jamiyat egasi o'zgartirishi mumkin." });

    const updated = await query(
      `UPDATE communities SET name = COALESCE($1, name), description = COALESCE($2, description), 
        category = COALESCE($3, category), cover_image = COALESCE($4, cover_image), visibility = COALESCE($5, visibility), 
        updated_at = NOW() WHERE id = $6 RETURNING *`,
      [name, description, category, cover_image, visibility, commId]
    );

    res.json({ community: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const commId = req.params.id;
    const check = await query('SELECT owner_id FROM communities WHERE id = $1', [commId]);
    if (check.rows.length === 0) return res.status(404).json({ error: true, message: "Jamiyat topilmadi." });
    if (check.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: true, message: "Faqat jamiyat egasi o'chirishi mumkin." });

    await query('DELETE FROM communities WHERE id = $1', [commId]);
    res.json({ message: "Jamiyat muvaffaqiyatli o'chirildi." });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/join', requireUser, async (req, res, next) => {
  try {
    const commId = req.params.id;
    const userId = req.user.id;
    
    await query(
      `INSERT INTO community_members (community_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
      [commId, userId]
    );
    res.json({ message: "Jamiyatga muvaffaqiyatli qo'shildingiz." });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/leave', requireUser, async (req, res, next) => {
  try {
    const commId = req.params.id;
    const userId = req.user.id;
    
    const checkRole = await query('SELECT role FROM community_members WHERE community_id = $1 AND user_id = $2', [commId, userId]);
    if (checkRole.rows.length > 0 && checkRole.rows[0].role === 'owner') {
      return res.status(400).json({ error: true, message: "Jamiyat egasi jamiyatni tark eta olmaydi. Avval jamiyatni o'chiring." });
    }

    await query('DELETE FROM community_members WHERE community_id = $1 AND user_id = $2', [commId, userId]);
    res.json({ message: "Jamiyatdan muvaffaqiyatli chiqdingiz." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
