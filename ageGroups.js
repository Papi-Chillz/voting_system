// ageGroups.js
const express = require('express');
const router = express.Router();
const db = require('../models/db'); // your MySQL connection

router.get('/', async (req, res) => {
  try {
    const [ageStats] = await db.query(`
      SELECT CASE
               WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) < 18 THEN '<18'
               WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 18 AND 25 THEN '18-25'
               WHEN TIMESTAMPDIFF(YEAR, dob, CURDATE()) BETWEEN 26 AND 40 THEN '26-40'
               ELSE '40+'
             END AS age_group,
             COUNT(*) AS total_voters
      FROM voters
      GROUP BY age_group;
    `);

    res.render('ageGroups', { ageStats });
  } catch (err) {
    console.error(err);
    res.send('Error fetching age group data');
  }
});

module.exports = router;
