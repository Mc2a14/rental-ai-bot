// Test local recommendations
fetch('https://rental-ai-bot-production.up.railway.app/chat/ai', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'What are some good restaurants nearby?'
  })
}).then(r => r.json()).then(console.log);

// Test emergency contacts
fetch('https://rental-ai-bot-production.up.railway.app/chat/ai', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    message: 'What do I do in a medical emergency?'
  })
}).then(r => r.json()).then(console.log);
