const express = require('express');
const router = express.Router();
const db = require('../models/db'); // MySQL2 promise-based connection

// ------------------------
// List all entities
// ------------------------
router.get('/', async (req, res) => {
  try {
    const entitiesData = {};
    const entityTables = [
      'voters', 'parties', 'positions', 'elections', 'candidates',
      'votes', 'results', 'constituencies', 'districts',
      'polling_stations', 'users', 'roles', 'permissions',
      'sessions', 'audit_logs', 'complaints', 'observers',
      'ballot_papers', 'announcements', 'media'
    ];

    // Fetch table data
    for (const table of entityTables) {
      const [rows] = await db.query(`SELECT * FROM ${table}`);
      entitiesData[table] = rows;
    }

    // Create foreign key maps for better display
    const foreignKeyMaps = {};
    if (entitiesData.constituencies)
      foreignKeyMaps['constituency_id'] = entitiesData.constituencies.reduce((a, c) => { a[c.id] = c.name; return a; }, {});
    if (entitiesData.districts)
      foreignKeyMaps['district_id'] = entitiesData.districts.reduce((a, d) => { a[d.id] = d.name; return a; }, {});
    if (entitiesData.parties)
      foreignKeyMaps['party_id'] = entitiesData.parties.reduce((a, p) => { a[p.id] = p.name; return a; }, {});
    if (entitiesData.positions)
      foreignKeyMaps['position_id'] = entitiesData.positions.reduce((a, p) => { a[p.id] = p.name; return a; }, {});
    if (entitiesData.elections)
      foreignKeyMaps['election_id'] = entitiesData.elections.reduce((a, e) => { a[e.id] = e.name; return a; }, {});
    if (entitiesData.candidates)
      foreignKeyMaps['candidate_id'] = entitiesData.candidates.reduce((a, c) => { a[c.id] = c.name; return a; }, {});

    res.render('entities', { entitiesData, foreignKeyMaps });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching entity data: ' + err.message);
  }
});

// ------------------------
// Add a row
// ------------------------
router.post('/add/:table', async (req, res) => {
  const table = req.params.table;
  const data = req.body;

  try {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(',');
    const values = Object.values(data);

    await db.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`, values);
    res.redirect('/entities');

  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding data: ' + err.message);
  }
});

// ------------------------
// Delete a row safely
// ------------------------
router.post('/delete/:table/:id', async (req, res) => {
  const table = req.params.table;
  const id = req.params.id;

  try {
    // Define dependent tables for each table to prevent foreign key errors
    const dependencies = {
      voters: [{ table: 'votes', column: 'voter_id' }],
      candidates: [{ table: 'votes', column: 'candidate_id' }],
      elections: [{ table: 'votes', column: 'election_id' }],
      positions: [{ table: 'candidates', column: 'position_id' }],
      parties: [{ table: 'candidates', column: 'party_id' }],
      constituencies: [{ table: 'voters', column: 'constituency_id' }]
      // Add more dependencies as needed
    };

    // Check for dependent records
    if (dependencies[table]) {
      for (const dep of dependencies[table]) {
        const [rows] = await db.query(`SELECT * FROM ${dep.table} WHERE ${dep.column} = ?`, [id]);
        if (rows.length > 0) {
          return res.status(400).send(
            `❌ Cannot delete from "${table}" because related records exist in "${dep.table}".`
          );
        }
      }
    }

    // Safe to delete
    await db.query(`DELETE FROM ${table} WHERE id = ?`, [id]);
    res.redirect('/entities');

  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).send('Error deleting data: ' + err.message);
  }
});

module.exports = router;
