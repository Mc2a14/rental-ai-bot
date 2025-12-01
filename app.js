const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============ AI CHAT ENDPOINT ============
app.post('/chat/ai', async (req, res) => {
  console.log('🤖 Received chat request');
  
  try {
    const { message, language = 'en', hostConfig, systemMessage } = req.body;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Log request details (excluding full message for privacy)
    console.log('📝 Request details:', {
      messageLength: message?.length || 0,
      language,
      hasHostConfig: !!hostConfig,
      hasSystemMessage: !!systemMessage,
      hasApiKey: !!openaiApiKey
    });

    if (!openaiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found in environment');
      return res.json({
        success: true,
        response: `I received: "${message}".\n\n⚠️ **Setup Needed:** Add your OPENAI_API_KEY in Railway environment variables to enable AI responses.\n\nIn the meantime, here are some common answers:\n• Check-in: 3 PM\n• Check-out: 11 AM\n• WiFi: Guest-WiFi / welcome123\n• Emergency: (555) 123-4567`,
        detectedLanguage: language,
        usingCustomConfig: !!hostConfig,
        isMock: true
      });
    }

    // Prepare messages for OpenAI
    const messages = [];
    
    // System message with property context
    let systemPrompt = 'You are a helpful, friendly rental property assistant. Answer questions about the property, amenities, check-in/out times, local recommendations, and emergency contacts. Keep responses concise but helpful.';
    
    if (hostConfig) {
      systemPrompt = `You are the AI assistant for "${hostConfig.name || 'our rental property'}". ` + systemPrompt;
      
      if (hostConfig.checkinTime) {
        systemPrompt += ` Check-in time is ${hostConfig.checkinTime}.`;
      }
      if (hostConfig.checkoutTime) {
        systemPrompt += ` Check-out time is ${hostConfig.checkoutTime}.`;
      }
      if (hostConfig.amenities?.wifi) {
        systemPrompt += ` WiFi details: ${hostConfig.amenities.wifi}.`;
      }
      if (hostConfig.amenities?.parking) {
        systemPrompt += ` Parking: ${hostConfig.amenities.parking}.`;
      }
    }
    
    messages.push({ role: 'system', content: systemPrompt });
    
    // Add host recommendations if provided
    if (systemMessage && systemMessage.trim().length > 0) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    // Add user's message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    console.log('📡 Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API Error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const aiMessage = data.choices[0].message.content;

    console.log('✅ AI response generated successfully');
    
    // Send successful response
    res.json({
      success: true,
      response: aiMessage,
      detectedLanguage: language,
      usingCustomConfig: !!hostConfig,
      isMock: false
    });

  } catch (error) {
    console.error('❌ Chat endpoint error:', error.message);
    
    // Fallback responses for common questions
    const lowerMessage = (req.body?.message || '').toLowerCase();
    let fallbackResponse = "I'm having trouble connecting to the AI service right now. Please try again in a moment or contact the property manager directly.";
    
    // Common questions fallbacks
    if (lowerMessage.includes('check-in') || lowerMessage.includes('checkin')) {
      fallbackResponse = "Standard check-in time is 3:00 PM. Early check-in may be available upon request.";
    } else if (lowerMessage.includes('check-out') || lowerMessage.includes('checkout')) {
      fallbackResponse = "Check-out time is 11:00 AM. Please leave keys on the kitchen counter.";
    } else if (lowerMessage.includes('wifi') || lowerMessage.includes('internet') || lowerMessage.includes('wi-fi')) {
      fallbackResponse = "WiFi Network: Guest-WiFi\nPassword: welcome123\nFor 5G devices: Guest-WiFi-5G (same password)";
    } else if (lowerMessage.includes('restaurant') || lowerMessage.includes('eat') || lowerMessage.includes('food')) {
      fallbackResponse = "Nearby restaurants:\n1. Main Street Cafe (0.5 miles) - Breakfast & lunch\n2. River View Bistro (1 mile) - Fine dining\n3. Pizza Express (0.3 miles) - Delivery available";
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('contact')) {
      fallbackResponse = "Emergency Contacts:\n• Police/Fire/Medical: 911\n• Property Manager: (555) 123-4567\n• Maintenance: (555) 987-6543\n• After-hours: (555) 555-5555";
    }
    
    res.json({
      success: false,
      response: fallbackResponse,
      error: error.message,
      isFallback: true
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online',
    server: 'Rental AI Assistant',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    ai_configured: !!process.env.OPENAI_API_KEY,
    endpoints: {
      chat: 'POST /chat/ai',
      health: 'GET /api/health',
      main: 'GET /',
      admin: 'GET /admin'
    }
  });
});

// Test data endpoint
app.get('/api/data', (req, res) => {
  res.json({
    message: 'Rental AI Assistant API is working!',
    server: 'Railway Deployment',
    version: '1.0.0',
    ai_enabled: !!process.env.OPENAI_API_KEY
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: ['POST /chat/ai', 'GET /api/health', 'GET /api/data']
  });
});

// 404 handler for HTML routes - redirect to main app
app.use((req, res) => {
  res.redirect('/');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 RENTAL AI ASSISTANT SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  console.log(`🏠 Main App: http://localhost:${PORT}`);
  console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🤖 AI Chat Endpoint: POST http://localhost:${PORT}/chat/ai`);
  console.log(`❤️  Health Check: GET http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('📢 Server is ready to handle requests!');
  console.log('='.repeat(60));
});

module.exports = app;
