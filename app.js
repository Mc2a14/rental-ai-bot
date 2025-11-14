import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.raw({ type: '*/*' }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// SIMPLE CHAT (original keyword-based)
app.post('/chat/simple', (req, res) => {
  try {
    let message = '';
    
    try {
      const bodyString = req.body.toString();
      const parsed = JSON.parse(bodyString);
      message = parsed.message || '';
    } catch (e) {
      message = req.body.toString();
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    const responses = {
      'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
      'check-in': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
      'checkin': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
      'check out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
      'check-out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
      'checkout': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
      'wifi': 'WiFi: GuestNetwork, Password: Welcome123',
      'internet': 'WiFi: GuestNetwork, Password: Welcome123',
      'wireless': 'WiFi: GuestNetwork, Password: Welcome123',
      'parking': 'Free parking is available in spot #A15',
      'park': 'Free parking is available in spot #A15',
      'car': 'Free parking is available in spot #A15',
      'rules': 'No smoking, no parties, quiet hours 10PM-7AM',
      'rule': 'No smoking, no parties, quiet hours 10PM-7AM',
      'policy': 'No smoking, no parties, quiet hours 10PM-7AM',
      'emergency': 'For emergencies, call 911. For maintenance, call (555) 123-4567',
      'urgent': 'For emergencies, call 911. For maintenance, call (555) 123-4567',
      'help': 'For emergencies, call 911. For maintenance, call (555) 123-4567',
      'amenities': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.',
      'amenity': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.',
      'towels': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.',
      'toiletries': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.'
    };
    
    const lowerMessage = message.toLowerCase();
    let response = "I'm here to help with your stay! Ask about check-in, WiFi, parking, house rules, amenities, or emergencies.";
    
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
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    });
  }
});

// NEW: AI-POWERED CHAT ENDPOINT
app.post('/chat/ai', async (req, res) => {
  try {
    let message = '';
    
    try {
      const bodyString = req.body.toString();
      const parsed = JSON.parse(bodyString);
      message = parsed.message || '';
    } catch (e) {
      message = req.body.toString();
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // AI Prompt for rental assistance
    const prompt = `
    You are a helpful short-term rental assistant. You help guests with their stay.
    
    Property Information:
    - Check-in: 3:00 PM, keys in lockbox (code: 1234)
    - Check-out: 11:00 AM 
    - WiFi: GuestNetwork, Password: Welcome123
    - Parking: Spot #A15
    - Rules: No smoking, no parties, quiet hours 10PM-7AM
    - Emergency: Call 911, Maintenance: (555) 123-4567
    - Amenities: Towels, toiletries, coffee, tea, fully equipped kitchen
    
    Guest Question: "${message}"
    
    Provide a helpful, friendly response. If you don't know something, suggest they contact the host.
    Keep responses concise and practical.
    `;

    // Use OpenAI for intelligent responses
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful short-term rental assistant. Provide clear, practical answers about rental properties. Be friendly but professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      yourMessage: message,
      type: 'ai',
      usage: completion.usage
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Fallback to simple chat if AI fails
    try {
      const bodyString = req.body.toString();
      const parsed = JSON.parse(bodyString);
      const message = parsed.message || '';
      
      // Use simple chat as fallback
      const responses = {
        'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
        'check-out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
        'wifi': 'WiFi: GuestNetwork, Password: Welcome123',
        'parking': 'Free parking is available in spot #A15',
        'rules': 'No smoking, no parties, quiet hours 10PM-7AM',
        'emergency': 'For emergencies, call 911. For maintenance, call (555) 123-4567'
      };
      
      const lowerMessage = message.toLowerCase();
      let response = "I'm here to help with your stay! Ask about check-in, WiFi, parking, or house rules.";
      
      for (const [key, answer] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
          response = answer;
          break;
        }
      }
      
      res.json({ 
        success: true, 
        response: response + " (AI temporarily unavailable)",
        timestamp: new Date().toISOString(),
        yourMessage: message,
        type: 'fallback'
      });
      
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Simple Chat: POST /chat/simple`);
  console.log(`📍 AI Chat: POST /chat/ai`);
  console.log(`📍 Health: GET /health`);
});
