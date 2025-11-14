import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

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

// Enhanced AI Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, hostId, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // AI Prompt for rental assistance
    const prompt = `
    You are a helpful short-term rental assistant. You help guests with their stay.
    
    Context: ${context || 'General rental assistance'}
    
    Guest Question: ${message}
    
    Please provide a helpful, friendly response focused on:
    - Check-in/check-out procedures
    - WiFi and amenities
    - House rules
    - Local recommendations
    - Emergency contacts
    
    Keep responses concise and practical.
    `;

    // Use OpenAI for intelligent responses
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful short-term rental assistant. Provide clear, practical answers about rental properties."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      success: true,
      response: aiResponse,
      messageId: 'msg_' + Date.now(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      fallback: "I'm here to help with your stay! Ask about check-in, WiFi, or house rules."
    });
  }
});

// Test endpoint without AI (fallback)
app.post('/chat/simple', (req, res) => {
  const { message } = req.body;
  
  const responses = {
    'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
    'check out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
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
    response: response,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health: https://rental-ai-bot-production.up.railway.app/health`);
  console.log(`📍 Chat: POST https://rental-ai-bot-production.up.railway.app/chat`);
});
