const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT p.* FROM processes p
     JOIN employees e ON p.company_id = e.company_id
     WHERE e.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { companyId, name, description = null } = req.body;
  if (!companyId || !name)
    return res.status(400).json({ message: 'companyId and name are required' });
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO processes (company_id, name, description) VALUES (?, ?, ?)',
    [companyId, name, description]
  );
  res.status(201).json({ id: result.insertId, companyId, name, description });
});

router.patch('/:processId', async (req, res) => {
  const { name, description } = req.body;
  const pool = getPool();
  const updates = [];
  const params = [];
  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (updates.length) {
    params.push(req.params.processId);
    await pool.execute(
      `UPDATE processes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }
  const [rows] = await pool.execute('SELECT * FROM processes WHERE id = ?', [
    req.params.processId,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Process not found' });
  res.json(rows[0]);
});

router.delete('/:processId', async (req, res) => {
  const pool = getPool();
  await pool.execute('DELETE FROM processes WHERE id = ?', [
    req.params.processId,
  ]);
  res.status(204).end();
});

module.exports = router;
