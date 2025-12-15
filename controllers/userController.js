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
      
      logger.info(`Login attempt for username: ${username}`);
      
      const result = await userService.authenticateUser(username.trim(), password);
      
      if (result.success) {
        // Set session data
        req.session.userId = result.user.id || result.user.userId;
        req.session.username = result.user.username;
        req.session.loggedIn = true;
        
        logger.info(`✅ User logged in successfully: ${result.user.username} (session: ${req.sessionID})`);
        
        return res.json({
          success: true,
          user: result.user
        });
      } else {
        logger.warn(`❌ Login failed for username: ${username} - ${result.message}`);
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
        // Auto-login after registration
        req.session.userId = result.user.id || result.user.userId;
        req.session.username = result.user.username;
        req.session.loggedIn = true;
        
        logger.info(`User registered and logged in: ${result.user.username} (session: ${req.sessionID})`);
        
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

  async getCurrentUser(req, res) {
    try {
      if (req.session && req.session.loggedIn && req.session.userId) {
        const user = await userService.getUserById(req.session.userId);
        if (user) {
          return res.json({
            success: true,
            user: {
              id: user.id || user.userId,
              userId: user.id || user.userId,
              username: user.username,
              created: user.created
            }
          });
        }
      }
      
      return res.json({
        success: false,
        message: 'Not authenticated'
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Logout error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error logging out'
          });
        }
        
        res.clearCookie('rentalai.sid');
        return res.json({
          success: true,
          message: 'Logged out successfully'
        });
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during logout'
      });
    }
  }
}

module.exports = new UserController();

