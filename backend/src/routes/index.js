const express = require('express');

const exampleController = require('../controllers/exampleController');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sira-backend' });
});

router.get('/example', exampleController.getExample);

module.exports = router;
