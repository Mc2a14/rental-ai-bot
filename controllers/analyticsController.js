// Analytics Controller
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class AnalyticsController {
  async getStats(req, res) {
    try {
      const { propertyId } = req.params;
      const { days = 30 } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const questionStats = await analyticsService.getQuestionStats(propertyId, parseInt(days));
      const pageViewStats = await analyticsService.getPageViewStats(propertyId, parseInt(days));

      return res.json({
        success: true,
        stats: {
          ...questionStats,
          pageViews: pageViewStats
        }
      });
    } catch (error) {
      logger.error('Analytics controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving analytics'
      });
    }
  }

  async recordFeedback(req, res) {
    try {
      const { questionId, helpful } = req.body;

      if (!questionId || typeof helpful !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Question ID and helpful status are required'
        });
      }

      const success = await analyticsService.recordFeedback(questionId, helpful);

      return res.json({
        success,
        message: success ? 'Feedback recorded' : 'Failed to record feedback'
      });
    } catch (error) {
      logger.error('Feedback recording error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error recording feedback'
      });
    }
  }

  async getSuccessfulPatterns(req, res) {
    try {
      const { propertyId } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const patterns = await analyticsService.getSuccessfulPatterns(propertyId, limit);

      return res.json({
        success: true,
        patterns: patterns
      });
    } catch (error) {
      logger.error('Error getting successful patterns:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving successful patterns'
      });
    }
  }

  async getFAQs(req, res) {
    try {
      const { propertyId } = req.params;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const faqs = await analyticsService.getFAQs(propertyId);

      return res.json({
        success: true,
        faqs
      });
    } catch (error) {
      logger.error('FAQs retrieval error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving FAQs'
      });
    }
  }

  async generateFAQs(req, res) {
    try {
      const { propertyId } = req.params;
      const { minFrequency = 3 } = req.query;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      const faqs = await analyticsService.generateFAQs(propertyId, parseInt(minFrequency));

      return res.json({
        success: true,
        faqs,
        message: `Generated ${faqs.length} FAQs`
      });
    } catch (error) {
      logger.error('FAQ generation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating FAQs'
      });
    }
  }

  async trackPageView(req, res) {
    try {
      const { propertyId } = req.params;
      const sessionId = req.sessionID || null;
      const ipAddress = req.ip || req.connection.remoteAddress || null;
      const userAgent = req.get('user-agent') || null;
      const referrer = req.get('referer') || req.get('referrer') || null;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      await analyticsService.trackPageView(propertyId, sessionId, ipAddress, userAgent, referrer);

      return res.json({
        success: true,
        message: 'Page view tracked'
      });
    } catch (error) {
      logger.error('Page view tracking error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error tracking page view'
      });
    }
  }
}

module.exports = new AnalyticsController();

