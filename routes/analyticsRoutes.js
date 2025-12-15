// Analytics Routes
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const notificationController = require('../controllers/notificationController');

// Get analytics stats for a property
router.get('/property/:propertyId/stats', analyticsController.getStats.bind(analyticsController));

// Record feedback on a response
router.post('/feedback', analyticsController.recordFeedback.bind(analyticsController));

// Get successful patterns for a property
router.get('/property/:propertyId/patterns', analyticsController.getSuccessfulPatterns.bind(analyticsController));

// Get FAQs for a property
router.get('/property/:propertyId/faqs', analyticsController.getFAQs.bind(analyticsController));

// Generate FAQs from frequent questions
router.post('/property/:propertyId/generate-faqs', analyticsController.generateFAQs.bind(analyticsController));

// Notification routes
router.get('/property/:propertyId/notifications', notificationController.getNotifications.bind(notificationController));
router.post('/property/:propertyId/notifications/mark-read', notificationController.markAsRead.bind(notificationController));
router.get('/property/:propertyId/notifications/unread-count', notificationController.getUnreadCount.bind(notificationController));

module.exports = router;

