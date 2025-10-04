const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Your MySQL connection

// Route to display candidates statistics
router.get('/', async (req, res) => {
    try {
      // 1. Number of candidates per position and ward
      const [positionStats] = await db.query(`
        SELECT p.name AS position_name, c.ward_id, COUNT(*) AS num_candidates
        FROM candidates c
        LEFT JOIN positions p ON c.position_id = p.id
        GROUP BY c.position_id, c.ward_id, p.name
      `);
  
      // 2. Gender distribution of candidates
      const [genderStats] = await db.query(`
        SELECT gender, COUNT(*) AS total_candidates
        FROM candidates
        GROUP BY gender
      `);
  
      res.render('candidates', { positionStats, genderStats });
    } catch (err) {
      console.error('SQL ERROR:', err);
      res.send('Error fetching candidate statistics');
    }
  });
  

module.exports = router;
