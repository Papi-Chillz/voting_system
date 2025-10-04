const db = require('./models/db');
const bcrypt = require('bcrypt');

async function setDefaultPasswords() {
  try {
    // Get all voters with NULL password
    const [voters] = await db.query("SELECT id FROM voters WHERE password IS NULL");

    for (const voter of voters) {
      const hashed = await bcrypt.hash("00000000", 10);
      await db.query("UPDATE voters SET password = ? WHERE id = ?", [hashed, voter.id]);
      console.log(`Set default password for voter ID ${voter.id}`);
    }

    console.log("All default passwords updated.");
    process.exit();
  } catch (err) {
    console.error("Error setting default passwords:", err);
    process.exit(1);
  }
}

setDefaultPasswords();
