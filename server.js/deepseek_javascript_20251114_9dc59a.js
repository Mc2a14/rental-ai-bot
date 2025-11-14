const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Rental AI Bot is LIVE! 🚀',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Your AI bot is working!',
    features: ['Guest messaging', 'Check-in info', 'WiFi details']
  });
});

app.listen(PORT, () => {
  console.log(`🎉 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
