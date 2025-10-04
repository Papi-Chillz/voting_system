const express = require("express");
const router = express.Router();
const db = require("../models/db"); // Promise-based MySQL connection

// ------------------------
// Voter: Vote page
// ------------------------
router.get("/", async (req, res) => {
  try {
    const voterId = req.session.user.id;

    const [elections] = await db.query("SELECT * FROM elections");
    const results = [];

    for (let e of elections) {
      const [candidates] = await db.query(
        `SELECT c.id, c.name, c.position_id, p.name AS party_name, pos.name AS position_name
         FROM candidates c
         LEFT JOIN parties p ON c.party_id = p.id
         LEFT JOIN positions pos ON c.position_id = pos.id
         WHERE c.election_id = ?`,
        [e.id]
      );

      const positions = {};
      candidates.forEach(c => {
        if (!positions[c.position_name]) positions[c.position_name] = [];
        positions[c.position_name].push(c);
      });

      results.push({ ...e, positions });
    }

    res.render("vote", { elections: results, message: null });

  } catch (err) {
    console.error("Error loading vote page:", err);
    res.status(500).send("Error loading voting page");
  }
});

// ------------------------
// Voter: Submit vote
// ------------------------
router.post("/", async (req, res) => {
  try {
    const voterId = req.session.user.id;
    let voted = false;

    for (const key in req.body) {
      if (key.startsWith("candidate_")) {
        const [_, electionId, positionId] = key.split("_");
        const candidateId = req.body[key];

        const [existing] = await db.query(
          "SELECT * FROM votes WHERE election_id=? AND position_id=? AND voter_id=?",
          [electionId, positionId, voterId]
        );

        if (existing.length > 0) continue;

        await db.query(
          "INSERT INTO votes (voter_id, candidate_id, election_id, position_id) VALUES (?, ?, ?, ?)",
          [voterId, candidateId, electionId, positionId]
        );

        voted = true;
      }
    }

    if (voted) {
      // Update has_voted flag
      await db.query("UPDATE voters SET has_voted = 1 WHERE id = ?", [voterId]);
      // Redirect to home with success message
      return res.redirect("/?message=" + encodeURIComponent("✅ Vote submitted successfully!"));
    } else {
      // No votes were recorded (already voted)
      return res.redirect("/?message=" + encodeURIComponent("❌ You already voted for all positions."));
    }

  } catch (err) {
    console.error("Error submitting vote:", err);
    res.status(500).send("Error submitting vote");
  }
});

module.exports = router;
