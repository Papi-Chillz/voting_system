const express = require("express");
const router = express.Router();
const db = require("../models/db"); // your mysql2 pool

router.get("/", async (req, res) => {
  try {
    // Total voters
    const [totals] = await db.query("SELECT COUNT(*) AS total_voters FROM voters");

    // Total who voted
    const [voted] = await db.query("SELECT COUNT(*) AS total_voted FROM voters WHERE has_voted = 1");

    // Gender breakdown of those who voted
    const [genderBreakdown] = await db.query(`
      SELECT gender, COUNT(*) AS num_voted
      FROM voters
      WHERE has_voted = 1
      GROUP BY gender
    `);

    // Counts and percentages of same-gender support
    const [statsResult] = await db.query(`
      SELECT
        COUNT(DISTINCT CASE WHEN vr.gender = 'F' AND c.gender = 'F' THEN vr.id END) AS num_female_for_female,
        100.0 * COUNT(DISTINCT CASE WHEN vr.gender = 'F' AND c.gender = 'F' THEN vr.id END) /
          (SELECT COUNT(*) FROM voters WHERE gender = 'F' AND has_voted = 1) AS pct_female_for_female,
        COUNT(DISTINCT CASE WHEN vr.gender = 'M' AND c.gender = 'M' THEN vr.id END) AS num_male_for_male,
        100.0 * COUNT(DISTINCT CASE WHEN vr.gender = 'M' AND c.gender = 'M' THEN vr.id END) /
          (SELECT COUNT(*) FROM voters WHERE gender = 'M' AND has_voted = 1) AS pct_male_for_male
      FROM votes v
      JOIN voters vr ON v.voter_id = vr.id
      JOIN candidates c ON v.candidate_id = c.id
    `);

    res.render("voteStats", {
      totalVoters: totals[0].total_voters,
      totalVoted: voted[0].total_voted,
      genderBreakdown,
      stats: {
        num_female_for_female: statsResult[0].num_female_for_female,
        pct_female_for_female: Number(statsResult[0].pct_female_for_female) || 0,
        num_male_for_male: statsResult[0].num_male_for_male,
        pct_male_for_male: Number(statsResult[0].pct_male_for_male) || 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
