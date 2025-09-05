const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router({ mergeParams: true });

router.use(auth);

function mapResult(row, subs) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    completed: !!row.completed,
    deadline: row.deadline,
    assigneeId: row.assignee_id,
    reporterId: row.reporter_id,
    description: row.description,
    expectedResult: row.expected_result,
    subResults: subs.map((s) => ({
      id: s.id,
      name: s.name,
      completed: !!s.completed,
    })),
  };
}

router.get('/', async (req, res) => {
  const pool = getPool();
  const [results] = await pool.execute(
    'SELECT * FROM results WHERE company_id = ?',
    [req.params.companyId]
  );
  const ids = results.map((r) => r.id);
  let subs = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(
      `SELECT * FROM sub_results WHERE result_id IN (${placeholders})`,
      ids
    );
    subs = rows;
  }
  res.json(
    results.map((r) =>
      mapResult(
        r,
        subs.filter((s) => s.result_id === r.id)
      )
    )
  );
});

router.post('/', async (req, res) => {
  const {
    name,
    description = null,
    status = null,
    completed = false,
    deadline = null,
    assigneeId = null,
    reporterId = null,
    expectedResult = null,
    subResults = [],
  } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  const pool = getPool();
  const [resultInsert] = await pool.execute(
    `INSERT INTO results (company_id, name, description, status, completed, deadline, assignee_id, reporter_id, expected_result)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.companyId,
      name,
      description,
      status,
      completed,
      deadline,
      assigneeId,
      reporterId,
      expectedResult,
    ]
  );
  const resultId = resultInsert.insertId;
  for (const [index, sr] of subResults.entries()) {
    await pool.execute(
      'INSERT INTO sub_results (result_id, name, completed, `order`) VALUES (?, ?, ?, ?)',
      [resultId, sr.name, sr.completed || false, index]
    );
  }
  const [rows] = await pool.execute('SELECT * FROM results WHERE id = ?', [resultId]);
  const [srRows] = await pool.execute(
    'SELECT * FROM sub_results WHERE result_id = ? ORDER BY `order`',
    [resultId]
  );
  res.status(201).json(mapResult(rows[0], srRows));
});

router.patch('/:resultId', async (req, res) => {
  const fields = [
    'name',
    'description',
    'status',
    'completed',
    'deadline',
    'assignee_id',
    'reporter_id',
    'expected_result',
  ];
  const updates = [];
  const params = [];
  fields.forEach((field) => {
    const camel = field
      .split('_')
      .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w))
      .join('');
    if (req.body[camel] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(req.body[camel]);
    }
  });
  const pool = getPool();
  if (updates.length) {
    params.push(req.params.resultId);
    await pool.execute(
      `UPDATE results SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }
  const [rows] = await pool.execute('SELECT * FROM results WHERE id = ?', [
    req.params.resultId,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Result not found' });
  const [subRows] = await pool.execute(
    'SELECT * FROM sub_results WHERE result_id = ? ORDER BY `order`',
    [req.params.resultId]
  );
  res.json(mapResult(rows[0], subRows));
});

router.delete('/:resultId', async (req, res) => {
  const pool = getPool();
  await pool.execute('DELETE FROM sub_results WHERE result_id = ?', [
    req.params.resultId,
  ]);
  await pool.execute('DELETE FROM results WHERE id = ? AND company_id = ?', [
    req.params.resultId,
    req.params.companyId,
  ]);
  res.status(204).end();
});

module.exports = router;

