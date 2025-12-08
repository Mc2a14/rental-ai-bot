// User Controller
const userService = require('../services/userService');
const logger = require('../utils/logger');

class UserController {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      const result = await userService.authenticateUser(username, password);
      
      if (result.success) {
        return res.json({
          success: true,
          user: result.user
        });
      } else {
        return res.json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  }

  async register(req, res) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
      
      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters'
        });
      }
      
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 4 characters'
        });
      }
      
      const result = await userService.createUser(username, password);
      
      if (result.success) {
        return res.json({
          success: true,
          user: result.user
        });
      } else {
        return res.json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  }
}

module.exports = new UserController();

