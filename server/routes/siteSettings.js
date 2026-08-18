const express = require('express');
const { query } = require('../db');
const router = express.Router();

router.get('/', async (req, res, next) => {
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

module.exports = router;
