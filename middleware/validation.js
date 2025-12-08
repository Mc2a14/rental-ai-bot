// Validation Middleware
const validateChatRequest = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message is required and must be a non-empty string'
    });
  }
  
  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message is too long (max 1000 characters)'
    });
  }
  
  next();
};

module.exports = {
  validateChatRequest
};

