// User Routes
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/user/login - User login (stricter rate limiting to prevent brute force)
router.post('/login', authLimiter, (req, res) => userController.login(req, res));

// POST /api/user/register - User registration (stricter rate limiting)
router.post('/register', authLimiter, (req, res) => userController.register(req, res));

// GET /api/user/me - Get current user from session
router.get('/me', (req, res) => userController.getCurrentUser(req, res));

// POST /api/user/logout - Logout user
router.post('/logout', (req, res) => userController.logout(req, res));

// POST /api/user/reset-password - Reset user password
router.post('/reset-password', authLimiter, (req, res) => userController.resetPassword(req, res));

module.exports = router;

