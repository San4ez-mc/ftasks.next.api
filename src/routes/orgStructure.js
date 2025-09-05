const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(auth);

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(201).json({ id: 'node-1', ...req.body });
});

router.patch('/:nodeId', (req, res) => {
  res.json({ id: req.params.nodeId, ...req.body });
});

router.delete('/:nodeId', (req, res) => {
  res.status(204).end();
});

module.exports = router;
