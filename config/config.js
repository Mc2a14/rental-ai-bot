// Application Configuration
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // AI Service Configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY || '',
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    timeout: parseInt(process.env.AI_TIMEOUT || '30000')
  },
  
  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'rental-ai-secret-key-change-in-production',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  
  // Database Configuration
  database: {
    connectionString: process.env.DATABASE_URL || '',
    useDatabase: !!process.env.DATABASE_URL // Use database if DATABASE_URL is set
  },
  
  // Data paths (fallback for file-based storage)
  dataPath: {
    users: './data/users.json',
    properties: './data/properties.json',
    appliances: './data/appliances.json',
    recommendations: './data/recommendations.json',
    propertyConfig: './data/propertyConfig.json'
  }
};

