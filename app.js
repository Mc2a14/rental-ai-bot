// ================================================
// MAIN APPLICATION ENTRY POINT
// Clean Architecture Implementation
// ================================================

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const config = require('./config/config');
const logger = require('./utils/logger');
const database = require('./utils/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
  generalLimiter, 
  chatLimiter, 
  propertySaveLimiter, 
  analyticsLimiter, 
  authLimiter 
} = require('./middleware/rateLimiter');

// Import Routes
const chatRoutes = require('./routes/chatRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Create Express App
const app = express();

// ================================================
// MIDDLEWARE SETUP
// ================================================

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"], // Allow inline event handlers and hashes
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true
}));

// Session Configuration
// Use PostgreSQL store if DATABASE_URL is available, otherwise use memory store
const sessionConfig = {
  secret: config.security.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax' // CSRF protection
  },
  name: 'rentalai.sid' // Custom session name
};

// Use PostgreSQL for session storage if database is available
if (config.database.useDatabase && process.env.DATABASE_URL) {
  sessionConfig.store = new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true
  });
  logger.info('Using PostgreSQL for session storage');
} else {
  logger.info('Using memory store for sessions (sessions will be lost on restart)');
}

app.use(session(sessionConfig));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static Files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: config.nodeEnv === 'production' ? '1d' : '0',
  etag: false, // Disable ETag to prevent caching issues
  lastModified: false
}));

// Add cache control headers for HTML files
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// ================================================
// API ROUTES (with Rate Limiting)
// ================================================

// Chat API - Stricter rate limiting (AI calls are expensive)
app.use('/chat', chatLimiter, chatRoutes);

// Property API - General rate limiting, stricter for saves
app.use('/api/property', generalLimiter, propertyRoutes);

// Property Config API (backward compatibility) - General rate limiting
app.get('/api/property-config/:propertyId', generalLimiter, async (req, res) => {
  const propertyController = require('./controllers/propertyController');
  return propertyController.getPropertyConfig(req, res);
});

// User API - Auth rate limiting for login/register
app.use('/api/user', generalLimiter, userRoutes);

// Analytics API - Analytics rate limiting
app.use('/api/analytics', analyticsLimiter, analyticsRoutes);

// User Properties API
app.get('/api/user/:userId/properties', async (req, res) => {
  const propertyController = require('./controllers/propertyController');
  return propertyController.getUserProperties(req, res);
});

// ================================================
// FRONTEND ROUTES
// ================================================

// Guest Property Page
app.get('/property/:propertyId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Analytics Dashboard
app.get('/analytics.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// Admin Page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Root - redirect to main chat
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ================================================
// ERROR HANDLING
// ================================================

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// ================================================
// SERVER STARTUP
// ================================================

const PORT = config.port;

app.listen(PORT, () => {
  logger.success(`🚀 Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 Access at: http://localhost:${PORT}`);
  logger.info(`🤖 AI Provider: ${config.ai.provider}`);
  
  // Initialize database connection
  database.connect().then(pool => {
    if (pool) {
      logger.info('✅ Database connected and ready');
    } else {
      logger.info('📁 Using file-based storage (no database)');
    }
  }).catch(err => {
    logger.warn('⚠️  Database connection failed, using file-based storage');
    logger.warn(`   Error: ${err.message}`);
  });

  if (!config.ai.apiKey) {
    logger.warn('⚠️  AI_API_KEY not set. AI chat will not work properly.');
    logger.warn('   Set AI_API_KEY environment variable for production.');
  }
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await database.close();
  process.exit(0);
});

module.exports = app;
