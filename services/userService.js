// User Management Service
const FileManager = require('../utils/fileManager');
const database = require('../utils/database');
const config = require('../config/config');
const logger = require('../utils/logger');

class UserService {
  constructor() {
    this.usersFile = new FileManager(config.dataPath.users);
    this.useDatabase = false;
  }

  async ensureDatabase() {
    if (!this.useDatabase) {
      const pool = await database.connect();
      this.useDatabase = !!pool;
    }
    return this.useDatabase;
  }

  async createUser(username, password) {
    try {
      if (await this.ensureDatabase()) {
        return await this.createUserInDatabase(username, password);
      }
      
      return await this.createUserInFile(username, password);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserInDatabase(username, password) {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const result = await database.query(`
        INSERT INTO users (user_id, username, password_hash)
        VALUES ($1, $2, $3)
        RETURNING user_id, username, created_at
      `, [userId, username, password]); // In production, hash password!

      logger.info(`User created in database: ${userId} (${username})`);
      
      return {
        success: true,
        user: {
          id: result.rows[0].user_id,
          userId: result.rows[0].user_id,
          username: result.rows[0].username,
          created: result.rows[0].created_at?.toISOString()
        }
      };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return {
          success: false,
          message: 'Username already exists'
        };
      }
      throw error;
    }
  }

  async createUserInFile(username, password) {
    const users = await this.usersFile.read();
    
    if (users.some(u => u.username === username)) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }
    
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: username,
      password: password, // In production, hash this!
      created: new Date().toISOString(),
      role: 'host'
    };
    
    users.push(newUser);
    await this.usersFile.write(users);
    
    logger.info(`User created in file: ${newUser.id} (${username})`);
    
    return {
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        created: newUser.created
      }
    };
  }

  async authenticateUser(username, password) {
    try {
      if (await this.ensureDatabase()) {
        return await this.authenticateUserInDatabase(username, password);
      }
      
      return await this.authenticateUserInFile(username, password);
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  async authenticateUserInDatabase(username, password) {
    const result = await database.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    const user = result.rows[0];
    
    // In production, use bcrypt to compare hashed passwords
    if (user.password_hash !== password) {
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }

    logger.info(`User authenticated in database: ${user.user_id} (${username})`);
    
    return {
      success: true,
      user: {
        id: user.user_id,
        userId: user.user_id,
        username: user.username,
        created: user.created_at?.toISOString()
      }
    };
  }

  async authenticateUserInFile(username, password) {
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
    
    logger.info(`User authenticated in file: ${user.id} (${username})`);
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        created: user.created
      }
    };
  }

  async getUserById(userId) {
    try {
      if (await this.ensureDatabase()) {
        return await this.getUserByIdFromDatabase(userId);
      }
      
      return await this.getUserByIdFromFile(userId);
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByIdFromDatabase(userId) {
    const result = await database.query(
      'SELECT user_id, username, created_at FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.user_id,
      userId: user.user_id,
      username: user.username,
      created: user.created_at?.toISOString()
    };
  }

  async getUserByIdFromFile(userId) {
    const users = await this.usersFile.read();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      username: user.username,
      created: user.created,
      role: user.role
    };
  }
}

module.exports = new UserService();
