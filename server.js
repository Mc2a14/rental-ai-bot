const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
let openai;
try {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  openai = new OpenAIApi(configuration);
  console.log('✅ OpenAI configured successfully');
} catch (error) {
  console.log('❌ OpenAI configuration failed:', error.message);
  openai = null;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is LIVE! 🚀',
    ai_configured: !!openai,
    timestamp: new Date().toISOString()
  });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If OpenAI is configured, use AI
    if (openai) {
      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant for a short-term rental property. Answer guest questions about check-in (3PM), check-out (11AM), WiFi (GuestNetwork/Welcome123), house rules (no smoking, no parties, quiet hours 10PM-7AM), and other property information. Be friendly and professional."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        });

        const aiResponse = completion.data.choices[0].message.content;
        
        return res.json({ 
          success: true, 
          response: aiResponse,
          ai_generated: true,
          timestamp: new Date().toISOString()
        });
      } catch (aiError) {
        console.log('AI API error, using fallback:', aiError.message);
      }
    }

    // Fallback responses
    const lowerMessage = message.toLowerCase();
    const responses = {
      'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox by the main door!',
      'check out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
      'wifi': 'WiFi: GuestNetwork, Password: Welcome123',
      'rules': 'No smoking, no parties, quiet hours 10PM-7AM. Thank you!',
      'contact': 'For urgent matters, call +1-555-0123. For other questions, I\'m here to help!'
    };

    let response = "I'm here to help with your stay! Ask me about check-in, WiFi, house rules, or anything else.";
    
    for (const [key, answer] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = answer;
        break;
      }
    }

    res.json({ 
      success: true, 
      response: response,
      ai_generated: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process message'
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Rental AI Bot is working!',
    ai_available: !!openai,
    endpoints: {
      health: '/api/health',
      chat: 'POST /api/chat',
      test: '/api/test'
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI Rental Bot running on port ${PORT}`);
  console.log(`📍 Health: /api/health`);
  console.log(`💬 Chat: POST /api/chat`);
  console.log(`🤖 AI Status: ${openai ? 'Enabled' : 'Disabled'}`);
});
