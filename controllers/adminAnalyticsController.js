// Admin Analytics Controller - App-wide stats for developer
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class AdminAnalyticsController {
  async getAppStats(req, res) {
    try {
      const { days = 30 } = req.query;

      const stats = await analyticsService.getAppWideStats(parseInt(days));

      return res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Admin analytics controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving app-wide analytics'
      });
    }
  }
}

module.exports = new AdminAnalyticsController();

