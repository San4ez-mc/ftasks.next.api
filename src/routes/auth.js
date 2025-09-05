const express = require('express');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();
const { JWT_SECRET } = process.env;

function verifyTempToken(req, res) {
  const header = req.headers['authorization'];
  if (!header) {
    res.status(401).json({ message: 'Missing Authorization header' });
    return null;
  }
  const token = header.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Invalid Authorization header' });
    return null;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'temp') throw new Error('Invalid token type');
    return payload.id;
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return null;
  }
}

router.post('/telegram/login', async (req, res) => {
  const { id, username, first_name, last_name } = req.body;
  if (!id || !first_name || !last_name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const tgUserId = id;
  const firstName = first_name;
  const lastName = last_name;
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM users WHERE telegram_user_id = ?', [tgUserId]);
  let userId;
  if (rows.length === 0) {
    const [result] = await pool.execute(
      'INSERT INTO users (telegram_user_id, telegram_username, first_name, last_name) VALUES (?, ?, ?, ?)',
      [tgUserId, username || null, firstName, lastName]
    );
    userId = result.insertId;
  } else {
    userId = rows[0].id;
  }
  const tempToken = jwt.sign({ id: userId, type: 'temp' }, JWT_SECRET, { expiresIn: '5m' });
  res.json({ tempToken });
});

router.get('/telegram/companies', async (req, res) => {
  const userId = verifyTempToken(req, res);
  if (!userId) return;
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT c.id, c.name FROM companies c JOIN user_companies uc ON c.id = uc.company_id WHERE uc.user_id = ?',
    [userId]
  );
  res.json(rows);
});

router.post('/telegram/select-company', async (req, res) => {
  const userId = verifyTempToken(req, res);
  if (!userId) return;
  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ message: 'companyId is required' });
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT 1 FROM user_companies WHERE user_id = ? AND company_id = ?',
    [userId, companyId]
  );
  if (rows.length === 0) return res.status(403).json({ message: 'User is not a member of the company' });
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.post('/telegram/create-company-and-login', async (req, res) => {
  const userId = verifyTempToken(req, res);
  if (!userId) return;
  const { companyName } = req.body;
  if (!companyName) return res.status(400).json({ message: 'companyName is required' });
  const pool = getPool();
  const [result] = await pool.execute('INSERT INTO companies (name, owner_id) VALUES (?, ?)', [companyName, userId]);
  await pool.execute(
    'INSERT INTO user_companies (user_id, company_id, role) VALUES (?, ?, ?)',
    [userId, result.insertId, 'owner']
  );
  const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
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
