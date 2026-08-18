const express = require('express');
const { query } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(requireAdmin);

router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const countRes = await query('SELECT COUNT(*) FROM audit_logs');
    const total = parseInt(countRes.rows[0].count, 10);

    const result = await query(
      `SELECT al.*, a.username as admin_username 
       FROM audit_logs al 
       LEFT JOIN admins a ON al.admin_id = a.id 
       ORDER BY al.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      logs: result.rows,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const usersTotal = await query('SELECT COUNT(*) FROM users');
    const usersBlocked = await query('SELECT COUNT(*) FROM users WHERE is_blocked = true');
    const usersNew = await query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'");
    
    const commTotal = await query('SELECT COUNT(*) FROM communities');
    const commPublic = await query("SELECT COUNT(*) FROM communities WHERE visibility = 'public'");
    const commPrivate = await query("SELECT COUNT(*) FROM communities WHERE visibility = 'private'");
    
    const eventTotal = await query('SELECT COUNT(*) FROM events');
    const eventUpcoming = await query('SELECT COUNT(*) FROM events WHERE event_date > NOW()');

    res.json({
      totalUsers: parseInt(usersTotal.rows[0].count, 10),
      blockedUsers: parseInt(usersBlocked.rows[0].count, 10),
      newUsersThisWeek: parseInt(usersNew.rows[0].count, 10),
      totalCommunities: parseInt(commTotal.rows[0].count, 10),
      publicCommunities: parseInt(commPublic.rows[0].count, 10),
      privateCommunities: parseInt(commPrivate.rows[0].count, 10),
      totalEvents: parseInt(eventTotal.rows[0].count, 10),
      upcomingEvents: parseInt(eventUpcoming.rows[0].count, 10)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
