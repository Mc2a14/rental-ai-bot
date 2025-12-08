// User Routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/user/login - User login
router.post('/login', (req, res) => userController.login(req, res));

// POST /api/user/register - User registration
router.post('/register', (req, res) => userController.register(req, res));

module.exports = router;

