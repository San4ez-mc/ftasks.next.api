const express = require('express');
const auth = require('../middleware/auth');
const { getPool } = require('../db');

const router = express.Router();

router.use(auth);

router.get('/groups', async (req, res) => {
  const { companyId } = req.query;
  if (!companyId)
    return res.status(400).json({ message: 'companyId is required' });
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM telegram_groups WHERE company_id = ?',
    [companyId]
  );
  res.json(rows);
});

router.post('/groups/link', async (req, res) => {
  const { companyId, tgGroupId, title } = req.body;
  if (!companyId || !tgGroupId || !title)
    return res
      .status(400)
      .json({ message: 'companyId, tgGroupId and title are required' });
  const pool = getPool();
  const [result] = await pool.execute(
    'INSERT INTO telegram_groups (company_id, tg_group_id, title, linked_at) VALUES (?, ?, ?, NOW())',
    [companyId, tgGroupId, title]
  );
  res.json({ id: result.insertId, companyId, tgGroupId, title });
});

router.get('/groups/:groupId/members', async (req, res) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM telegram_members WHERE tg_group_id = ?',
    [req.params.groupId]
  );
  res.json(rows);
});

module.exports = router;
