const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Adjust path to your database connection module

// GET /voidVotes
router.get('/', async (req, res) => {
  try {
    const [voidStats] = await db.query(`
      SELECT position_id AS ward_id,
             COUNT(*) AS void_count,
             ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) 
                                       FROM votes v2 
                                       WHERE v2.position_id = votes.position_id), 2) AS void_percent
      FROM votes
      WHERE vote_type = 'VOID'
      GROUP BY position_id
      HAVING void_percent > 0;
    `);

    res.render('voidVotes', { voidStats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching void votes data');
  }
});

module.exports = router;
