import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString(),
    openaiKey: !!process.env.OPENAI_API_KEY
  });
});

// AI-POWERED CHAT ENDPOINT
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

    console.log('Attempting AI response for:', message);

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
          content: `Guest Question: "${message}"\n\nProperty Info: Check-in 3PM, Check-out 11AM, WiFi: GuestNetwork/Welcome123, Parking: Spot A15, Rules: No smoking/parties, quiet hours 10PM-7AM`
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
    console.error('AI Chat error:', error.message);
    
    // Fallback with error details
    try {
      const bodyString = req.body.toString();
      const parsed = JSON.parse(bodyString);
      const message = parsed.message || '';
      
      res.json({ 
        success: false, 
        response: "AI service temporarily unavailable",
        error: error.message,
        timestamp: new Date().toISOString(),
        yourMessage: message,
        type: 'ai_error'
      });
      
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Failed to process message: ' + error.message
      });
    }
  }
});

// SIMPLE CHAT (fallback)
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
