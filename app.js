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
  origin: ['https://www.google.com', 'http://localhost:3000', 'https://rental-ai-bot-production.up.railway.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.raw({ type: '*/*' }));

// Debug: Check if API key is loaded
console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log('Key starts with:', process.env.OPENAI_API_KEY.substring(0, 10) + '...');
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Handle OPTIONS requests for CORS preflight
app.options('*', cors());

// COMPREHENSIVE PROPERTY KNOWLEDGE BASE
const propertyDetails = {
  // Basic Property Info
  name: "Sunset Beach Villa",
  address: "123 Ocean View Drive, Miami Beach, FL 33139",
  type: "Luxury Beachfront Villa",
  
  // Contact Information
  contacts: {
    host: "Maria Rodriguez - (305) 555-0123",
    emergency: "911",
    maintenance: "(305) 555-0456 (24/7)",
    propertyManager: "Carlos - (305) 555-0789"
  },
  
  // Check-in/out Details
  schedule: {
    checkIn: "3:00 PM", 
    checkOut: "11:00 AM",
    lateCheckOut: "Available upon request ($50 fee after 1 PM)"
  },
  
  // Amenities
  amenities: {
    essentials: ["WiFi: GuestNetwork / Welcome123", "Air Conditioning", "Heating", "Hot Water", "Kitchen"],
    comfort: ["King Bed", "Smart TV", "Netflix/Disney+", "Coffee Maker", "Hair Dryer"],
    outdoor: ["Private Pool", "Beach Access", "BBQ Grill", "Patio Furniture", "Parking Spot A15"],
    safety: ["Security Cameras (exterior only)", "First Aid Kit", "Fire Extinguisher", "Smoke Detectors"]
  },
  
  // House Rules
  rules: {
    general: ["No smoking inside", "No parties or events", "Quiet hours: 10:00 PM - 7:00 AM"],
    pool: ["No glass near pool", "Children must be supervised", "Pool hours: 7:00 AM - 10:00 PM"],
    parking: ["One vehicle per reservation - Spot A15", "No street parking overnight"],
    damages: "Please report any damages immediately"
  },
  
  // Local Recommendations
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
  
  // Transportation
  transportation: {
    airport: "Miami International (MIA) - 12 miles, 20-30 min drive",
    taxi: "Beach Cab Co. - (305) 555-4000",
    rideshare: "Uber/Lyft readily available",
    publicTransit: "Bus stop 0.2 miles away - Route 123 to downtown"
  }
};

// Multi-language system prompts
const SYSTEM_PROMPTS = {
  en: `You are a knowledgeable and helpful short-term rental assistant for "${propertyDetails.name}". Respond in English.

PROPERTY KNOWLEDGE BASE:

BASIC INFO:
- Address: ${propertyDetails.address}
- Type: ${propertyDetails.type}

CONTACTS:
${Object.entries(propertyDetails.contacts).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

SCHEDULE:
- Check-in: ${propertyDetails.schedule.checkIn}
- Check-out: ${propertyDetails.schedule.checkOut}
- ${propertyDetails.schedule.lateCheckOut}

AMENITIES:
${Object.entries(propertyDetails.amenities).map(([category, items]) => 
  `${category.toUpperCase()}:\n${items.map(item => `  • ${item}`).join('\n')}`
).join('\n')}

HOUSE RULES:
${Object.entries(propertyDetails.rules).map(([category, rules]) => 
  `${category.toUpperCase()}:\n${Array.isArray(rules) ? rules.map(rule => `  • ${rule}`).join('\n') : `  • ${rules}`}`
).join('\n')}

LOCAL RECOMMENDATIONS:
${Object.entries(propertyDetails.local).map(([category, items]) => 
  `${category.toUpperCase()}:\n${Array.isArray(items) ? items.map(item => `  • ${item}`).join('\n') : 
    Object.entries(items).map(([key, value]) => `  • ${key}: ${value}`).join('\n')}`
).join('\n')}

TRANSPORTATION:
${Object.entries(propertyDetails.transportation).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

GUIDELINES:
- Be friendly, professional, and helpful
- Provide specific details from the knowledge base when relevant
- For maintenance issues, provide the maintenance contact number
- For emergencies, emphasize calling 911 first
- Recommend local spots when guests ask about things to do
- Always be clear about house rules when relevant`,

  es: `Eres un asistente útil y conocedor de alquileres vacacionales para "${propertyDetails.name}". Responde en español.

BASE DE CONOCIMIENTO DE LA PROPIEDAD:

INFORMACIÓN BÁSICA:
- Dirección: ${propertyDetails.address}
- Tipo: ${propertyDetails.type}

CONTACTOS:
${Object.entries(propertyDetails.contacts).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

HORARIOS:
- Check-in: ${propertyDetails.schedule.checkIn}
- Check-out: ${propertyDetails.schedule.checkOut}
- ${propertyDetails.schedule.lateCheckOut}

COMODIDADES:
${Object.entries(propertyDetails.amenities).map(([category, items]) => 
  `${category.toUpperCase()}:\n${items.map(item => `  • ${item}`).join('\n')}`
).join('\n')}

NORMAS DE LA CASA:
${Object.entries(propertyDetails.rules).map(([category, rules]) => 
  `${category.toUpperCase()}:\n${Array.isArray(rules) ? rules.map(rule => `  • ${rule}`).join('\n') : `  • ${rules}`}`
).join('\n')}

RECOMENDACIONES LOCALES:
${Object.entries(propertyDetails.local).map(([category, items]) => 
  `${category.toUpperCase()}:\n${Array.isArray(items) ? items.map(item => `  • ${item}`).join('\n') : 
    Object.entries(items).map(([key, value]) => `  • ${key}: ${value}`).join('\n')}`
).join('\n')}

TRANSPORTE:
${Object.entries(propertyDetails.transportation).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

PAUTAS:
- Sé amable, profesional y servicial
- Proporciona detalles específicos de la base de conocimiento cuando sea relevante
- Para problemas de mantenimiento, proporciona el número de contacto de mantenimiento
- Para emergencias, enfatiza llamar al 911 primero
- Recomienda lugares locales cuando los huéspedes pregunten sobre cosas para hacer
- Siempre sé claro sobre las normas de la casa cuando sea relevante`,

  fr: `Vous êtes un assistant de location de vacances serviable et compétent pour "${propertyDetails.name}". Répondez en français.

BASE DE CONNAISSANCES DE LA PROPRIÉTÉ:

INFORMATIONS DE BASE:
- Adresse: ${propertyDetails.address}
- Type: ${propertyDetails.type}

CONTACTS:
${Object.entries(propertyDetails.contacts).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

HORAIRES:
- Check-in: ${propertyDetails.schedule.checkIn}
- Check-out: ${propertyDetails.schedule.checkOut}
- ${propertyDetails.schedule.lateCheckOut}

ÉQUIPEMENTS:
${Object.entries(propertyDetails.amenities).map(([category, items]) => 
  `${category.toUpperCase()}:\n${items.map(item => `  • ${item}`).join('\n')}`
).join('\n')}

RÈGLES DE LA MAISON:
${Object.entries(propertyDetails.rules).map(([category, rules]) => 
  `${category.toUpperCase()}:\n${Array.isArray(rules) ? rules.map(rule => `  • ${rule}`).join('\n') : `  • ${rules}`}`
).join('\n')}

RECOMMANDATIONS LOCALES:
${Object.entries(propertyDetails.local).map(([category, items]) => 
  `${category.toUpperCase()}:\n${Array.isArray(items) ? items.map(item => `  • ${item}`).join('\n') : 
    Object.entries(items).map(([key, value]) => `  • ${key}: ${value}`).join('\n')}`
).join('\n')}

TRANSPORT:
${Object.entries(propertyDetails.transportation).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

DIRECTIVES:
- Soyez amical, professionnel et serviable
- Fournissez des détails spécifiques de la base de connaissances lorsque c'est pertinent
- Pour les problèmes de maintenance, fournissez le numéro de contact de maintenance
- Pour les urgences, insistez sur l'appel du 911 en premier
- Recommandez des endroits locaux lorsque les invités demandent des choses à faire
- Soyez toujours clair sur les règles de la maison lorsque c'est pertinent`
};

// Language detection function
function detectLanguage(text) {
  const spanishWords = ['hola', 'gracias', 'por favor', 'ayuda', 'información'];
  const frenchWords = ['bonjour', 'merci', 's\'il vous plaît', 'aide', 'information'];
  
  const lowerText = text.toLowerCase();
  
  if (spanishWords.some(word => lowerText.includes(word))) return 'es';
  if (frenchWords.some(word => lowerText.includes(word))) return 'fr';
  
  return 'en'; // Default to English
}

// Root endpoint - serves the HTML interface from public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString(),
    openaiKey: !!process.env.OPENAI_API_KEY,
    property: propertyDetails.name,
    version: '3.0.0',
    features: ['multi-language', 'chat-history', 'dark-mode']
  });
});

// ENHANCED AI-POWERED CHAT ENDPOINT WITH MULTI-LANGUAGE
app.post('/chat/ai', async (req, res) => {
  try {
    let message = '';
    let preferredLanguage = 'en'; // Default language
    
    // Handle both JSON and raw body
    if (req.is('application/json')) {
      message = req.body.message || '';
      preferredLanguage = req.body.language || detectLanguage(message);
    } else {
      try {
        const bodyString = req.body.toString();
        const parsed = JSON.parse(bodyString);
        message = parsed.message || '';
        preferredLanguage = parsed.language || detectLanguage(message);
      } catch (e) {
        message = req.body.toString();
        preferredLanguage = detectLanguage(message);
      }
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    console.log('Attempting AI response for:', message, 'Language:', preferredLanguage);

    // Use OpenAI with enhanced knowledge and language support
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPTS[preferredLanguage] || SYSTEM_PROMPTS.en
        },
        {
          role: "user",
          content: `Guest Question: "${message}"`
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      yourMessage: message,
      detectedLanguage: preferredLanguage,
      type: 'ai',
      usage: completion.usage,
      property: propertyDetails.name
    });

  } catch (error) {
    console.error('AI Chat error:', error.message);
    
    res.json({ 
      success: false, 
      response: "AI service temporarily unavailable",
      error: error.message,
      timestamp: new Date().toISOString(),
      yourMessage: req.body?.message || '',
      type: 'ai_error'
    });
  }
});

// SIMPLE CHAT (fallback)
app.post('/chat/simple', (req, res) => {
  try {
    let message = '';
    
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
    
    const responses = {
      'check in': `Check-in: ${propertyDetails.schedule.checkIn}. Keys in lockbox code 1234.`,
      'check-in': `Check-in: ${propertyDetails.schedule.checkIn}. Keys in lockbox code 1234.`,
      'wifi': `WiFi: ${propertyDetails.amenities.essentials[0]}`,
      'parking': `Parking: ${propertyDetails.amenities.outdoor[4]}`,
      'rules': `Rules: ${propertyDetails.rules.general.join(', ')}`,
      'emergency': `Emergency: ${propertyDetails.contacts.emergency}. Maintenance: ${propertyDetails.contacts.maintenance}`
    };
    
    const lowerMessage = message.toLowerCase();
    let response = `Welcome to ${propertyDetails.name}! Ask about check-in, amenities, local recommendations, or house rules.`;
    
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
      type: 'simple'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    });
  }
});

// Catch-all handler for SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-language Rental AI Bot running on port ${PORT}`);
  console.log(`📚 Property: ${propertyDetails.name}`);
  console.log(`🌍 Supported languages: English, Spanish, French`);
  console.log(`🌐 Web interface available at: http://localhost:${PORT}`);
  console.log(`🤖 API endpoints: /chat/ai, /chat/simple, /api/health`);
});
