const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(auth);

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(201).json({ id: 'employee-1', ...req.body });
});

router.patch('/:employeeId', (req, res) => {
  res.json({ id: req.params.employeeId, ...req.body });
});

router.delete('/:employeeId', (req, res) => {
  res.status(204).end();
});

module.exports = router;
