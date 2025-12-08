// Property Routes
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// POST /api/property/save - Save property configuration
router.post('/save', (req, res) => propertyController.saveProperty(req, res));

// GET /api/property/:propertyId - Get property by ID
router.get('/:propertyId', (req, res) => propertyController.getProperty(req, res));

module.exports = router;

