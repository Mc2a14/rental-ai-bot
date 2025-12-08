// Chat Routes
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// POST /chat/ai - Main AI chat endpoint
router.post('/ai', (req, res) => chatController.handleChat(req, res));

module.exports = router;

