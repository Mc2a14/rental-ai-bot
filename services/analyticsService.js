// Analytics Service - Track questions and generate insights
const database = require('../utils/database');
const logger = require('../utils/logger');

class AnalyticsService {
  async trackQuestion(propertyId, questionText, responseText, language = 'en', category = null) {
    try {
      if (!await this.ensureDatabase()) {
        logger.warn('Database not available, skipping question tracking');
        return null;
      }

      const result = await database.query(
        `INSERT INTO questions (property_id, question_text, response_text, question_language, category)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [propertyId, questionText, responseText, language, category]
      );

      logger.info(`Question tracked: ${questionText.substring(0, 50)}...`);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error tracking question:', error);
      return null;
    }
  }

  async recordFeedback(questionId, helpful) {
    try {
      if (!await this.ensureDatabase()) {
        return false;
      }

      await database.query(
        `UPDATE questions SET response_helpful = $1 WHERE id = $2`,
        [helpful, questionId]
      );

      logger.info(`Feedback recorded: ${helpful ? 'helpful' : 'not helpful'}`);
      return true;
    } catch (error) {
      logger.error('Error recording feedback:', error);
      return false;
    }
  }

  async getQuestionStats(propertyId, days = 30) {
    try {
      if (!await this.ensureDatabase()) {
        return this.getEmptyStats();
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Total questions
      const totalResult = await database.query(
        `SELECT COUNT(*) as count FROM questions 
         WHERE property_id = $1 AND created_at >= $2`,
        [propertyId, since]
      );

      // Questions by category
      const categoryResult = await database.query(
        `SELECT category, COUNT(*) as count 
         FROM questions 
         WHERE property_id = $1 AND created_at >= $2 AND category IS NOT NULL
         GROUP BY category
         ORDER BY count DESC
         LIMIT 10`,
        [propertyId, since]
      );

      // Most frequent questions
      const frequentResult = await database.query(
        `SELECT question_text, COUNT(*) as frequency, 
                AVG(CASE WHEN response_helpful = true THEN 1 ELSE 0 END) as helpful_rate
         FROM questions 
         WHERE property_id = $1 AND created_at >= $2
         GROUP BY question_text
         ORDER BY frequency DESC
         LIMIT 20`,
        [propertyId, since]
      );

      // Questions by language
      const languageResult = await database.query(
        `SELECT question_language, COUNT(*) as count 
         FROM questions 
         WHERE property_id = $1 AND created_at >= $2
         GROUP BY question_language
         ORDER BY count DESC`,
        [propertyId, since]
      );

      // Helpful rate
      const helpfulResult = await database.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN response_helpful = true THEN 1 ELSE 0 END) as helpful
         FROM questions 
         WHERE property_id = $1 AND created_at >= $2 AND response_helpful IS NOT NULL`,
        [propertyId, since]
      );

      // Questions over time (daily)
      const timeSeriesResult = await database.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM questions 
         WHERE property_id = $1 AND created_at >= $2
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [propertyId, since]
      );

      return {
        total: parseInt(totalResult.rows[0]?.count || 0),
        byCategory: categoryResult.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count)
        })),
        frequentQuestions: frequentResult.rows.map(r => ({
          question: r.question_text,
          frequency: parseInt(r.frequency),
          helpfulRate: parseFloat(r.helpful_rate || 0)
        })),
        byLanguage: languageResult.rows.map(r => ({
          language: r.question_language,
          count: parseInt(r.count)
        })),
        helpfulRate: helpfulResult.rows[0]?.total > 0
          ? (helpfulResult.rows[0].helpful / helpfulResult.rows[0].total) * 100
          : 0,
        timeSeries: timeSeriesResult.rows.map(r => ({
          date: r.date.toISOString().split('T')[0],
          count: parseInt(r.count)
        }))
      };
    } catch (error) {
      logger.error('Error getting question stats:', error);
      return this.getEmptyStats();
    }
  }

  async generateFAQs(propertyId, minFrequency = 3) {
    try {
      if (!await this.ensureDatabase()) {
        return [];
      }

      // Find questions asked multiple times
      const result = await database.query(
        `SELECT question_text, COUNT(*) as frequency,
                STRING_AGG(DISTINCT response_text, ' | ') as responses
         FROM questions 
         WHERE property_id = $1
         GROUP BY question_text
         HAVING COUNT(*) >= $2
         ORDER BY frequency DESC
         LIMIT 20`,
        [propertyId, minFrequency]
      );

      const faqs = result.rows.map(row => ({
        question: row.question_text,
        answer: this.extractBestAnswer(row.responses),
        frequency: parseInt(row.frequency)
      }));

      // Save or update FAQs
      for (const faq of faqs) {
        await this.saveFAQ(propertyId, faq.question, faq.answer, faq.frequency);
      }

      return faqs;
    } catch (error) {
      logger.error('Error generating FAQs:', error);
      return [];
    }
  }

  async saveFAQ(propertyId, question, answer, frequency) {
    try {
      if (!await this.ensureDatabase()) {
        return false;
      }

      // Check if FAQ already exists
      const existing = await database.query(
        `SELECT id FROM faqs WHERE property_id = $1 AND question = $2`,
        [propertyId, question]
      );

      if (existing.rows.length > 0) {
        // Update existing FAQ
        await database.query(
          `UPDATE faqs SET answer = $1, frequency = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [answer, frequency, existing.rows[0].id]
        );
      } else {
        // Create new FAQ
        await database.query(
          `INSERT INTO faqs (property_id, question, answer, frequency)
           VALUES ($1, $2, $3, $4)`,
          [propertyId, question, answer, frequency]
        );
      }

      return true;
    } catch (error) {
      logger.error('Error saving FAQ:', error);
      return false;
    }
  }

  async getFAQs(propertyId) {
    try {
      if (!await this.ensureDatabase()) {
        return [];
      }

      const result = await database.query(
        `SELECT id, question, answer, frequency, helpful_count, language
         FROM faqs 
         WHERE property_id = $1 AND is_active = true
         ORDER BY frequency DESC, helpful_count DESC
         LIMIT 50`,
        [propertyId]
      );

      return result.rows.map(r => ({
        id: r.id,
        question: r.question,
        answer: r.answer,
        frequency: parseInt(r.frequency),
        helpfulCount: parseInt(r.helpful_count),
        language: r.language
      }));
    } catch (error) {
      logger.error('Error getting FAQs:', error);
      return [];
    }
  }

  extractBestAnswer(responses) {
    // Take the first response, or find the most common one
    if (!responses) return '';
    const responseList = responses.split(' | ');
    return responseList[0] || '';
  }

  categorizeQuestion(questionText) {
    const lower = questionText.toLowerCase();
    
    if (lower.match(/\b(wifi|internet|wi-fi|red|conexión|connexion)\b/)) return 'WiFi';
    if (lower.match(/\b(check.?in|check.?out|arrival|departure|llegada|salida)\b/)) return 'Check-in/out';
    if (lower.match(/\b(beach|playa|plage|restaurant|restaurante|food|comida|nourriture)\b/)) return 'Recommendations';
    if (lower.match(/\b(emergency|emergencia|urgence|urgent|911)\b/)) return 'Emergency';
    if (lower.match(/\b(appliance|electrodoméstico|appareil|oven|horno|washer|lavadora)\b/)) return 'Appliances';
    if (lower.match(/\b(parking|parking|estacionamiento|stationnement)\b/)) return 'Parking';
    if (lower.match(/\b(key|llave|clé|access|acceso|entrance|entrada)\b/)) return 'Access';
    
    return 'Other';
  }

  async ensureDatabase() {
    try {
      await database.connect();
      return database.pool !== null;
    } catch (error) {
      return false;
    }
  }

  getEmptyStats() {
    return {
      total: 0,
      byCategory: [],
      frequentQuestions: [],
      byLanguage: [],
      helpfulRate: 0,
      timeSeries: []
    };
  }
}

module.exports = new AnalyticsService();

