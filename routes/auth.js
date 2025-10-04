const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Promise-based MySQL
const bcrypt = require('bcrypt');

// Hardcoded users (admin/clerk)
const users = [
  { id: 1, username: 'admin', password: 'adminhashedpassword', role: 'admin' },
  { id: 2, username: 'clerk1', password: 'clerkhashedpassword', role: 'clerk' }
];

// Show login form
router.get('/login', (req, res) => {
  const { error } = req.query;
  res.render('login', { error });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1️⃣ Check hardcoded users first
    let user = users.find(u => u.username === username);
    if (user) {
      // For simplicity, plain text comparison for hardcoded passwords
      if (password !== user.password) {
        return res.redirect('/login?error=' + encodeURIComponent('Invalid credentials'));
      }
      req.session.user = { id: user.id, username: user.username, role: user.role };
      return res.redirect(user.role === 'voter' ? '/vote' : '/');
    }

    // 2️⃣ Check database voters
    const [rows] = await db.query(
      "SELECT id, first_name, last_name, nid, password FROM voters WHERE nid = ?",
      [username]
    );

    if (rows.length === 0) {
      return res.redirect('/login?error=' + encodeURIComponent('User not found'));
    }

    user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect('/login?error=' + encodeURIComponent('Incorrect password'));
    }

    req.session.user = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: 'voter',
      nid: user.nid
    };

    res.redirect('/');

  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login?error=' + encodeURIComponent('Something went wrong'));
  }
});

// Logout
// Logout via POST
router.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});


module.exports = router;
