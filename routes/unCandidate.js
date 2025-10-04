const express = require('express');
const router = express.Router();
const pool = require('../models/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Registered' THEN 1 ELSE 0 END) AS registered,
        SUM(CASE WHEN status = 'Not Registered' THEN 1 ELSE 0 END) AS unregistered,
        (SUM(CASE WHEN status = 'Not Registered' THEN 1 ELSE 0 END) / COUNT(*) * 100) AS percent_unregistered
      FROM candidates
    `);

    const stats = rows[0];

    // Convert percent_unregistered to number
    stats.percent_unregistered = parseFloat(stats.percent_unregistered);

    res.render('unCandidate', { stats });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
