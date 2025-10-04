const express = require("express");
const router = express.Router();
const db = require("../models/db"); // make sure this exports a promise pool

router.get("/", async (req, res) => {
  const query = `
    SELECT 
      gender,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'Not Registered' THEN 1 ELSE 0 END) AS not_registered,
      ROUND((SUM(CASE WHEN status = 'Not Registered' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) AS percent_not_registered
    FROM voters
    GROUP BY gender;
  `;

  try {
    const [results] = await db.query(query); // use await and destructure array
    res.render("unregistered", { stats: results });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Database error");
  }
});

module.exports = router;
