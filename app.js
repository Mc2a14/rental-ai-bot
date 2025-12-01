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
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev')); // Changed to 'dev' for cleaner logs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ==================== AI CHAT ENDPOINT ====================
app.post('/chat/ai', async (req, res) => {
  try {
    const { message, language = 'en', hostConfig, systemMessage } = req.body;
    
    console.log('🤖 AI Request:', {
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      language,
      property: hostConfig?.name || 'Default',
      hasRecommendations: systemMessage ? 'Yes' : 'No'
    });

    const aiApiKey = process.env.OPENAI_API_KEY;
    
    // If no API key, return helpful message
    if (!aiApiKey) {
      console.log('⚠️  No OpenAI API key found in environment');
      return res.json({
        success: true,
        response: `I received: "${message}".\n\n**Setup Required:** Add your OPENAI_API_KEY in Railway environment variables to enable AI responses.\n\nFor now, here are common answers:\n• Check-in: 3 PM, Check-out: 11 AM\n• WiFi: Network: Guest-WiFi, Password: welcome123\n• Parking: Free street parking available\n• Emergency: Contact host at (555) 123-4567`,
        detectedLanguage: language,
        usingCustomConfig: !!hostConfig,
        isMock: true
      });
    }

    // Build messages array
    const messages = [];
    
    // System message with property context
    const baseSystemMessage = 'You are a helpful rental property assistant. Be friendly, concise, and helpful. ';
    let propertyContext = baseSystemMessage;
    
    if (hostConfig) {
      propertyContext = `You are an assistant for ${hostConfig.name || 'a rental property'}. ` +
        `Check-in: ${hostConfig.checkinTime || '3:00 PM'}. ` +
        `Check-out: ${hostConfig.checkoutTime || '11:00 AM'}. ` +
        `WiFi: ${hostConfig.amenities?.wifi || 'Available'}. ` +
        `Parking: ${hostConfig.amenities?.parking || 'Available'}. ` +
        `Be helpful, friendly, and concise.`;
    }
    
    messages.push({ role: 'system', content: propertyContext });
    
    // Add recommendations if provided
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    // Add user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ AI Response generated');
    
    res.json({
      success: true,
      response: aiResponse,
      detectedLanguage: language,
      usingCustomConfig: !!hostConfig,
      isMock: false
    });

  } catch (error) {
    console.error('❌ Chat Error:', error.message);
    
    // Fallback responses
    const lowerMessage = (req.body?.message || '').toLowerCase();
    let fallback = 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    
    if (lowerMessage.includes('check')) {
      fallback = 'Check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in may be available upon request.';
    } else if (lowerMessage.includes('wifi')) {
      fallback = 'WiFi network: "Guest-WiFi", Password: "welcome123". The network is available throughout the property.';
    } else if (lowerMessage.includes('restaurant') || lowerMessage.includes('eat') || lowerMessage.includes('food')) {
      fallback = 'Nearby restaurants: 1) Main Street Cafe (0.5 miles) - Great breakfast, 2) River View Bistro (1 mile) - Fine dining, 3) Pizza Express (0.3 miles) - Delivery available.';
    } else if (lowerMessage.includes('emergency')) {
      fallback = 'Emergency contacts: Police/Fire/Medical: 911, Property Manager: (555) 123-4567, After-hours: (555) 987-6543.';
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
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    aiEndpoint: '/chat/ai'
  });
});

app.get('/api/data', (req, res) => {
  res.json({
    message: 'Hello from Railway!',
    server: 'Railway Deployment',
    aiEnabled: !!process.env.OPENAI_API_KEY
  });
});

// 404 handlers
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server started on port', PORT);
  console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
  console.log('🤖 OpenAI API:', process.env.OPENAI_API_KEY ? '✅ Key loaded' : '❌ No key - add OPENAI_API_KEY');
  console.log('📊 Health check: /api/health');
  console.log('💬 AI Chat: POST /chat/ai');
  console.log('='.repeat(50));
});

module.exports = app;
