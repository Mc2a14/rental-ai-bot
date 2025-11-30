const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - optimized for production
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving - multiple approaches for production
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes with comprehensive error handling
app.get('/', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'index.html');
    console.log('Serving index.html from:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).json({ 
      error: 'Error loading main application',
      details: error.message 
    });
  }
});

app.get('/admin', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'public', 'admin.html');
    console.log('Serving admin.html from:', filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving admin.html:', error);
    res.status(500).json({ 
      error: 'Error loading admin panel',
      details: error.message 
    });
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    nodeVersion: process.version,
    platform: process.platform
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    message: 'Hello from the Railway server!',
    server: 'Railway Deployment',
    data: [
      { id: 1, name: 'Railway Item 1', value: 100, category: 'production' },
      { id: 2, name: 'Railway Item 2', value: 200, category: 'production' },
      { id: 3, name: 'Railway Item 3', value: 300, category: 'production' }
    ],
    total: 3,
    success: true
  });
});

// Additional API endpoints for admin
app.get('/api/server-info', (req, res) => {
  res.json({
    server: {
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    },
    process: {
      pid: process.pid,
      title: process.title,
      versions: process.versions
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 404 handler for HTML routes
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>404 - Page Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
          a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <p><a href="/">Go to Home Page</a></p>
      </body>
      </html>
    `);
  } else {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 FullStack App Server Started Successfully!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Main App: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📡 API Data: http://localhost:${PORT}/api/data`);
  console.log('=' .repeat(50));
});

module.exports = app;
