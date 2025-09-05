const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router({ mergeParams: true });

router.use(auth);

router.get('/', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT e.id, u.first_name, u.last_name, u.photo_url, e.status
     FROM employees e
     JOIN users u ON e.user_id = u.id
     WHERE e.company_id = ?`,
    [req.params.companyId]
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      avatar: r.photo_url,
      status: r.status,
    }))
  );
});

router.post('/', async (req, res) => {
  const { userId, status = 'active', notes = null } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required' });
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO employees (user_id, company_id, status, notes) VALUES (?, ?, ?, ?)',
    [userId, req.params.companyId, status, notes]
  );
  const [rows] = await pool.execute(
    `SELECT e.id, u.first_name, u.last_name, u.photo_url, e.status
     FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
    [result.insertId]
  );
  const row = rows[0];
  res.status(201).json({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.photo_url,
    status: row.status,
  });
});

router.patch('/:employeeId', async (req, res) => {
  const { firstName, lastName, status, notes } = req.body;
  const pool = getPool();
  const { employeeId } = req.params;
  if (firstName || lastName) {
    await pool.execute(
      `UPDATE users u JOIN employees e ON u.id = e.user_id
       SET u.first_name = COALESCE(?, u.first_name),
           u.last_name = COALESCE(?, u.last_name)
       WHERE e.id = ?`,
      [firstName, lastName, employeeId]
    );
  }
  if (status || notes) {
    await pool.execute(
      'UPDATE employees SET status = COALESCE(?, status), notes = COALESCE(?, notes) WHERE id = ?',
      [status, notes, employeeId]
    );
  }
  const [rows] = await pool.execute(
    `SELECT e.id, u.first_name, u.last_name, u.photo_url, e.status
     FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
    [employeeId]
  );
  if (rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
  const row = rows[0];
  res.json({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: row.photo_url,
    status: row.status,
  });
});

router.delete('/:employeeId', async (req, res) => {
  const pool = getPool();
  await pool.execute('DELETE FROM employees WHERE id = ? AND company_id = ?', [
    req.params.employeeId,
    req.params.companyId,
  ]);
  res.status(204).end();
});

module.exports = router;
