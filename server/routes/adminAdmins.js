const express = require('express');
const bcrypt = require('bcrypt');
const { query, getClient } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logAction } = require('../services/auditLog');
const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT id, username, full_name, created_at, updated_at FROM admins ORDER BY created_at ASC');
    res.json({ admins: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, full_name } = req.body;
    if (!username || !password) return res.status(400).json({ error: true, message: "Foydalanuvchi nomi va parol kiritilishi shart." });

    const check = await query('SELECT id FROM admins WHERE username = $1', [username]);
    if (check.rows.length > 0) return res.status(400).json({ error: true, message: "Bu username allaqachon mavjud." });

    const hash = await bcrypt.hash(password, 12);
    const inserted = await query(
      'INSERT INTO admins (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name, created_at',
      [username, hash, full_name || '']
    );

    await logAction(req.admin.id, 'create_admin', 'admin', inserted.rows[0].id);
    res.status(201).json({ admin: inserted.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { full_name, password } = req.body;

    let updateQuery = 'UPDATE admins SET full_name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, username, full_name, updated_at';
    let params = [full_name, adminId];

    if (password) {
      const hash = await bcrypt.hash(password, 12);
      updateQuery = 'UPDATE admins SET full_name = $1, password_hash = $2, updated_at = NOW() WHERE id = $3 RETURNING id, username, full_name, updated_at';
      params = [full_name, hash, adminId];
    }

    const updated = await query(updateQuery, params);
    if (updated.rows.length === 0) return res.status(404).json({ error: true, message: "Admin topilmadi." });

    await logAction(req.admin.id, 'update_admin', 'admin', adminId);
    res.json({ admin: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const client = await getClient();
  try {
    const adminId = req.params.id;
    
    await client.query('BEGIN');
    
    const adminsRes = await client.query('SELECT id FROM admins FOR UPDATE');
    const count = adminsRes.rows.length;
    
    if (count <= 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: true, message: "Tizimda kamida bitta administrator bo'lishi kerak." });
    }

    const deleted = await client.query('DELETE FROM admins WHERE id = $1 RETURNING id', [adminId]);
    if (deleted.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: true, message: "Admin topilmadi." });
    }

    await client.query('COMMIT');
    await logAction(req.admin.id, 'delete_admin', 'admin', adminId);
    res.json({ message: "Administrator o'chirildi." });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
