import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://www.google.com', 
      'http://localhost:3000', 
      'https://rental-ai-bot-production.up.railway.app',
      'http://localhost:8080',
      'https://localhost:8080'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('🚫 Blocked CORS request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Debug: Check if API key is loaded
console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log('🔑 Key starts with:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');
} else {
  console.warn('⚠️  OpenAI API Key not found! AI features will not work.');
}

// Initialize OpenAI with error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize OpenAI client:', error.message);
  openai = null;
}

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// ENHANCED PROPERTY CONFIGURATION SYSTEM
class PropertyConfiguration {
  constructor() {
    this.defaultConfig = this.createDefaultConfig();
  }

  createDefaultConfig() {
    return {
      name: "Sunset Beach Villa",
      address: "123 Ocean View Drive, Miami Beach, FL 33139",
      type: "Luxury Beachfront Villa",
      contacts: {
        host: "Maria Rodriguez - (305) 555-0123",
        emergency: "911",
        maintenance: "(305) 555-0456 (24/7)",
        propertyManager: "Carlos - (305) 555-0789"
      },
      schedule: {
        checkIn: "3:00 PM", 
        checkOut: "11:00 AM",
        lateCheckOut: "Available upon request ($50 fee after 1 PM)"
      },
      amenities: {
        essentials: ["WiFi: GuestNetwork / Welcome123", "Air Conditioning", "Heating", "Hot Water", "Kitchen"],
        comfort: ["King Bed", "Smart TV", "Netflix/Disney+", "Coffee Maker", "Hair Dryer"],
        outdoor: ["Private Pool", "Beach Access", "BBQ Grill", "Patio Furniture", "Parking Spot A15"],
        safety: ["Security Cameras (exterior only)", "First Aid Kit", "Fire Extinguisher", "Smoke Detectors"]
      },
      rules: {
        general: ["No smoking inside", "No parties or events", "Quiet hours: 10:00 PM - 7:00 AM"],
        pool: ["No glass near pool", "Children must be supervised", "Pool hours: 7:00 AM - 10:00 PM"],
        parking: ["One vehicle per reservation - Spot A15", "No street parking overnight"],
        damages: "Please report any damages immediately"
      },
      local: {
        restaurants: [
          "Seaside Grill (0.5 miles) - Fresh seafood, great sunset views",
          "Ocean View Bistro (0.3 miles) - Casual dining, family-friendly", 
          "Miami Spice (1.2 miles) - Cuban cuisine, live music",
          "Beach Cafe (0.1 miles) - Ideal for breakfast and coffee, opens at 7 AM"
        ],
        attractions: [
          "Sunset Beach (across street) - Swimming, sunbathing",
          "Marina Boardwalk (0.8 miles) - Shopping, boat rentals",
          "Miami Art District (2 miles) - Galleries, cafes",
          "Tropical Gardens (1.5 miles) - Nature walks, photography"
        ],
        groceries: [
          "Beach Market (0.4 miles) - Essentials, fresh produce",
          "SuperMart (1 mile) - Full supermarket, pharmacy"
        ],
        emergencyServices: {
          hospital: "Miami Beach General - (305) 555-1000 (3 miles)",
          pharmacy: "Beachside Pharmacy - (305) 555-2000 (0.6 miles)",
          police: "911 or Miami Beach PD - (305) 555-3000"
        }
      },
      transportation: {
        airport: "Miami International (MIA) - 12 miles, 20-30 min drive",
        taxi: "Beach Cab Co. - (305) 555-4000",
        rideshare: "Uber/Lyft readily available",
        publicTransit: "Bus stop 0.2 miles away - Route 123 to downtown"
      }
    };
  }

