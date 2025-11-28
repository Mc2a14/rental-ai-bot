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

// Enhanced AI System Prompt
const SYSTEM_PROMPT = `You are a knowledgeable and helpful short-term rental assistant for "${propertyDetails.name}".

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
- Always be clear about house rules when relevant
`;

// Root endpoint - now serves the HTML interface
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
    version: '2.0.0'
  });
});

// ENHANCED AI-POWERED CHAT ENDPOINT
app.post('/chat/ai', async (req, res) => {
  try {
    let message = '';
    
    // Handle both JSON and raw body
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

    console.log('Attempting AI response for:', message);

    // Use OpenAI with enhanced knowledge
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
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
  console.log(`🚀 Enhanced Rental AI Bot running on port ${PORT}`);
  console.log(`📚 Property: ${propertyDetails.name}`);
  console.log(`🌐 Web interface available at: http://localhost:${PORT}`);
  console.log(`🤖 API endpoints: /chat/ai, /chat/simple, /api/health`);
});
