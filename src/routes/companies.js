const express = require('express');
const { getPool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT c.id, c.name FROM companies c JOIN user_companies uc ON c.id = uc.company_id WHERE uc.user_id = ?',
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const pool = getPool();
  const [result] = await pool.execute('INSERT INTO companies (name, owner_id) VALUES (?, ?)', [name, req.user.id]);
  await pool.execute('INSERT INTO user_companies (user_id, company_id, role) VALUES (?, ?, ?)', [req.user.id, result.insertId, 'owner']);
  res.status(201).json({ id: result.insertId, name, ownerId: req.user.id });
});

module.exports = router;
