const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Route: All votes
router.get('/', async (req, res) => {
  try {
    const [votes] = await db.query(`
      SELECT 
        v.id AS vote_id,
        CONCAT(vo.first_name, ' ', vo.last_name) AS voter_name,
        c.name AS constituency_name,
        ca.name AS candidate_name,
        p.name AS party_name,
        e.name AS election_name,
        pos.name AS position_name
      FROM votes v
      LEFT JOIN voters vo ON v.voter_id = vo.id
      LEFT JOIN constituencies c ON vo.constituency_id = c.id
      LEFT JOIN candidates ca ON v.candidate_id = ca.id
      LEFT JOIN parties p ON ca.party_id = p.id
      LEFT JOIN elections e ON v.election_id = e.id
      LEFT JOIN positions pos ON v.position_id = pos.id
      ORDER BY v.id ASC
    `);

    res.render('votes', { votes });

  } catch (err) {
    console.error('Error fetching votes:', err);
    res.status(500).send('Error fetching votes');
  }
});

module.exports = router;
