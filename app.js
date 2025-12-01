const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fetch = require('node-fetch'); // You'll need to install this: npm install node-fetch

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

// ==================== AI CHAT ENDPOINT ====================
app.post('/chat/ai', async (req, res) => {
  try {
    const { message, language, hostConfig, systemMessage } = req.body;
    
    console.log('📨 AI Chat Request Received:', {
      message,
      language,
      hasHostConfig: !!hostConfig,
      systemMessageLength: systemMessage?.length || 0
    });

    // Check for required environment variables
    const aiApiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    
    if (!aiApiKey) {
      console.warn('⚠️ No AI API key found in environment variables');
      return res.json({
        success: true,
        response: `I received: "${message}". ⚠️ **Setup Required:** Add your AI API key (OPENAI_API_KEY) in Railway environment variables to enable real AI responses.`,
        detectedLanguage: language || 'en',
        usingCustomConfig: !!hostConfig,
        isMock: true
      });
    }

    // Prepare messages for AI API
    const messages = [];
    
    // Add system message if provided
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }
    
    // Add property context if host config exists
    if (hostConfig) {
      const propertyContext = `You are an assistant for ${hostConfig.name || 'a rental property'}. ` +
        `Guests can ask about check-in/out, WiFi, parking, amenities, and local recommendations. ` +
        `Be helpful, friendly, and concise. ` +
        `Check-in: ${hostConfig.checkinTime || '3:00 PM'}. ` +
        `Check-out: ${hostConfig.checkoutTime || '11:00 AM'}. ` +
        `WiFi: ${hostConfig.amenities?.wifi || 'Available'}. ` +
        `Parking: ${hostConfig.amenities?.parking || 'Available'}.`;
      
      messages.push({
        role: 'system',
        content: propertyContext
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are a helpful rental property assistant. Guests can ask about check-in/out, WiFi, parking, amenities, and local recommendations. Be friendly and concise.'
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call AI API (OpenAI compatible)
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorData);
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Send response
    res.json({
      success: true,
      response: aiMessage,
      detectedLanguage: language || 'en',
      usingCustomConfig: !!hostConfig,
      isMock: false
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    
    // Fallback response if AI fails
    const fallbackResponses = {
      'check-in': 'Check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in may be available upon request.',
      'checkout': 'Check-out is at 11:00 AM. Please leave keys on the kitchen counter.',
      'wifi': 'WiFi network: "Rental-Guest", Password: "welcome123". For premium devices, use network "Rental-Guest-5G".',
      'restaurant': 'Nearby restaurants: 1) Main Street Cafe (0.5 miles) - Great breakfast, 2) River View Bistro (1 mile) - Fine dining, 3) Pizza Express (0.3 miles) - Delivery available.',
      'emergency': 'Emergency contacts: Police/Fire/Medical: 911, Property Manager: (555) 123-4567, Maintenance: (555) 987-6543.'
    };

    // Find matching fallback
    const lowerMessage = (req.body.message || '').toLowerCase();
    let fallback = 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    
    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (lowerMessage.includes(key)) {
        fallback = response;
        break;
      }
    }

    res.json({
      success: false,
      response: fallback,
      error: error.message,
      isFallback: true
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
    platform: process.platform,
    hasAIKey: !!(process.env.OPENAI_API_KEY || process.env.AI_API_KEY)
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
    },
    ai: {
      hasApiKey: !!(process.env.OPENAI_API_KEY || process.env.AI_API_KEY),
      model: process.env.AI_MODEL || 'Not set',
      endpoint: '/chat/ai'
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
  console.log(`🤖 AI Chat Endpoint: /chat/ai ${process.env.OPENAI_API_KEY ? '✅ (API Key Loaded)' : '⚠️ (No API Key)'}`);
  console.log(`📊 Main App: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📡 API Data: http://localhost:${PORT}/api/data`);
  console.log('=' .repeat(50));
});

module.exports = app;
