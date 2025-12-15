// Property Routes
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { propertySaveLimiter, generalLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

// POST /api/property/save - Save property configuration (stricter rate limiting)
router.post('/save', propertySaveLimiter, (req, res) => propertyController.saveProperty(req, res));

// POST /api/property/upload-image - Upload image for property
router.post('/upload-image', generalLimiter, upload.single('image'), (req, res) => propertyController.uploadImage(req, res));

// GET /api/property/:propertyId - Get property by ID
router.get('/:propertyId', (req, res) => propertyController.getProperty(req, res));

module.exports = router;

