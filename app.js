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

    // Log request details
    console.log('📝 Request details:', {
      messageLength: message?.length || 0,
      language,
      hasHostConfig: !!hostConfig,
      hasSystemMessage: !!systemMessage,
      hasApiKey: !!openaiApiKey,
      // ADDED: Log appliance information
      hasAppliances: !!(hostConfig?.appliances && hostConfig.appliances.length > 0),
      applianceCount: hostConfig?.appliances?.length || 0
    });

    if (!openaiApiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found in environment');
      return res.json({
        success: true,
        response: `I received: "${message}".\n\n⚠️ **Setup Needed:** Add your OPENAI_API_KEY in Railway environment variables to enable AI responses.\n\nIn the meantime, here are some common answers:\n• Check-in: 3 PM\n• Check-out: 11 AM\n• WiFi: Guest-WiFi / welcome123\n• Emergency: (555) 123-4567\n• Appliance help: Check the appliance instruction booklets`,
        detectedLanguage: language,
        usingCustomConfig: !!hostConfig,
        // ADDED: Include appliance info in mock response
        hasAppliances: !!(hostConfig?.appliances && hostConfig.appliances.length > 0),
        isMock: true
      });
    }

    // Prepare messages for OpenAI
    const messages = [];
    
    // System message with COMPLETE property context including appliances
    let systemPrompt = 'You are a helpful, friendly rental property assistant. Answer questions about the property, amenities, check-in/out times, local recommendations, and appliance instructions. Keep responses concise but helpful. ';
    
    if (hostConfig && hostConfig.name) {
      // Build comprehensive property context
      let propertyContext = `You are the AI assistant for "${hostConfig.name}". `;
      
      // Include ALL fields from hostConfig
      if (hostConfig.address) {
        propertyContext += `The property address is: ${hostConfig.address}. `;
      }
      
      if (hostConfig.type) {
        propertyContext += `Property type: ${hostConfig.type}. `;
      }
      
      if (hostConfig.hostContact) {
        propertyContext += `Host contact information: ${hostConfig.hostContact}. `;
      }
      
      if (hostConfig.maintenanceContact || hostConfig.emergencyContact) {
        propertyContext += `Maintenance/emergency contact: ${hostConfig.maintenanceContact || hostConfig.emergencyContact}. `;
      }
      
      if (hostConfig.checkinTime) {
        propertyContext += `Check-in time: ${hostConfig.checkinTime}. `;
      }
      
      if (hostConfig.checkoutTime) {
        propertyContext += `Check-out time: ${hostConfig.checkoutTime}. `;
      }
      
      if (hostConfig.lateCheckout) {
        propertyContext += `Late checkout policy: ${hostConfig.lateCheckout}. `;
      }
      
      if (hostConfig.amenities) {
        if (hostConfig.amenities.wifi) {
          propertyContext += `WiFi details: ${hostConfig.amenities.wifi}. `;
        }
        if (hostConfig.amenities.parking) {
          propertyContext += `Parking: ${hostConfig.amenities.parking}. `;
        }
        if (hostConfig.amenities.other) {
          propertyContext += `Other amenities: ${hostConfig.amenities.other}. `;
        }
      }
      
      if (hostConfig.houseRules) {
        propertyContext += `House rules: ${hostConfig.houseRules}. `;
      }
      
      // ADDED: Include appliance information in system prompt
      if (hostConfig.appliances && hostConfig.appliances.length > 0) {
        propertyContext += `\n\nAvailable appliances with instructions:\n`;
        hostConfig.appliances.forEach((appliance, index) => {
          propertyContext += `\n${index + 1}. ${appliance.name} (${appliance.type}):\n`;
          propertyContext += `   Instructions: ${appliance.instructions}\n`;
          if (appliance.troubleshooting) {
            propertyContext += `   Troubleshooting: ${appliance.troubleshooting}\n`;
          }
          if (appliance.photo) {
            propertyContext += `   Photo available for reference\n`;
          }
        });
        
        // ADDED: Special instructions for appliance queries
        propertyContext += `\nWhen guests ask about appliances, always:\n`;
        propertyContext += `1. Mention specific appliance names if known\n`;
        propertyContext += `2. Provide clear step-by-step instructions\n`;
        propertyContext += `3. Include troubleshooting tips if available\n`;
        propertyContext += `4. Be patient and thorough with explanations\n`;
      } else if (hostConfig.hasAppliances) {
        propertyContext += `The property has various appliances. For detailed instructions, guests can ask about specific appliances. `;
      }
      
      propertyContext += 'Answer questions accurately based on this information. Be friendly and helpful.';
      systemPrompt = propertyContext;
    }
    
    console.log('📋 System prompt includes:', {
      hasAddress: !!(hostConfig?.address),
      hasContact: !!(hostConfig?.hostContact || hostConfig?.maintenanceContact),
      hasAmenities: !!(hostConfig?.amenities),
      hasRules: !!(hostConfig?.houseRules),
      // ADDED: Log appliance info
      hasAppliances: !!(hostConfig?.appliances && hostConfig.appliances.length > 0),
      applianceCount: hostConfig?.appliances?.length || 0
    });
    
    messages.push({ role: 'system', content: systemPrompt });
    
    // Add host recommendations if provided
    if (systemMessage && systemMessage.trim().length > 0) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    // ADDED: Check if user is asking about appliances and enhance context
    const userMessage = message.toLowerCase();
    const applianceKeywords = ['appliance', 'oven', 'microwave', 'stove', 'cooktop',
      'washer', 'dryer', 'laundry', 'washing machine',
      'dishwasher', 'refrigerator', 'fridge', 'freezer',
      'thermostat', 'heating', 'cooling', 'air conditioning',
      'ac', 'heat', 'coffee maker', 'toaster', 'blender',
      'tv', 'television', 'remote', 'control',
      'instructions', 'how to use', 'operate', 'work',
      'not working', 'troubleshoot', 'help with', 'use the',
      'how do i', 'turn on', 'start', 'begin', 'light', 'fan',
      'disposal', 'garbage disposal', 'range', 'cooker',
      'appliances', 'equipment', 'machine'];
    
    const isApplianceQuery = applianceKeywords.some(keyword => userMessage.includes(keyword));
    
    if (isApplianceQuery && hostConfig?.appliances && hostConfig.appliances.length > 0) {
      // ADDED: Add specific appliance context for appliance queries
      let applianceContext = `The user is asking about appliances. Here are the available appliances with their instructions:\n\n`;
      
      // Filter appliances based on the query
      const matchedAppliances = hostConfig.appliances.filter(appliance => {
        const applianceName = appliance.name.toLowerCase();
        return applianceKeywords.some(keyword => 
          applianceName.includes(keyword) || userMessage.includes(applianceName.split(' ')[0])
        );
      });
      
      if (matchedAppliances.length > 0) {
        applianceContext += `RELEVANT APPLIANCES BASED ON USER'S QUESTION:\n\n`;
        matchedAppliances.forEach(appliance => {
          applianceContext += `📌 ${appliance.name} (${appliance.type}):\n`;
          applianceContext += `📋 Instructions: ${appliance.instructions}\n`;
          if (appliance.troubleshooting) {
            applianceContext += `🔧 Troubleshooting: ${appliance.troubleshooting}\n`;
          }
          applianceContext += `\n`;
        });
      } else {
        // If no specific match, list all appliances
        applianceContext += `ALL AVAILABLE APPLIANCES:\n\n`;
        hostConfig.appliances.forEach((appliance, index) => {
          applianceContext += `${index + 1}. ${appliance.name} (${appliance.type})\n`;
        });
        applianceContext += `\nPlease ask the user which specific appliance they need help with, or provide general appliance assistance.`;
      }
      
      messages.push({ role: 'system', content: applianceContext });
    }
    
    // Add user's message
    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    console.log('📡 Calling OpenAI API...');
    console.log('📤 Sending messages structure:', {
      totalMessages: messages.length,
      systemMessages: messages.filter(m => m.role === 'system').length,
      hasApplianceContext: isApplianceQuery && hostConfig?.appliances?.length > 0
    });

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
        max_tokens: 600 // Slightly increased for detailed appliance instructions
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
    console.log('📥 Response characteristics:', {
      length: aiMessage.length,
      containsApplianceKeywords: applianceKeywords.some(keyword => aiMessage.toLowerCase().includes(keyword)),
      isDetailed: aiMessage.length > 200
    });
    
    // Send successful response
    res.json({
      success: true,
      response: aiMessage,
      detectedLanguage: language,
      usingCustomConfig: !!hostConfig,
      // ADDED: Indicate if appliances were used in response
      usingAppliances: isApplianceQuery && !!(hostConfig?.appliances && hostConfig.appliances.length > 0),
      applianceCount: hostConfig?.appliances?.length || 0,
      isMock: false
    });

  } catch (error) {
    console.error('❌ Chat endpoint error:', error.message);
    
    // Fallback responses for common questions
    const lowerMessage = (req.body?.message || '').toLowerCase();
    let fallbackResponse = "I'm having trouble connecting to the AI service right now. Please try again in a moment or contact the property manager directly.";
    
    // Check if we have hostConfig for better fallback
    const hostConfig = req.body?.hostConfig;
    
    if (hostConfig) {
      // Use actual saved data for fallback
      if (lowerMessage.includes('check-in') || lowerMessage.includes('checkin')) {
        fallbackResponse = `Check-in time: ${hostConfig.checkinTime || '3:00 PM'}.`;
      } else if (lowerMessage.includes('check-out') || lowerMessage.includes('checkout')) {
        fallbackResponse = `Check-out time: ${hostConfig.checkoutTime || '11:00 AM'}.`;
      } else if (lowerMessage.includes('wifi') || lowerMessage.includes('internet') || lowerMessage.includes('wi-fi')) {
        fallbackResponse = `WiFi details: ${hostConfig.amenities?.wifi || 'Network: Guest-WiFi, Password: welcome123'}.`;
      } else if (lowerMessage.includes('address')) {
        fallbackResponse = `Address: ${hostConfig.address || 'Address not specified'}.`;
      } else if (lowerMessage.includes('contact') || lowerMessage.includes('emergency') || lowerMessage.includes('phone')) {
        fallbackResponse = `Contact information: ${hostConfig.hostContact || 'Contact not specified'}.`;
        if (hostConfig.maintenanceContact) {
          fallbackResponse += ` Emergency contact: ${hostConfig.maintenanceContact}.`;
        }
      } else if (lowerMessage.includes('amenit')) {
        fallbackResponse = `Amenities: ${hostConfig.amenities?.other || 'Standard amenities included'}.`;
        if (hostConfig.amenities?.wifi) {
          fallbackResponse += ` WiFi: ${hostConfig.amenities.wifi}.`;
        }
      } 
      // ADDED: Appliance-specific fallback responses
      else if (lowerMessage.includes('appliance') || 
               lowerMessage.includes('oven') || 
               lowerMessage.includes('microwave') ||
               lowerMessage.includes('washer') ||
               lowerMessage.includes('dryer') ||
               lowerMessage.includes('thermostat')) {
        
        // Check if we have appliance data
        if (hostConfig.appliances && hostConfig.appliances.length > 0) {
          fallbackResponse = `Here's appliance information for ${hostConfig.name}:\n\n`;
          
          // Filter for relevant appliances
          const relevantAppliances = hostConfig.appliances.filter(appliance => {
            const applianceName = appliance.name.toLowerCase();
            return lowerMessage.includes(applianceName.split(' ')[0]) || 
                   (lowerMessage.includes('appliance') && applianceName.includes('oven')) ||
                   (lowerMessage.includes('appliance') && applianceName.includes('washer'));
          });
          
          if (relevantAppliances.length > 0) {
            relevantAppliances.forEach(appliance => {
              fallbackResponse += `🛠️ ${appliance.name} (${appliance.type}):\n`;
              fallbackResponse += `📋 ${appliance.instructions}\n`;
              if (appliance.troubleshooting) {
                fallbackResponse += `🔧 Troubleshooting: ${appliance.troubleshooting}\n`;
              }
              fallbackResponse += `\n`;
            });
          } else {
            // List all appliances
            fallbackResponse += `Available appliances:\n`;
            hostConfig.appliances.forEach(appliance => {
              fallbackResponse += `• ${appliance.name} (${appliance.type})\n`;
            });
            fallbackResponse += `\nPlease ask about a specific appliance for detailed instructions.`;
          }
        } else {
          fallbackResponse = "For appliance instructions, please check the instruction booklets provided at the property or contact the host for assistance.";
        }
      }
    } else {
      // Generic fallback
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
      } else if (lowerMessage.includes('appliance') || lowerMessage.includes('how to use') || lowerMessage.includes('instructions')) {
        fallbackResponse = "For appliance instructions, please:\n1. Check the instruction booklets on the kitchen counter\n2. Look for labels on the appliances themselves\n3. Contact the host if you need specific help\n4. Common appliances include: oven, microwave, washer, dryer, and thermostat.";
      }
    }
    
    res.json({
      success: false,
      response: fallbackResponse,
      error: error.message,
      isFallback: true,
      // ADDED: Indicate if appliance fallback was used
      usedApplianceFallback: lowerMessage.includes('appliance') || 
                            lowerMessage.includes('oven') || 
                            lowerMessage.includes('microwave') ||
                            lowerMessage.includes('washer') ||
                            lowerMessage.includes('dryer')
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
    version: '1.1.0', // UPDATED version
    features: {
      chat: 'AI-powered chat',
      recommendations: 'Local recommendations',
      appliances: 'Appliance instructions', // ADDED
      multilingual: 'Multi-language support',
      theming: 'Dark/light mode'
    },
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
    version: '1.1.0', // UPDATED version
    ai_enabled: !!process.env.OPENAI_API_KEY,
    features: ['Chat AI', 'Property Management', 'Local Recommendations', 'Appliance Instructions'] // UPDATED
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
  console.log(`✨ Features: AI Chat, Property Setup, Recommendations, Appliance Instructions`); // UPDATED
  console.log('='.repeat(60));
  console.log('📢 Server is ready to handle requests!');
  console.log('='.repeat(60));
});

module.exports = app;