  // Convert frontend host configuration to full property details
  convertHostConfig(hostConfig) {
    if (!hostConfig || !hostConfig.name) {
      console.log('🔄 No valid host config provided, using defaults');
      return this.defaultConfig;
    }

    console.log('🏠 Converting host configuration:', hostConfig.name);
    
    return {
      name: hostConfig.name,
      address: hostConfig.address || 'Address not specified',
      type: hostConfig.type || 'Vacation Rental',
      contacts: {
        host: hostConfig.contact?.host || 'Host contact not specified',
        emergency: "911",
        maintenance: hostConfig.contact?.maintenance || 'Maintenance contact not specified',
        propertyManager: hostConfig.contact?.host || 'Host contact not specified'
      },
      schedule: {
        checkIn: hostConfig.checkInOut?.checkIn || '3:00 PM',
        checkOut: hostConfig.checkInOut?.checkOut || '11:00 AM',
        lateCheckOut: hostConfig.checkInOut?.lateCheckout || 'Available upon request'
      },
      amenities: {
        essentials: [
          hostConfig.amenities?.wifi || 'WiFi details not configured',
          ...(hostConfig.amenities?.list || [])
        ],
        comfort: hostConfig.amenities?.list || ['Basic amenities'],
        outdoor: ['Check with host for outdoor amenities'],
        safety: ['Smoke detectors', 'First aid kit', 'Emergency contacts']
      },
      rules: {
        general: hostConfig.rules || ['No smoking', 'No parties', 'Quiet hours'],
        pool: ['Pool rules not specified'],
        parking: ['Parking information not specified'],
        damages: "Please report any damages immediately"
      },
      local: this.defaultConfig.local, // Use defaults for local recommendations
      transportation: this.defaultConfig.transportation // Use defaults for transportation
    };
  }

  getConfig(hostConfig = null) {
    return hostConfig ? this.convertHostConfig(hostConfig) : this.defaultConfig;
  }
}

const propertyConfig = new PropertyConfiguration();

// ENHANCED SYSTEM PROMPT GENERATOR
class SystemPromptGenerator {
  generate(language = 'en', customConfig = null) {
    const config = customConfig || propertyConfig.getConfig();
    
    const basePrompt = {
      en: this.generateEnglishPrompt(config),
      es: this.generateSpanishPrompt(config),
      fr: this.generateFrenchPrompt(config),
      de: this.generateGermanPrompt(config),
      it: this.generateItalianPrompt(config)
    };

    return basePrompt[language] || basePrompt.en;
  }

  generateEnglishPrompt(config) {
    return `You are a knowledgeable and helpful Rental AI Assistant for "${config.name}". Your role is to assist guests with property information, local recommendations, and answer questions about their stay.

PROPERTY DETAILS:
📍 Address: ${config.address}
🏠 Type: ${config.type}

CONTACT INFORMATION:
${Object.entries(config.contacts).map(([key, value]) => `• ${this.formatContactKey(key)}: ${value}`).join('\n')}

CHECK-IN & CHECK-OUT:
🕒 Check-in: ${config.schedule.checkIn}
🕒 Check-out: ${config.schedule.checkOut}
💡 Late check-out: ${config.schedule.lateCheckOut}

AMENITIES & FEATURES:
${Object.entries(config.amenities).map(([category, items]) => 
  `🏷️ ${this.formatCategoryKey(category)}:\n${items.map(item => `   • ${item}`).join('\n')}`
).join('\n\n')}

HOUSE RULES:
${Object.entries(config.rules).map(([category, rules]) => 
  `📋 ${this.formatCategoryKey(category)}:\n${Array.isArray(rules) ? rules.map(rule => `   • ${rule}`).join('\n') : `   • ${rules}`}`
).join('\n\n')}

LOCAL RECOMMENDATIONS:
${Object.entries(config.local).map(([category, items]) => 
  `📍 ${this.formatCategoryKey(category)}:\n${Array.isArray(items) ? items.map(item => `   • ${item}`).join('\n') : 
    Object.entries(items).map(([key, value]) => `   • ${this.formatContactKey(key)}: ${value}`).join('\n')}`
).join('\n\n')}

TRANSPORTATION:
${Object.entries(config.transportation).map(([key, value]) => `• ${this.formatCategoryKey(key)}: ${value}`).join('\n')}

RESPONSE GUIDELINES:
1. Be friendly, professional, and empathetic
2. Provide specific details from the property knowledge base
3. For maintenance issues, provide the maintenance contact
4. For emergencies, emphasize calling 911 immediately
5. Recommend local spots when guests ask about activities
6. Clearly explain house rules when relevant
7. Keep responses concise but helpful (2-4 paragraphs maximum)
8. Use emojis sparingly to enhance readability
9. If you don't know something, admit it and suggest contacting the host directly`;
  }

