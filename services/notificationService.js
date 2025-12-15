// Notification Service - Handle check-in/check-out notifications
const database = require('../utils/database');
const logger = require('../utils/logger');

class NotificationService {
  async ensureDatabase() {
    return !!database.pool;
  }

  /**
   * Detect if a message is a check-in or check-out notification
   * @param {string} message - The guest's message
   * @returns {string|null} - 'check_in', 'check_out', or null
   */
  detectCheckInOut(message) {
    if (!message || typeof message !== 'string') return null;

    const lowerMessage = message.toLowerCase().trim();
    
    // Check-in patterns (including past tense, typos, and variations)
    const checkInPatterns = [
      /^(i\s+)?(just\s+)?checked\s+in/i,
      /^(i\s+)?(just\s+)?cheked\s+in/i,  // Handle typo "cheked"
      /^(i\s+)?(just\s+)?check\s+in/i,
      /^(i\s+)?(just\s+)?arrived/i,
      /^(i\s+)?(just\s+)?got\s+here/i,
      /^(i\s+)?(just\s+)?made\s+it/i,
      /^(i\s+)?(just\s+)?here\s+now/i,
      /^checked\s+in/i,  // "Checked in" at start
      /^cheked\s+in/i,   // "Cheked in" at start (typo)
      /^check\s+in/i,    // "Check in" at start
      /(i\s+)?(just\s+)?checked\s+in/i,  // More flexible - anywhere in message
      /(i\s+)?(just\s+)?cheked\s+in/i,   // Typo version
      /check\s*[- ]?in/i,
      /checkin/i,
      /arrived\s+at\s+the\s+property/i,
      /arrived\s+at\s+the\s+place/i,
      /i'm\s+here/i,
      /im\s+here/i,
      /we\s+arrived/i,
      /we\s+just\s+arrived/i,
      /we're\s+here/i,
      /were\s+here/i,
      /we\s+checked\s+in/i,
      /we\s+cheked\s+in/i,  // Typo version
      /we\s+check\s+in/i
    ];

    // Check-out patterns (including past tense and variations)
    const checkOutPatterns = [
      /^(i\s+)?(just\s+)?checked\s+out/i,
      /^(i\s+)?(just\s+)?check\s+out/i,
      /^(i\s+)?(just\s+)?left/i,
      /^(i\s+)?(just\s+)?departed/i,
      /^(i\s+)?(just\s+)?on\s+my\s+way\s+out/i,
      /^checked\s+out/i,  // "Checked out" at start
      /^check\s+out/i,    // "Check out" at start
      /check\s*[- ]?out/i,
      /checkout/i,
      /left\s+the\s+property/i,
      /left\s+the\s+place/i,
      /we\s+left/i,
      /we\s+just\s+left/i,
      /we're\s+leaving/i,
      /were\s+leaving/i,
      /we\s+departed/i,
      /we\s+checked\s+out/i,
      /we\s+check\s+out/i
    ];

    // Check for check-in first (more specific patterns)
    for (const pattern of checkInPatterns) {
      if (pattern.test(lowerMessage)) {
        // Make sure it's not a question about check-in times
        if (!lowerMessage.includes('what') && !lowerMessage.includes('when') && 
            !lowerMessage.includes('time') && !lowerMessage.includes('?') &&
            !lowerMessage.includes('how')) {
          return 'check_in';
        }
      }
    }

    // Check for check-out
    for (const pattern of checkOutPatterns) {
      if (pattern.test(lowerMessage)) {
        // Make sure it's not a question about check-out times
        if (!lowerMessage.includes('what') && !lowerMessage.includes('when') && 
            !lowerMessage.includes('time') && !lowerMessage.includes('?') &&
            !lowerMessage.includes('how')) {
          return 'check_out';
        }
      }
    }

    return null;
  }

  /**
   * Record a check-in or check-out notification
   * @param {string} propertyId - The property ID
   * @param {string} notificationType - 'check_in' or 'check_out'
   * @param {string} guestMessage - The original guest message
   * @returns {Promise<number|null>} - Notification ID or null
   */
  async recordNotification(propertyId, notificationType, guestMessage) {
    try {
      if (!await this.ensureDatabase()) {
        logger.warn('Database not available, skipping notification recording');
        return null;
      }

      if (!propertyId || !notificationType || !['check_in', 'check_out'].includes(notificationType)) {
        logger.warn('Invalid notification data');
        return null;
      }

      const result = await database.query(
        `INSERT INTO check_in_out_notifications (property_id, notification_type, guest_message)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [propertyId, notificationType, guestMessage || null]
      );

      logger.info(`✅ ${notificationType} notification recorded for property ${propertyId}`);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error recording notification:', error);
      return null;
    }
  }

  /**
   * Get notifications for a property
   * @param {string} propertyId - The property ID
   * @param {number} limit - Maximum number of notifications to return
   * @param {boolean} unreadOnly - Only return unread notifications
   * @returns {Promise<Array>} - Array of notifications
   */
  async getNotifications(propertyId, limit = 50, unreadOnly = false) {
    try {
      if (!await this.ensureDatabase()) {
        return [];
      }

      let query = `
        SELECT id, property_id, notification_type, guest_message, timestamp, read
        FROM check_in_out_notifications
        WHERE property_id = $1
      `;

      const params = [propertyId];

      if (unreadOnly) {
        query += ' AND read = false';
      }

      query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await database.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   * @param {string} propertyId - The property ID
   * @param {Array<number>} notificationIds - Array of notification IDs to mark as read
   * @returns {Promise<boolean>} - Success status
   */
  async markAsRead(propertyId, notificationIds) {
    try {
      if (!await this.ensureDatabase()) {
        return false;
      }

      if (!notificationIds || notificationIds.length === 0) {
        // Mark all unread notifications for this property as read
        await database.query(
          `UPDATE check_in_out_notifications 
           SET read = true 
           WHERE property_id = $1 AND read = false`,
          [propertyId]
        );
      } else {
        // Mark specific notifications as read
        await database.query(
          `UPDATE check_in_out_notifications 
           SET read = true 
           WHERE property_id = $1 AND id = ANY($2::int[])`,
          [propertyId, notificationIds]
        );
      }

      logger.info(`Marked notifications as read for property ${propertyId}`);
      return true;
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a property
   * @param {string} propertyId - The property ID
   * @returns {Promise<number>} - Count of unread notifications
   */
  async getUnreadCount(propertyId) {
    try {
      if (!await this.ensureDatabase()) {
        return 0;
      }

      const result = await database.query(
        `SELECT COUNT(*) as count
         FROM check_in_out_notifications
         WHERE property_id = $1 AND read = false`,
        [propertyId]
      );

      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete a single notification
   * @param {string} propertyId - The property ID
   * @param {number} notificationId - The notification ID to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteNotification(propertyId, notificationId) {
    try {
      if (!await this.ensureDatabase()) {
        return false;
      }

      await database.query(
        `DELETE FROM check_in_out_notifications 
         WHERE property_id = $1 AND id = $2`,
        [propertyId, notificationId]
      );

      logger.info(`Deleted notification ${notificationId} for property ${propertyId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a property
   * @param {string} propertyId - The property ID
   * @returns {Promise<boolean>} - Success status
   */
  async clearAllNotifications(propertyId) {
    try {
      if (!await this.ensureDatabase()) {
        return false;
      }

      await database.query(
        `DELETE FROM check_in_out_notifications 
         WHERE property_id = $1`,
        [propertyId]
      );

      logger.info(`Cleared all notifications for property ${propertyId}`);
      return true;
    } catch (error) {
      logger.error('Error clearing notifications:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();

