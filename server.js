import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root endpoint for Railway health checks (IMPORTANT!)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is running!',
    timestamp: new Date().toISOString()
  });
});

// Test chat endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  
  // Simple response for testing
  const responses = {
    'check in': 'Check-in is at 3:00 PM. Keys are in the lockbox!',
    'wifi': 'WiFi: GuestNetwork, Password: Welcome123',
    'rules': 'No smoking, no parties, quiet hours 10PM-7AM'
  };
  
  const lowerMessage = message.toLowerCase();
  let response = "I'm here to help with your stay! Ask about check-in, WiFi, or house rules.";
  
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

// Host registration (simplified)
app.post('/api/host/register', (req, res) => {
  const hostData = req.body;
  
  res.json({
    success: true,
    hostId: 'host_' + Date.now(),
    message: 'Host registered successfully!',
    propertyName: hostData.propertyName
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📍 API Health: http://localhost:${PORT}/api/health`);
});
