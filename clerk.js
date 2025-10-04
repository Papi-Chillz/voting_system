const express = require("express");
const router = express.Router();
const db = require("../models/db");
const bcrypt = require("bcrypt");

// Clerk: register voter
router.get("/", (req, res) => {
  res.render("register", { error: null, success: null });
});

router.post("/", async (req, res) => {
  let { first_name, last_name, nid, gender, dob, password, constituency_id } = req.body;

  // Ensure required fields
  if (!first_name || !last_name || !nid || !dob) {
    return res.render("register", { error: "⚠️ First name, last name, NID, and DOB are required.", success: null });
  }

  // If no password provided, default to 8 zeros
  if (!password) password = "00000000";

  try {
    // Check if NID already exists
    const [existing] = await db.query("SELECT * FROM voters WHERE nid = ?", [nid]);
    if (existing.length > 0) {
      return res.render("register", { error: "⚠️ This NID is already registered.", success: null });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert voter into database with all attributes
    await db.query(
      `INSERT INTO voters 
        (nid, first_name, last_name, gender, dob, password, constituency_id, has_voted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nid, first_name, last_name, gender || null, dob, hashed, constituency_id || null, 0]
    );

    res.render("register", { success: "✅ Voter registered successfully.", error: null });

  } catch (err) {
    console.error("Registration error:", err);
    res.render("register", { error: "⚠️ Registration failed. Try again.", success: null });
  }
});

module.exports = router;
