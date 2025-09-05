const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(201).json({ id: 'instruction-1', ...req.body });
});

router.patch('/:instructionId', (req, res) => {
  res.json({ id: req.params.instructionId, ...req.body });
});

module.exports = router;
