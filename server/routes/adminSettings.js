const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logAction } = require('../services/auditLog');
const router = express.Router();

router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM site_settings WHERE id = 1');
    if (result.rows.length === 0) {
      return res.json({ settings: {} });
    }
    res.json({ settings: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put('/', requireAdmin, async (req, res, next) => {
  try {
    const { 
      site_name, description, is_paid, contact_email, 
      contact_phone, telegram_url, instagram_url, youtube_url 
    } = req.body;

    const updated = await query(
      `UPDATE site_settings 
       SET site_name = COALESCE($1, site_name),
           description = COALESCE($2, description),
           is_paid = COALESCE($3, is_paid),
           contact_email = COALESCE($4, contact_email),
           contact_phone = COALESCE($5, contact_phone),
           telegram_url = COALESCE($6, telegram_url),
           instagram_url = COALESCE($7, instagram_url),
           youtube_url = COALESCE($8, youtube_url),
           updated_at = NOW()
       WHERE id = 1 RETURNING *`,
      [site_name, description, is_paid, contact_email, contact_phone, telegram_url, instagram_url, youtube_url]
    );

    await logAction(req.admin.id, 'update_settings', 'site_settings', '1');
    res.json({ settings: updated.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
