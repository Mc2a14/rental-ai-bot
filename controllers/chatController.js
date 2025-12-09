// Chat Controller
const aiService = require('../services/aiService');
const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class ChatController {
  async handleChat(req, res) {
    try {
      const { message, language = 'en', hostConfig = null, systemMessage = '', propertyId = null } = req.body;
      
      // Validation
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }
      
      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Message is too long (max 1000 characters)'
        });
      }
      
      logger.info(`Chat request: ${message.substring(0, 50)}...`);
      
      // Process chat
      const result = await aiService.chat(
        message.trim(),
        hostConfig,
        systemMessage,
        language
      );
      
      // Track question for analytics
      let questionId = null;
      if (result.success && propertyId) {
        try {
          const category = analyticsService.categorizeQuestion(message);
          questionId = await analyticsService.trackQuestion(
            propertyId,
            message.trim(),
            result.response,
            language,
            category
          );
        } catch (err) {
          logger.error('Error tracking question:', err);
          // Continue even if tracking fails
        }
      }
      
      if (result.success) {
        return res.json({
          success: true,
          response: result.response,
          usingCustomConfig: result.usingCustomConfig,
          questionId: questionId
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.response,
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Chat controller error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error. Please try again later.'
      });
    }
  }
}

module.exports = new ChatController();

