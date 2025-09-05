const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const { JWT_SECRET } = process.env;

router.post('/telegram/login', async (req, res) => {
  const { tgUserId, username, firstName, lastName, photoUrl } = req.body;
  if (!tgUserId || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE telegram_user_id = ?', [tgUserId]);
  let user;
  if (rows.length === 0) {
    const [result] = await pool.execute(
      'INSERT INTO users (telegram_user_id, telegram_username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [tgUserId, username || null, firstName, lastName]
    );
    user = { id: result.insertId, firstName, lastName, email: null };
  } else {
    const row = rows[0];
    user = { id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email };
  }
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user });
});

router.get('/me', auth, async (req, res) => {
  const pool = getPool();
  const [userRows] = await pool.execute('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [req.user.id]);
  if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
  const user = userRows[0];
  const [companyRows] = await pool.execute(
    'SELECT c.id, c.name FROM companies c JOIN user_companies uc ON c.id = uc.company_id WHERE uc.user_id = ?',
    [user.id]
  );
  res.json({ id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, companies: companyRows });
});

router.post('/logout', auth, (req, res) => {
  res.status(204).end();
});

module.exports = router;
