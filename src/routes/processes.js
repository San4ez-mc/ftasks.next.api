const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(201).json({ id: 'process-1', ...req.body });
});

router.patch('/:processId', (req, res) => {
  res.json({ id: req.params.processId, ...req.body });
});

router.delete('/:processId', (req, res) => {
  res.status(204).end();
});

module.exports = router;
