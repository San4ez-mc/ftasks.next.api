const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT i.* FROM instructions i
     JOIN employees e ON i.company_id = e.company_id
     WHERE e.user_id = ?`,
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const {
    companyId,
    title,
    content = null,
    department = null,
    accessList = [],
  } = req.body;
  if (!companyId || !title)
    return res
      .status(400)
      .json({ message: 'companyId and title are required' });
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO instructions (company_id, title, content, department) VALUES (?, ?, ?, ?)',
    [companyId, title, content, department]
  );
  const instructionId = result.insertId;
  for (const item of accessList) {
    await pool.execute(
      'INSERT INTO instruction_access (instruction_id, user_id, access_level) VALUES (?, ?, ?)',
      [instructionId, item.userId, item.access]
    );
  }
  const [rows] = await pool.execute('SELECT * FROM instructions WHERE id = ?', [
    instructionId,
  ]);
  res.status(201).json(rows[0]);
});

router.patch('/:instructionId', async (req, res) => {
  const { title, content, department, accessList } = req.body;
  const pool = getPool();
  const updates = [];
  const params = [];
  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (content !== undefined) {
    updates.push('content = ?');
    params.push(content);
  }
  if (department !== undefined) {
    updates.push('department = ?');
    params.push(department);
  }
  if (updates.length) {
    params.push(req.params.instructionId);
    await pool.execute(
      `UPDATE instructions SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }
  if (Array.isArray(accessList)) {
    await pool.execute(
      'DELETE FROM instruction_access WHERE instruction_id = ?',
      [req.params.instructionId]
    );
    for (const item of accessList) {
      await pool.execute(
        'INSERT INTO instruction_access (instruction_id, user_id, access_level) VALUES (?, ?, ?)',
        [req.params.instructionId, item.userId, item.access]
      );
    }
  }
  const [rows] = await pool.execute(
    'SELECT * FROM instructions WHERE id = ?',
    [req.params.instructionId]
  );
  if (!rows.length)
    return res.status(404).json({ message: 'Instruction not found' });
  res.json(rows[0]);
});

module.exports = router;
