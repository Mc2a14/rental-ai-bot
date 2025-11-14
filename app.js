import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

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

// Debug endpoint to see what's being received
app.post('/debug', (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    received: true,
    headers: req.headers,
    body: req.body
  });
});

// Simple chat endpoint (FIXED VERSION)
app.post('/chat/simple', (req, res) => {
  try {
    console.log('Received body:', req.body);
    
    const { message } = req.body;
    
    if (!message) {
      console.log('No message found in body');
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        receivedBody: req.body // This will show us what was actually received
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
