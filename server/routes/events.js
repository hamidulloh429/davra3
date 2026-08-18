const express = require('express');
const { query, getClient } = require('../db');
const { requireUser } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { community_id } = req.query;
    let sql = 'SELECT * FROM events WHERE event_date > NOW()';
    const params = [];
    
    if (community_id) {
      sql += ' AND community_id = $1';
      params.push(community_id);
    }
    
    sql += ' ORDER BY event_date ASC LIMIT 50';
    
    const result = await query(sql, params);
    res.json({ events: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireUser, async (req, res, next) => {
  try {
    const { community_id, title, description, location, event_date, max_members } = req.body;
    if (!community_id || !title || !event_date) {
      return res.status(400).json({ error: true, message: "Kerakli maydonlar to'ldirilmagan." });
    }

    // Must be a member to create an event
    const memberCheck = await query('SELECT * FROM community_members WHERE community_id = $1 AND user_id = $2', [community_id, req.user.id]);
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: true, message: "Tadbir yaratish uchun ushbu jamiyat a'zosi bo'lishingiz kerak." });
    }

    const newEvent = await query(
      `INSERT INTO events (community_id, title, description, location, event_date, max_members, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [community_id, title, description || '', location || '', event_date, max_members || 0, req.user.id]
    );

    res.status(201).json({ event: newEvent.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const eventRes = await query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) return res.status(404).json({ error: true, message: "Tadbir topilmadi." });

    const membersRes = await query(
      `SELECT u.id, u.full_name, u.avatar_url, em.joined_at 
       FROM event_members em 
       JOIN users u ON em.user_id = u.id 
       WHERE em.event_id = $1 ORDER BY em.joined_at ASC`,
      [eventId]
    );

    res.json({ event: eventRes.rows[0], members: membersRes.rows });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireUser, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const { title, description, location, event_date, max_members } = req.body;

    const check = await query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    if (check.rows.length === 0) return res.status(404).json({ error: true, message: "Tadbir topilmadi." });
    if (check.rows[0].created_by !== req.user.id) return res.status(403).json({ error: true, message: "Faqat tadbir yaratuvchisi o'zgartirishi mumkin." });

    const updated = await query(
      `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description), 
        location = COALESCE($3, location), event_date = COALESCE($4, event_date), 
        max_members = COALESCE($5, max_members), updated_at = NOW() WHERE id = $6 RETURNING *`,
      [title, description, location, event_date, max_members, eventId]
    );

    res.json({ event: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const check = await query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    if (check.rows.length === 0) return res.status(404).json({ error: true, message: "Tadbir topilmadi." });
    if (check.rows[0].created_by !== req.user.id) return res.status(403).json({ error: true, message: "Faqat tadbir yaratuvchisi o'chirishi mumkin." });

    await query('DELETE FROM events WHERE id = $1', [eventId]);
    res.json({ message: "Tadbir muvaffaqiyatli o'chirildi." });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/join', requireUser, async (req, res, next) => {
  const client = await getClient();
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    const eventCheck = await client.query('SELECT max_members FROM events WHERE id = $1 FOR UPDATE', [eventId]);
    if (eventCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: true, message: "Tadbir topilmadi." });
    }

    const maxMembers = eventCheck.rows[0].max_members;

    if (maxMembers > 0) {
      const countRes = await client.query('SELECT COUNT(*) FROM event_members WHERE event_id = $1', [eventId]);
      const currentCount = parseInt(countRes.rows[0].count, 10);
      if (currentCount >= maxMembers) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: true, message: "Tadbir to'lgan." });
      }
    }

    await client.query(
      'INSERT INTO event_members (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [eventId, userId]
    );

    await client.query('COMMIT');
    res.json({ message: "Tadbirga muvaffaqiyatli yozildingiz." });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.post('/:id/leave', requireUser, async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    await query('DELETE FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
    res.json({ message: "Tadbirkorlik bekor qilindi." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
