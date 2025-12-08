// User Management Service
const FileManager = require('../utils/fileManager');
const config = require('../config/config');
const logger = require('../utils/logger');

class UserService {
  constructor() {
    this.usersFile = new FileManager(config.dataPath.users);
  }

  async createUser(username, password) {
    try {
      const users = await this.usersFile.read();
      
      // Check if user exists
      if (users.some(u => u.username === username)) {
        return {
          success: false,
          message: 'Username already exists'
        };
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        password: password, // In production, hash this!
        created: new Date().toISOString(),
        role: 'host'
      };
      
      users.push(newUser);
      await this.usersFile.write(users);
      
      logger.info(`User created: ${newUser.id} (${username})`);
      
      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          created: newUser.created
        }
      };
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async authenticateUser(username, password) {
    try {
      const users = await this.usersFile.read();
      const user = users.find(
        u => u.username === username && u.password === password
      );
      
      if (!user) {
        return {
          success: false,
          message: 'Invalid username or password'
        };
      }
      
      logger.info(`User authenticated: ${user.id} (${username})`);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          created: user.created
        }
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const users = await this.usersFile.read();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return null;
      }
      
      // Don't return password
      return {
        id: user.id,
        username: user.username,
        created: user.created,
        role: user.role
      };
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }
}

module.exports = new UserService();

