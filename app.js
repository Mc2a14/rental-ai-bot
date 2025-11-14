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

// Simple chat endpoint
app.post('/chat', (req, res) => {
  const { message } = req.body;
  
  let response = "I'm here to help with your stay!";
  
  if (message?.toLowerCase().includes('wifi')) {
    response = 'WiFi: GuestNetwork, Password: Welcome123';
  } else if (message?.toLowerCase().includes('check')) {
    response = 'Check-in is at 3:00 PM. Keys are in the lockbox!';
  }
  
  res.json({ 
    success: true, 
    response: response
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
