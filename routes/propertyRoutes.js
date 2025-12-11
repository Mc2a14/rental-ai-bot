// Property Routes
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { propertySaveLimiter } = require('../middleware/rateLimiter');

// POST /api/property/save - Save property configuration (stricter rate limiting)
router.post('/save', propertySaveLimiter, (req, res) => propertyController.saveProperty(req, res));

// GET /api/property/:propertyId - Get property by ID
router.get('/:propertyId', (req, res) => propertyController.getProperty(req, res));

module.exports = router;

