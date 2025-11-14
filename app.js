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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Simple chat endpoint - IMPROVED VERSION
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
    
    // Improved responses with common variations
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
      'toiletries': 'We provide towels, toiletries, coffee, and tea. The kitchen is fully equipped.',
      'late': 'For late check-out requests, please contact the host 24 hours in advance. Fees may apply.',
      'extend': 'For late check-out requests, please contact the host 24 hours in advance. Fees may apply.',
      'cleaning': 'Cleaning service is provided after check-out. For additional cleaning during your stay, contact the host.',
      'clean': 'Cleaning service is provided after check-out. For additional cleaning during your stay, contact the host.',
      'trash': 'Trash should be placed in the bins outside. Recycling is in the blue bin.'
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
  console.log(`📍 Health: https://rental-ai-bot-production.up.railway.app/health`);
  console.log(`📍 Chat: POST https://rental-ai-bot-production.up.railway.app/chat/simple`);
});
