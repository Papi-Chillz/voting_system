const express = require('express');
const router = express.Router();
const pool = require('../models/db'); // your MySQL connection

// GET /elections/winners
router.get('/winners', async (req, res) => {
  try {
    // --- President & VP winners (overall highest votes) ---
    const [presidentVP] = await pool.query(`
      SELECT 
        e.name AS election_name, 
        c.name AS candidate_name, 
        p.name AS party_name, 
        pos.name AS position, 
        COUNT(v.id) AS vote_count
      FROM votes v
      JOIN candidates c ON v.candidate_id = c.id
      JOIN parties p ON c.party_id = p.id
      JOIN positions pos ON c.position_id = pos.id
      JOIN elections e ON c.election_id = e.id
      WHERE pos.name IN ('President','Vice President')
      GROUP BY e.name, c.name, p.name, pos.name
      ORDER BY pos.name, vote_count DESC
    `);

    // --- MP & Local Gov winners (top per party per position) ---
    const [mpLocal] = await pool.query(`
      SELECT t.*
      FROM (
        SELECT 
          e.name AS election_name, 
          c.name AS candidate_name, 
          p.name AS party_name, 
          pos.name AS position, 
          COUNT(v.id) AS vote_count,
          ROW_NUMBER() OVER (
            PARTITION BY p.name, pos.name 
            ORDER BY COUNT(v.id) DESC
          ) AS rn
        FROM votes v
        JOIN candidates c ON v.candidate_id = c.id
        JOIN parties p ON c.party_id = p.id
        JOIN positions pos ON c.position_id = pos.id
        JOIN elections e ON c.election_id = e.id
        WHERE pos.name IN ('Member of Parliament','Local Government')
        GROUP BY e.name, c.name, p.name, pos.name
      ) t
      WHERE t.rn = 1
    `);

    res.render('elections', {
      presidentVPWinners: presidentVP || [],
      mpLocalWinners: mpLocal || []
    });
  } catch (err) {
    console.error('Error fetching winners:', err);
    res.status(500).send('Error fetching winners: ' + err.message);
  }
});

module.exports = router;
