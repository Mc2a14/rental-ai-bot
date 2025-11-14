import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Improved JSON parsing that handles missing Content-Type
app.use(express.json({ 
  type: ['application/json', 'text/plain'] // Also accept text/plain
}));

// Manual JSON parsing for empty content-type
app.use((req, res, next) => {
  if (req.headers['content-type'] === '' && typeof req.body === 'string') {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // If parsing fails, continue with original body
    }
  }
  next();
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

// Simple chat endpoint (FIXED VERSION)
app.post('/chat/simple', (req, res) => {
  try {
    console.log('Received body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    let message = req.body.message;
    
    // If body is a string, try to parse it
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        message = parsed.message;
      } catch (e) {
        // If parsing fails, continue
      }
    }
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        receivedBody: req.body,
        bodyType: typeof req.body
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
      timestamp: new Date().toISOString()
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
