import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Manual body parsing that will definitely work
app.use(express.raw({ type: '*/*' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Simple chat endpoint - SUPER SIMPLE VERSION
app.post('/chat/simple', (req, res) => {
  try {
    console.log('Raw body received:', req.body.toString());
    
    let message = '';
    
    // Try to parse the raw body as JSON
    try {
      const bodyString = req.body.toString();
      const parsed = JSON.parse(bodyString);
      message = parsed.message || '';
    } catch (e) {
      console.log('JSON parse failed, using raw body');
      message = req.body.toString();
    }
    
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        hint: 'Send JSON like: {"message": "your question"}'
      });
    }
    
    const responses = {
      'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox at the front door. The code is 1234.',
      'check out': 'Check-out is at 11:00 AM. Please leave keys in the lockbox.',
      'wifi': 'WiFi: GuestNetwork, Password: Welcome123',
      'parking': 'Free parking is available in spot #A15',
      'rules': 'No smoking, no parties, quiet hours 10PM-7AM',
      'emergency': 'For emergencies, call 911. For maintenance, call (555) 123-4567',
      'amenities': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.'
    };
    
    const lowerMessage = message.toLowerCase();
    let response = "I'm here to help with your stay! Ask about check-in, WiFi, parking, house rules, or amenities.";
    
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
      yourMessage: message
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
