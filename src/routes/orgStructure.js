const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router({ mergeParams: true });

router.use(auth);

router.get('/', async (req, res) => {
  const pool = getPool();
  const [divisions] = await pool.execute(
    'SELECT id, name FROM divisions WHERE company_id = ?',
    [req.params.companyId]
  );
  const [departments] = await pool.execute(
    `SELECT d.id, d.name, d.division_id, d.manager_id FROM departments d
     JOIN divisions dv ON d.division_id = dv.id WHERE dv.company_id = ?`,
    [req.params.companyId]
  );
  const structure = divisions.map((div) => ({
    id: div.id,
    name: div.name,
    type: 'division',
    departments: departments
      .filter((dep) => dep.division_id === div.id)
      .map((dep) => ({
        id: dep.id,
        name: dep.name,
        managerId: dep.manager_id,
        type: 'department',
      })),
  }));
  res.json(structure);
});

router.post('/', async (req, res) => {
  const { type, name, divisionId = null, managerId = null } = req.body;
  if (!type || !name) {
    return res.status(400).json({ message: 'type and name are required' });
  }
  const pool = getPool();
  if (type === 'division') {
    const [result] = await pool.execute(
      'INSERT INTO divisions (company_id, name) VALUES (?, ?)',
      [req.params.companyId, name]
    );
    return res
      .status(201)
      .json({ id: result.insertId, name, type: 'division' });
  }
  if (type === 'department') {
    if (!divisionId)
      return res.status(400).json({ message: 'divisionId is required' });
    const [result] = await pool.execute(
      'INSERT INTO departments (division_id, manager_id, name) VALUES (?, ?, ?)',
      [divisionId, managerId, name]
    );
    return res
      .status(201)
      .json({ id: result.insertId, name, divisionId, managerId, type: 'department' });
  }
  res.status(400).json({ message: 'Invalid type' });
});

router.patch('/:nodeId', async (req, res) => {
  const { name, managerId = null, divisionId = null } = req.body;
  const pool = getPool();
  const { nodeId } = req.params;
  const [divRes] = await pool.execute(
    'UPDATE divisions SET name = COALESCE(?, name) WHERE id = ? AND company_id = ?',
    [name, nodeId, req.params.companyId]
  );
  if (divRes.affectedRows) {
    const [rows] = await pool.execute(
      'SELECT id, name FROM divisions WHERE id = ?',
      [nodeId]
    );
    return res.json({ id: rows[0].id, name: rows[0].name, type: 'division' });
  }
  const [depRes] = await pool.execute(
    'UPDATE departments SET name = COALESCE(?, name), manager_id = COALESCE(?, manager_id), division_id = COALESCE(?, division_id) WHERE id = ?',
    [name, managerId, divisionId, nodeId]
  );
  if (!depRes.affectedRows)
    return res.status(404).json({ message: 'Node not found' });
  const [rows] = await pool.execute(
    'SELECT id, name, division_id, manager_id FROM departments WHERE id = ?',
    [nodeId]
  );
  res.json({
    id: rows[0].id,
    name: rows[0].name,
    divisionId: rows[0].division_id,
    managerId: rows[0].manager_id,
    type: 'department',
  });
});

router.delete('/:nodeId', async (req, res) => {
  const pool = getPool();
  const { nodeId } = req.params;
  const [depRes] = await pool.execute('DELETE FROM departments WHERE id = ?', [
    nodeId,
  ]);
  if (depRes.affectedRows) return res.status(204).end();
  await pool.execute('DELETE FROM departments WHERE division_id = ?', [nodeId]);
  await pool.execute('DELETE FROM divisions WHERE id = ? AND company_id = ?', [
    nodeId,
    req.params.companyId,
  ]);
  res.status(204).end();
});

module.exports = router;
