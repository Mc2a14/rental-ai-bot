// Chat Controller
const aiService = require('../services/aiService');
const analyticsService = require('../services/analyticsService');
const notificationService = require('../services/notificationService');
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
      
      // Get successful patterns to improve AI responses
      let enhancedSystemMessage = systemMessage;
      if (propertyId) {
        try {
          // Get best answers for similar questions
          const bestAnswers = await analyticsService.getBestAnswersForQuestion(
            propertyId,
            message.trim(),
            language,
            3
          );
          
          if (bestAnswers.length > 0) {
            enhancedSystemMessage += '\n\nLEARNED FROM SUCCESSFUL INTERACTIONS:\n';
            enhancedSystemMessage += 'The following question-answer pairs received positive feedback from guests. Use these as examples of effective responses:\n\n';
            
            bestAnswers.forEach((pattern, index) => {
              enhancedSystemMessage += `${index + 1}. Question: "${pattern.question}"\n`;
              enhancedSystemMessage += `   Successful Answer: "${pattern.answer}"\n`;
              enhancedSystemMessage += `   (Rated helpful ${pattern.helpfulCount} times, ${Math.round(pattern.helpfulRate * 100)}% helpful rate)\n\n`;
            });
            
            enhancedSystemMessage += 'When answering similar questions, try to match the style and approach of these successful responses.\n';
            logger.info(`Enhanced system message with ${bestAnswers.length} successful patterns`);
          }
        } catch (error) {
          logger.warn('Error getting successful patterns, continuing without them:', error);
          // Continue without enhanced message if there's an error
        }
      }
      
      // Process chat
      const result = await aiService.chat(
        message.trim(),
        hostConfig,
        enhancedSystemMessage,
        language
      );
      
      // Check for check-in/check-out notifications
      if (propertyId) {
        try {
          const notificationType = notificationService.detectCheckInOut(message);
          logger.info(`🔍 Checking notification for message: "${message.substring(0, 50)}..." - Detected: ${notificationType || 'none'}`);
          if (notificationType) {
            const notificationId = await notificationService.recordNotification(
              propertyId,
              notificationType,
              message.trim()
            );
            if (notificationId) {
              logger.info(`📢 ${notificationType} notification detected and recorded (ID: ${notificationId})`);
            } else {
              logger.warn(`⚠️ Failed to record ${notificationType} notification`);
            }
          }
        } catch (err) {
          logger.error('Error recording notification:', err);
          // Continue even if notification recording fails
        }
      } else {
        logger.warn('⚠️ No propertyId provided, skipping notification detection');
      }

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

