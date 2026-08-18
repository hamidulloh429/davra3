const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { adminLoginLimiter } = require('../middleware/rateLimiter');
const { logAction } = require('../services/auditLog');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/login', adminLoginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: true, message: "Foydalanuvchi nomi va parol kiritilishi shart." });
    }

    const result = await query("SELECT * FROM admins WHERE username = $1", [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: true, message: "Foydalanuvchi nomi yoki parol noto'g'ri." });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    
    if (!match) {
      return res.status(401).json({ error: true, message: "Foydalanuvchi nomi yoki parol noto'g'ri." });
    }

    req.session.adminId = admin.id;
    await logAction(admin.id, 'login', 'admin', admin.id, { ip: req.ip });

    const { password_hash, ...adminData } = admin;
    res.json({ admin: adminData });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', requireAdmin, async (req, res, next) => {
  try {
    const adminId = req.session.adminId;
    await logAction(adminId, 'logout', 'admin', adminId);
    
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: "Muvaffaqiyatli chiqildi." });
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    const result = await query("SELECT id, username, full_name, created_at FROM admins WHERE id = $1", [req.admin.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: true, message: "Administrator topilmadi." });
    }
    res.json({ admin: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
