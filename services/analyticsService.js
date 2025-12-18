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

  async trackPageView(propertyId, sessionId = null, ipAddress = null, userAgent = null, referrer = null) {
    try {
      if (!await this.ensureDatabase()) {
        logger.warn('Database not available, skipping page view tracking');
        return null;
      }

      const result = await database.query(
        `INSERT INTO page_views (property_id, session_id, ip_address, user_agent, referrer)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [propertyId, sessionId, ipAddress, userAgent, referrer]
      );

      logger.info(`Page view tracked for property: ${propertyId}`);
      return result.rows[0].id;
    } catch (error) {
      logger.error('Error tracking page view:', error);
      return null;
    }
  }

  async getPageViewStats(propertyId, days = 30) {
    try {
      if (!await this.ensureDatabase()) {
        return {
          totalViews: 0,
          uniqueVisitors: 0,
          viewsByDay: [],
          recentViews: []
        };
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Total views
      const totalResult = await database.query(
        `SELECT COUNT(*) as count FROM page_views 
         WHERE property_id = $1 AND viewed_at >= $2`,
        [propertyId, since]
      );

      // Unique visitors (by session_id or ip_address)
      const uniqueResult = await database.query(
        `SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) as count 
         FROM page_views 
         WHERE property_id = $1 AND viewed_at >= $2`,
        [propertyId, since]
      );

      // Views by day
      const dailyResult = await database.query(
        `SELECT DATE(viewed_at) as date, COUNT(*) as count
         FROM page_views 
         WHERE property_id = $1 AND viewed_at >= $2
         GROUP BY DATE(viewed_at)
         ORDER BY date DESC`,
        [propertyId, since]
      );

      // Recent views (last 10)
      const recentResult = await database.query(
        `SELECT viewed_at, session_id, ip_address, referrer
         FROM page_views 
         WHERE property_id = $1 AND viewed_at >= $2
         ORDER BY viewed_at DESC
         LIMIT 10`,
        [propertyId, since]
      );

      return {
        totalViews: parseInt(totalResult.rows[0]?.count || 0),
        uniqueVisitors: parseInt(uniqueResult.rows[0]?.count || 0),
        viewsByDay: dailyResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        recentViews: recentResult.rows.map(row => ({
          viewedAt: row.viewed_at,
          sessionId: row.session_id,
          ipAddress: row.ip_address,
          referrer: row.referrer
        }))
      };
    } catch (error) {
      logger.error('Error getting page view stats:', error);
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        viewsByDay: [],
        recentViews: []
      };
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

  async getSuccessfulPatterns(propertyId, limit = 10) {
    try {
      if (!await this.ensureDatabase()) {
        return [];
      }

      // Get question-answer pairs that received positive feedback
      // Prioritize by helpful rate and frequency
      const result = await database.query(
        `SELECT 
           question_text,
           response_text,
           question_language,
           category,
           COUNT(*) as frequency,
           SUM(CASE WHEN response_helpful = true THEN 1 ELSE 0 END) as helpful_count,
           AVG(CASE WHEN response_helpful = true THEN 1.0 ELSE 0.0 END) as helpful_rate
         FROM questions 
         WHERE property_id = $1 
           AND response_helpful IS NOT NULL
           AND response_text IS NOT NULL
           AND response_text != ''
         GROUP BY question_text, response_text, question_language, category
         HAVING SUM(CASE WHEN response_helpful = true THEN 1 ELSE 0 END) > 0
         ORDER BY helpful_rate DESC, helpful_count DESC, frequency DESC
         LIMIT $2`,
        [propertyId, limit]
      );

      return result.rows.map(r => ({
        question: r.question_text,
        answer: r.response_text,
        language: r.question_language,
        category: r.category,
        frequency: parseInt(r.frequency),
        helpfulCount: parseInt(r.helpful_count),
        helpfulRate: parseFloat(r.helpful_rate)
      }));
    } catch (error) {
      logger.error('Error getting successful patterns:', error);
      return [];
    }
  }

  async getBestAnswersForQuestion(propertyId, questionText, language = 'en', limit = 3) {
    try {
      if (!await this.ensureDatabase()) {
        return [];
      }

      // Find similar questions (using text similarity) that got helpful responses
      // This helps the AI learn from successful answers to similar questions
      const result = await database.query(
        `SELECT 
           question_text,
           response_text,
           question_language,
           category,
           COUNT(*) as frequency,
           SUM(CASE WHEN response_helpful = true THEN 1 ELSE 0 END) as helpful_count,
           AVG(CASE WHEN response_helpful = true THEN 1.0 ELSE 0.0 END) as helpful_rate
         FROM questions 
         WHERE property_id = $1 
           AND response_helpful = true
           AND response_text IS NOT NULL
           AND response_text != ''
           AND (
             question_text ILIKE $2 
             OR question_text ILIKE $3
             OR category = (SELECT category FROM questions WHERE question_text ILIKE $2 LIMIT 1)
           )
         GROUP BY question_text, response_text, question_language, category
         ORDER BY helpful_rate DESC, helpful_count DESC, frequency DESC
         LIMIT $4`,
        [propertyId, `%${questionText.substring(0, 20)}%`, `%${questionText.substring(questionText.length - 20)}%`, limit]
      );

      return result.rows.map(r => ({
        question: r.question_text,
        answer: r.response_text,
        language: r.question_language,
        category: r.category,
        frequency: parseInt(r.frequency),
        helpfulCount: parseInt(r.helpful_count),
        helpfulRate: parseFloat(r.helpful_rate)
      }));
    } catch (error) {
      logger.error('Error getting best answers for question:', error);
      return [];
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

  // App-wide analytics for developer/admin
  async getAppWideStats(days = 30) {
    try {
      if (!await this.ensureDatabase()) {
        return this.getEmptyAppStats();
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Total users
      const usersResult = await database.query(
        `SELECT COUNT(*) as count FROM users WHERE created_at >= $1`,
        [since]
      );

      // Total properties
      const propertiesResult = await database.query(
        `SELECT COUNT(*) as count FROM properties WHERE created_at >= $1`,
        [since]
      );

      // Total page views
      const pageViewsResult = await database.query(
        `SELECT COUNT(*) as count FROM page_views WHERE viewed_at >= $1`,
        [since]
      );

      // Unique visitors (across all properties)
      const uniqueVisitorsResult = await database.query(
        `SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) as count 
         FROM page_views WHERE viewed_at >= $1`,
        [since]
      );

      // Total questions
      const questionsResult = await database.query(
        `SELECT COUNT(*) as count FROM questions WHERE created_at >= $1`,
        [since]
      );

      // Users over time
      const usersOverTimeResult = await database.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM users WHERE created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [since]
      );

      // Properties over time
      const propertiesOverTimeResult = await database.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM properties WHERE created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [since]
      );

      // Page views over time
      const pageViewsOverTimeResult = await database.query(
        `SELECT DATE(viewed_at) as date, COUNT(*) as count
         FROM page_views WHERE viewed_at >= $1
         GROUP BY DATE(viewed_at)
         ORDER BY date ASC`,
        [since]
      );

      // Questions over time
      const questionsOverTimeResult = await database.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM questions WHERE created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [since]
      );

      // Top properties by page views
      const topPropertiesByViewsResult = await database.query(
        `SELECT p.property_id, p.name, COUNT(pv.id) as view_count
         FROM properties p
         LEFT JOIN page_views pv ON p.property_id = pv.property_id AND pv.viewed_at >= $1
         GROUP BY p.property_id, p.name
         ORDER BY view_count DESC
         LIMIT 10`,
        [since]
      );

      // Top properties by questions
      const topPropertiesByQuestionsResult = await database.query(
        `SELECT p.property_id, p.name, COUNT(q.id) as question_count
         FROM properties p
         LEFT JOIN questions q ON p.property_id = q.property_id AND q.created_at >= $1
         GROUP BY p.property_id, p.name
         ORDER BY question_count DESC
         LIMIT 10`,
        [since]
      );

      // Recent activity (last 20 events)
      const recentActivityResult = await database.query(
        `SELECT 
           'user' as type, user_id as id, username as name, created_at as timestamp
         FROM users WHERE created_at >= $1
         UNION ALL
         SELECT 
           'property' as type, property_id as id, name, created_at as timestamp
         FROM properties WHERE created_at >= $1
         ORDER BY timestamp DESC
         LIMIT 20`,
        [since]
      );

      return {
        summary: {
          totalUsers: parseInt(usersResult.rows[0]?.count || 0),
          totalProperties: parseInt(propertiesResult.rows[0]?.count || 0),
          totalPageViews: parseInt(pageViewsResult.rows[0]?.count || 0),
          uniqueVisitors: parseInt(uniqueVisitorsResult.rows[0]?.count || 0),
          totalQuestions: parseInt(questionsResult.rows[0]?.count || 0)
        },
        timeSeries: {
          users: usersOverTimeResult.rows.map(r => ({
            date: r.date.toISOString().split('T')[0],
            count: parseInt(r.count)
          })),
          properties: propertiesOverTimeResult.rows.map(r => ({
            date: r.date.toISOString().split('T')[0],
            count: parseInt(r.count)
          })),
          pageViews: pageViewsOverTimeResult.rows.map(r => ({
            date: r.date.toISOString().split('T')[0],
            count: parseInt(r.count)
          })),
          questions: questionsOverTimeResult.rows.map(r => ({
            date: r.date.toISOString().split('T')[0],
            count: parseInt(r.count)
          }))
        },
        topProperties: {
          byViews: topPropertiesByViewsResult.rows.map(r => ({
            propertyId: r.property_id,
            name: r.name,
            viewCount: parseInt(r.view_count || 0)
          })),
          byQuestions: topPropertiesByQuestionsResult.rows.map(r => ({
            propertyId: r.property_id,
            name: r.name,
            questionCount: parseInt(r.question_count || 0)
          }))
        },
        recentActivity: recentActivityResult.rows.map(r => ({
          type: r.type,
          id: r.id,
          name: r.name,
          timestamp: r.timestamp
        }))
      };
    } catch (error) {
      logger.error('Error getting app-wide stats:', error);
      return this.getEmptyAppStats();
    }
  }

  getEmptyAppStats() {
    return {
      summary: {
        totalUsers: 0,
        totalProperties: 0,
        totalPageViews: 0,
        uniqueVisitors: 0,
        totalQuestions: 0
      },
      timeSeries: {
        users: [],
        properties: [],
        pageViews: [],
        questions: []
      },
      topProperties: {
        byViews: [],
        byQuestions: []
      },
      recentActivity: []
    };
  }
}

module.exports = new AnalyticsService();

