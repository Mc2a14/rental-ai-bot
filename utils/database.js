// Database connection and utilities
const { Pool } = require('pg');
const config = require('../config/config');
const logger = require('./logger');

class Database {
  constructor() {
    this.pool = null;
    this.initialized = false;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      // Railway provides DATABASE_URL, or use individual connection params
      const connectionString = process.env.DATABASE_URL || config.database.connectionString;
      
      if (!connectionString) {
        logger.warn('No DATABASE_URL found, using file-based storage');
        return null;
      }

      this.pool = new Pool({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('✅ Database connected successfully');
      this.initialized = true;
      
      // Initialize schema
      await this.initializeSchema();
      
      return this.pool;
    } catch (error) {
      logger.error('Database connection error:', error);
      logger.warn('Falling back to file-based storage');
      return null;
    }
  }

  async initializeSchema() {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create properties table
      await client.query(`
        CREATE TABLE IF NOT EXISTS properties (
          id SERIAL PRIMARY KEY,
          property_id VARCHAR(255) UNIQUE NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          type VARCHAR(100),
          host_contact TEXT,
          maintenance_contact TEXT,
          emergency_contact TEXT,
          checkin_time VARCHAR(50),
          checkout_time VARCHAR(50),
          late_checkout TEXT,
          amenities JSONB DEFAULT '{}',
          house_rules TEXT,
          recommendations JSONB DEFAULT '[]',
          appliances JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_properties_property_id ON properties(property_id)
      `);

      client.release();
      logger.info('✅ Database schema initialized');
    } catch (error) {
      logger.error('Error initializing schema:', error);
      throw error;
    }
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database not connected');
    }
    return this.pool.query(text, params);
  }

  async getClient() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
      logger.info('Database connection closed');
    }
  }
}

module.exports = new Database();

