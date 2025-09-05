const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/groups', (req, res) => {
  res.json([]);
});

router.post('/groups/link', (req, res) => {
  res.json({ id: 'group-1', ...req.body });
});

router.get('/groups/:groupId/members', (req, res) => {
  res.json([]);
});

module.exports = router;
