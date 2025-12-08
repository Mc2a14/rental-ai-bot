// User Routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /api/user/login - User login
router.post('/login', (req, res) => userController.login(req, res));

// POST /api/user/register - User registration
router.post('/register', (req, res) => userController.register(req, res));

// GET /api/user/me - Get current user from session
router.get('/me', (req, res) => userController.getCurrentUser(req, res));

// POST /api/user/logout - Logout user
router.post('/logout', (req, res) => userController.logout(req, res));

module.exports = router;