  generateSpanishPrompt(config) {
    return `Eres un asistente de IA útil y conocedor para "${config.name}". Tu rol es ayudar a los huéspedes con información de la propiedad, recomendaciones locales y responder preguntas sobre su estadía.

DETALLES DE LA PROPIEDAD:
📍 Dirección: ${config.address}
🏠 Tipo: ${config.type}

INFORMACIÓN DE CONTACTO:
${Object.entries(config.contacts).map(([key, value]) => `• ${this.formatContactKey(key, 'es')}: ${value}`).join('\n')}

CHECK-IN & CHECK-OUT:
🕒 Check-in: ${config.schedule.checkIn}
🕒 Check-out: ${config.schedule.checkOut}
💡 Check-out tardío: ${config.schedule.lateCheckOut}

COMODIDADES Y CARACTERÍSTICAS:
${Object.entries(config.amenities).map(([category, items]) => 
  `🏷️ ${this.formatCategoryKey(category, 'es')}:\n${items.map(item => `   • ${item}`).join('\n')}`
).join('\n\n')}

NORMAS DE LA CASA:
${Object.entries(config.rules).map(([category, rules]) => 
  `📋 ${this.formatCategoryKey(category, 'es')}:\n${Array.isArray(rules) ? rules.map(rule => `   • ${rule}`).join('\n') : `   • ${rules}`}`
).join('\n\n')}

RECOMENDACIONES LOCALES:
${Object.entries(config.local).map(([category, items]) => 
  `📍 ${this.formatCategoryKey(category, 'es')}:\n${Array.isArray(items) ? items.map(item => `   • ${item}`).join('\n') : 
    Object.entries(items).map(([key, value]) => `   • ${this.formatContactKey(key, 'es')}: ${value}`).join('\n')}`
).join('\n\n')}

TRANSPORTE:
${Object.entries(config.transportation).map(([key, value]) => `• ${this.formatCategoryKey(key, 'es')}: ${value}`).join('\n')}

[Spanish response guidelines...]`;
  }

  generateFrenchPrompt(config) {
    return `[French prompt implementation...]`;
  }

  generateGermanPrompt(config) {
    return `[German prompt implementation...]`;
  }

  generateItalianPrompt(config) {
    return `[Italian prompt implementation...]`;
  }

  formatContactKey(key, language = 'en') {
    const mappings = {
      en: {
        host: 'Host Contact',
        emergency: 'Emergency',
        maintenance: 'Maintenance',
        propertyManager: 'Property Manager'
      },
      es: {
        host: 'Contacto del Anfitrión',
        emergency: 'Emergencia',
        maintenance: 'Mantenimiento',
        propertyManager: 'Gerente de Propiedad'
      }
    };
    return mappings[language]?.[key] || key;
  }

  formatCategoryKey(key, language = 'en') {
    // Simple capitalization for now
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

const promptGenerator = new SystemPromptGenerator();

// ENHANCED LANGUAGE DETECTION
class LanguageDetector {
  detect(text) {
    if (!text || typeof text !== 'string') return 'en';

    const lowerText = text.toLowerCase();
    
    const languagePatterns = {
      es: ['hola', 'gracias', 'por favor', 'ayuda', 'información', 'dónde', 'cuándo', 'cómo'],
      fr: ['bonjour', 'merci', 's\'il vous plaît', 'aide', 'information', 'où', 'quand', 'comment'],
      de: ['hallo', 'danke', 'bitte', 'hilfe', 'information', 'wo', 'wann', 'wie'],
      it: ['ciao', 'grazie', 'per favore', 'aiuto', 'informazione', 'dove', 'quando', 'come']
    };

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return lang;
      }
    }

    return 'en';
  }
}

const languageDetector = new LanguageDetector();

// ROUTES
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  const config = propertyConfig.getConfig();
  res.json({
    success: true,
    property: config.name,
    address: config.address,
    version: '7.0.0',
    features: ['multi-language', 'host-configuration', 'real-time-chat', 'recommendations'],
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it'],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const config = propertyConfig.getConfig();
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Assistant is running smoothly!',
    timestamp: new Date().toISOString(),
    openai: {
      configured: !!openai,
      keyPresent: !!process.env.OPENAI_API_KEY
    },
    property: config.name,
    version: '7.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: ['multi-language', 'chat-history', 'dark-mode', 'host-configuration', 'recommendations-management']
  });
});

