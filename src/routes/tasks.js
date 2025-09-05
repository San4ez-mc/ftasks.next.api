const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router({ mergeParams: true });

router.use(auth);

function mapTask(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    dueDate: r.due_date,
    status: r.status,
    type: r.type,
    expectedTime: r.expected_time,
    actualTime: r.actual_time,
    expectedResult: r.expected_result,
    actualResult: r.actual_result,
    assigneeId: r.assignee_id,
    reporterId: r.reporter_id,
    resultId: r.result_id,
  };
}

router.get('/', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE company_id = ?', [
    req.params.companyId,
  ]);
  res.json(rows.map(mapTask));
});

router.post('/', async (req, res) => {
  const {
    title,
    description = null,
    dueDate = null,
    status = null,
    type = null,
    expectedTime = null,
    actualTime = null,
    expectedResult = null,
    actualResult = null,
    assigneeId = null,
    reporterId = null,
    resultId = null,
  } = req.body;
  if (!title)
    return res.status(400).json({ message: 'title is required' });
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO tasks (company_id, title, description, due_date, status, type, expected_time, actual_time, expected_result, actual_result, assignee_id, reporter_id, result_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.params.companyId,
      title,
      description,
      dueDate,
      status,
      type,
      expectedTime,
      actualTime,
      expectedResult,
      actualResult,
      assigneeId,
      reporterId,
      resultId,
    ]
  );
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(mapTask(rows[0]));
});

router.patch('/:taskId', async (req, res) => {
  const fields = [
    'title',
    'description',
    'due_date',
    'status',
    'type',
    'expected_time',
    'actual_time',
    'expected_result',
    'actual_result',
    'assignee_id',
    'reporter_id',
    'result_id',
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
  if (updates.length === 0) return res.json({ id: req.params.taskId });
  const pool = getPool();
  params.push(req.params.taskId);
  await pool.execute(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [
    req.params.taskId,
  ]);
  if (rows.length === 0) return res.status(404).json({ message: 'Task not found' });
  res.json(mapTask(rows[0]));
});

router.delete('/:taskId', async (req, res) => {
  const pool = getPool();
  await pool.execute('DELETE FROM tasks WHERE id = ? AND company_id = ?', [
    req.params.taskId,
    req.params.companyId,
  ]);
  res.status(204).end();
});

module.exports = router;
