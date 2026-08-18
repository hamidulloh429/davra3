const express = require('express');
const { query } = require('../db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const communitiesCount = await query("SELECT COUNT(*) FROM communities WHERE visibility = 'public'");
    const membersCount = await query("SELECT COUNT(DISTINCT user_id) FROM community_members");
    const eventsCount = await query("SELECT COUNT(*) FROM events WHERE event_date > NOW()");

    res.json({
      totalCommunities: parseInt(communitiesCount.rows[0].count, 10),
      totalMembers: parseInt(membersCount.rows[0].count, 10),
      upcomingEvents: parseInt(eventsCount.rows[0].count, 10)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