// ENHANCED AI CHAT ENDPOINT
app.post('/chat/ai', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Parse request body with enhanced error handling
    let message, preferredLanguage, hostConfig, systemMessage;
    
    try {
      if (req.is('application/json')) {
        ({ message, language: preferredLanguage, hostConfig, systemMessage } = req.body);
      } else {
        const bodyString = req.body.toString();
        const parsed = JSON.parse(bodyString);
        ({ message, language: preferredLanguage, hostConfig, systemMessage } = parsed);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: 'Request must be valid JSON'
      });
    }

    // Validate message
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        details: 'The message field cannot be empty'
      });
    }

    // Clean and validate inputs
    message = message.toString().trim().substring(0, 1000); // Limit message length
    preferredLanguage = preferredLanguage || languageDetector.detect(message);
    preferredLanguage = ['en', 'es', 'fr', 'de', 'it'].includes(preferredLanguage) ? preferredLanguage : 'en';

    console.log(`💬 AI Request - Language: ${preferredLanguage}, Config: ${hostConfig ? 'Custom' : 'Default'}`);
    console.log(`📝 Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

    // Check if OpenAI is available
    if (!openai) {
      console.error('❌ OpenAI client not available');
      return res.status(503).json({
        success: false,
        response: "AI service is currently unavailable. Please try again later.",
        error: "OpenAI client not configured",
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

    // Generate system prompt with custom configuration
    const customConfig = hostConfig ? propertyConfig.convertHostConfig(hostConfig) : null;
    const systemPrompt = systemMessage || promptGenerator.generate(preferredLanguage, customConfig);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const aiResponse = completion.choices[0].message.content;
    const responseTime = Date.now() - startTime;

    console.log(`✅ AI Response generated in ${responseTime}ms`);

    // Success response
    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      detectedLanguage: preferredLanguage,
      type: 'ai',
      usage: completion.usage,
      responseTime: `${responseTime}ms`,
      property: customConfig?.name || propertyConfig.defaultConfig.name,
      usingCustomConfig: !!customConfig,
      model: 'gpt-3.5-turbo'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ AI Chat error:', error.message);
    
    // Enhanced error handling
    let errorResponse = "I'm experiencing technical difficulties. Please try again in a moment.";
    let statusCode = 500;

    if (error.code === 'insufficient_quota') {
      errorResponse = "AI service quota exceeded. Please try again later.";
      statusCode = 503;
    } else if (error.code === 'rate_limit_exceeded') {
      errorResponse = "Too many requests. Please wait a moment and try again.";
      statusCode = 429;
    } else if (error.message.includes('API key')) {
      errorResponse = "AI service configuration error. Please contact support.";
      statusCode = 500;
    }

    res.status(statusCode).json({ 
      success: false, 
      response: errorResponse,
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      type: 'ai_error',
      fallback: true
    });
  }
});

// SIMPLE CHAT FALLBACK ENDPOINT
app.post('/chat/simple', (req, res) => {
  try {
    let message = '';
    
    // Parse message from request
    if (req.is('application/json')) {
      message = req.body.message || '';
    } else {
      try {
        const bodyString = req.body.toString();
        const parsed = JSON.parse(bodyString);
        message = parsed.message || '';
      } catch (e) {
        message = req.body.toString();
      }
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const config = propertyConfig.getConfig();
    const lowerMessage = message.toLowerCase();
    
    // Enhanced simple responses
    const responses = {
      'check in': `Check-in: ${config.schedule.checkIn}. Late check-out: ${config.schedule.lateCheckOut}`,
      'check-in': `Check-in: ${config.schedule.checkIn}. Late check-out: ${config.schedule.lateCheckOut}`,
      'wifi': `WiFi: ${config.amenities.essentials[0]}`,
      'internet': `WiFi: ${config.amenities.essentials[0]}`,
      'parking': `Parking: ${config.amenities.outdoor[4] || 'Please check with host'}`,
      'rules': `House Rules: ${config.rules.general.join(', ')}`,
      'emergency': `Emergency: ${config.contacts.emergency}. Maintenance: ${config.contacts.maintenance}`,
      'contact': `Host: ${config.contacts.host}. Maintenance: ${config.contacts.maintenance}`,
      'amenities': `Key Amenities: ${config.amenities.essentials.slice(0, 3).join(', ')}...`
    };
    
    let response = `Welcome to ${config.name}! I can help with check-in, amenities, local recommendations, or house rules.`;
    
    for (const [key, answer] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = answer;
        break;
      }
    }
    
    res.json({ 
      success: true, 
      response: response,
      timestamp: new Date().toISOString(),
      yourMessage: message,
      type: 'simple',
      fallback: true
    });
    
  } catch (error) {
    console.error('Simple chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      fallback: true
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    availableEndpoints: ['/chat/ai', '/chat/simple', '/api/health', '/api/config']
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  const config = propertyConfig.getConfig();
  console.log('\n' + '='.repeat(60));
  console.log('🚀 RENTAL AI ASSISTANT SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🏠 Default Property: ${config.name}`);
  console.log(`🌍 Supported Languages: English, Spanish, French, German, Italian`);
  console.log(`🤖 AI Service: ${openai ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`⚙️  Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
