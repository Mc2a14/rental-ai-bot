// Notification Controller
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const { propertyId } = req.params;
      const { limit = 50, unreadOnly = false } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const notifications = await notificationService.getNotifications(
        propertyId,
        parseInt(limit),
        unreadOnly === 'true'
      );

      return res.json({
        success: true,
        notifications
      });
    } catch (error) {
      logger.error('Notification controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving notifications'
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { propertyId } = req.params;
      const { notificationIds } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const success = await notificationService.markAsRead(
        propertyId,
        notificationIds || []
      );

      return res.json({
        success,
        message: success ? 'Notifications marked as read' : 'Failed to mark notifications as read'
      });
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      return res.status(500).json({
        success: false,
        message: 'Error marking notifications as read'
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const count = await notificationService.getUnreadCount(propertyId);

      return res.json({
        success: true,
        count
      });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting unread count'
      });
    }
  }
}

module.exports = new NotificationController();

