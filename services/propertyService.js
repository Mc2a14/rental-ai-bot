// Property Management Service
const FileManager = require('../utils/fileManager');
const database = require('../utils/database');
const config = require('../config/config');
const logger = require('../utils/logger');

class PropertyService {
  constructor() {
    this.propertiesFile = new FileManager(config.dataPath.properties);
    this.propertyConfigFile = new FileManager(config.dataPath.propertyConfig);
    this.appliancesFile = new FileManager(config.dataPath.appliances);
    this.recommendationsFile = new FileManager(config.dataPath.recommendations);
    this.useDatabase = false;
  }

  async ensureDatabase() {
    if (!this.useDatabase) {
      const pool = await database.connect();
      this.useDatabase = !!pool;
    }
    return this.useDatabase;
  }

  async saveProperty(userId, propertyData) {
    try {
      // Try database first
      if (await this.ensureDatabase()) {
        return await this.savePropertyToDatabase(userId, propertyData);
      }
      
      // Fallback to file
      return await this.savePropertyToFile(userId, propertyData);
    } catch (error) {
      logger.error('Error saving property:', error);
      throw error;
    }
  }

  async savePropertyToDatabase(userId, propertyData) {
    const propertyId = `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await database.query(`
      INSERT INTO properties (
        property_id, user_id, name, address, type,
        host_contact, maintenance_contact, emergency_contact,
        checkin_time, checkout_time, late_checkout,
        amenities, house_rules, recommendations, appliances
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      propertyId,
      userId,
      propertyData.name,
      propertyData.address || null,
      propertyData.type || null,
      propertyData.hostContact || null,
      propertyData.maintenanceContact || null,
      propertyData.emergencyContact || null,
      propertyData.checkinTime || null,
      propertyData.checkoutTime || null,
      propertyData.lateCheckout || null,
      JSON.stringify(propertyData.amenities || {}),
      propertyData.houseRules || null,
      JSON.stringify(propertyData.recommendations || []),
      JSON.stringify(propertyData.appliances || [])
    ]);

    const row = result.rows[0];
    const property = this.mapDatabaseRowToProperty(row);
    
    logger.info(`Property saved to database: ${propertyId} for user: ${userId}`);
    
    return {
      success: true,
      propertyId: propertyId,
      property: property
    };
  }

  async savePropertyToFile(userId, propertyData) {
    const properties = await this.propertiesFile.read();
    
    const propertyId = `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const property = {
      id: propertyId,
      userId: userId,
      ...propertyData,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    properties[propertyId] = property;
    await this.propertiesFile.write(properties);
    
    logger.info(`Property saved to file: ${propertyId} for user: ${userId}`);
    
    return {
      success: true,
      propertyId: propertyId,
      property: property
    };
  }

  async getProperty(propertyId) {
    try {
      // Try database first
      if (await this.ensureDatabase()) {
        return await this.getPropertyFromDatabase(propertyId);
      }
      
      // Fallback to file
      return await this.getPropertyFromFile(propertyId);
    } catch (error) {
      logger.error('Error getting property:', error);
      throw error;
    }
  }

  async getPropertyFromDatabase(propertyId) {
    const result = await database.query(
      'SELECT * FROM properties WHERE property_id = $1',
      [propertyId]
    );

    if (result.rows.length === 0) {
      logger.warn(`Property ${propertyId} not found in database`);
      return null;
    }

    const property = this.mapDatabaseRowToProperty(result.rows[0]);
    logger.info(`Property found in database: ${property.name || propertyId}`);
    return property;
  }

  async getPropertyFromFile(propertyId) {
    const properties = await this.propertiesFile.read();
    const property = properties[propertyId];

    if (!property) {
      logger.warn(`Property ${propertyId} not found in file`);
      return null;
    }

    logger.info(`Property found in file: ${property.name || propertyId}`);
    return property;
  }

  mapDatabaseRowToProperty(row) {
    return {
      id: row.property_id,
      propertyId: row.property_id,
      userId: row.user_id,
      name: row.name,
      address: row.address,
      type: row.type,
      hostContact: row.host_contact,
      maintenanceContact: row.maintenance_contact,
      emergencyContact: row.emergency_contact,
      checkinTime: row.checkin_time,
      checkoutTime: row.checkout_time,
      lateCheckout: row.late_checkout,
      amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities) : (row.amenities || {}),
      houseRules: row.house_rules,
      recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : (row.recommendations || []),
      appliances: typeof row.appliances === 'string' ? JSON.parse(row.appliances) : (row.appliances || []),
      created: row.created_at?.toISOString(),
      updated: row.updated_at?.toISOString()
    };
  }

  async getAllProperties() {
    try {
      if (await this.ensureDatabase()) {
        const result = await database.query('SELECT * FROM properties');
        return result.rows.reduce((acc, row) => {
          acc[row.property_id] = this.mapDatabaseRowToProperty(row);
          return acc;
        }, {});
      }
      
      return await this.propertiesFile.read();
    } catch (error) {
      logger.error('Error getting all properties:', error);
      return {};
    }
  }

  async getUserProperties(userId) {
    try {
      if (await this.ensureDatabase()) {
        const result = await database.query(
          'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
          [userId]
        );
        return result.rows.map(row => this.mapDatabaseRowToProperty(row));
      }
      
      const properties = await this.propertiesFile.read();
      return Object.values(properties).filter(p => p.userId === userId);
    } catch (error) {
      logger.error('Error getting user properties:', error);
      throw error;
    }
  }

  async updateProperty(propertyId, updates) {
    try {
      if (await this.ensureDatabase()) {
        const setClause = [];
        const values = [];
        let paramCount = 1;

        if (updates.name) {
          setClause.push(`name = $${paramCount++}`);
          values.push(updates.name);
        }
        if (updates.address !== undefined) {
          setClause.push(`address = $${paramCount++}`);
          values.push(updates.address);
        }
        // Add more fields as needed
        
        setClause.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(propertyId);

        const result = await database.query(
          `UPDATE properties SET ${setClause.join(', ')} WHERE property_id = $${paramCount} RETURNING *`,
          values
        );

        if (result.rows.length === 0) {
          throw new Error('Property not found');
        }

        return {
          success: true,
          property: this.mapDatabaseRowToProperty(result.rows[0])
        };
      }
      
      const properties = await this.propertiesFile.read();
      if (!properties[propertyId]) {
        throw new Error('Property not found');
      }

      properties[propertyId] = {
        ...properties[propertyId],
        ...updates,
        updated: new Date().toISOString()
      };

      await this.propertiesFile.write(properties);

      return {
        success: true,
        property: properties[propertyId]
      };
    } catch (error) {
      logger.error('Error updating property:', error);
      throw error;
    }
  }
}

module.exports = new PropertyService();
