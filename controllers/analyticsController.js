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

      const stats = await analyticsService.getQuestionStats(propertyId, parseInt(days));

      return res.json({
        success: true,
        stats
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
}

module.exports = new AnalyticsController();

