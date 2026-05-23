const express = require('express');

const auraController = require('../controllers/auraController');

const router = express.Router();

router.post('/chat', auraController.chat);

module.exports = router;
