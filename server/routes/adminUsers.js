const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logAction } = require('../services/auditLog');
const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (search) {
      sql += ` AND (full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (status === 'blocked') {
      sql += ` AND is_blocked = true`;
    } else if (status === 'active') {
      sql += ` AND is_blocked = false`;
    }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      users: result.rows,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { full_name, bio, location, is_blocked } = req.body;
    const userId = req.params.id;

    const updated = await query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           bio = COALESCE($2, bio), 
           location = COALESCE($3, location), 
           is_blocked = COALESCE($4, is_blocked),
           updated_at = NOW() 
       WHERE id = $5 RETURNING *`,
      [full_name, bio, location, is_blocked, userId]
    );

    if (updated.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });

    await logAction(req.admin.id, 'update_user', 'user', userId, { updated_fields: Object.keys(req.body) });
    res.json({ user: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/block', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updated = await query('UPDATE users SET is_blocked = true, updated_at = NOW() WHERE id = $1 RETURNING *', [userId]);
    if (updated.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });

    await logAction(req.admin.id, 'block_user', 'user', userId);
    res.json({ user: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/unblock', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updated = await query('UPDATE users SET is_blocked = false, updated_at = NOW() WHERE id = $1 RETURNING *', [userId]);
    if (updated.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });

    await logAction(req.admin.id, 'unblock_user', 'user', userId);
    res.json({ user: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deleted = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (deleted.rows.length === 0) return res.status(404).json({ error: true, message: "Foydalanuvchi topilmadi." });

    await logAction(req.admin.id, 'delete_user', 'user', userId);
    res.json({ message: "Foydalanuvchi o'chirildi." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
