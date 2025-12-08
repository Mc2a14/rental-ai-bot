// Property Management Service
const FileManager = require('../utils/fileManager');
const config = require('../config/config');
const logger = require('../utils/logger');

class PropertyService {
  constructor() {
    this.propertiesFile = new FileManager(config.dataPath.properties);
    this.propertyConfigFile = new FileManager(config.dataPath.propertyConfig);
    this.appliancesFile = new FileManager(config.dataPath.appliances);
    this.recommendationsFile = new FileManager(config.dataPath.recommendations);
  }

  async saveProperty(userId, propertyData) {
    try {
      const properties = await this.propertiesFile.read();
      
      // Generate unique property ID
      const propertyId = `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create property object
      const property = {
        id: propertyId,
        userId: userId,
        ...propertyData,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      };
      
      // Save to properties file
      properties[propertyId] = property;
      await this.propertiesFile.write(properties);
      
      // Also update propertyConfig.json for backward compatibility
      const { userId: _, id: __, created: ___, updated: ____, ...configData } = property;
      await this.propertyConfigFile.write(configData);
      
      // Update recommendations and appliances files
      if (propertyData.recommendations) {
        await this.recommendationsFile.write(propertyData.recommendations);
      }
      
      if (propertyData.appliances) {
        await this.appliancesFile.write(propertyData.appliances);
      }
      
      logger.info(`Property saved: ${propertyId} for user: ${userId}`);
      
      return {
        success: true,
        propertyId: propertyId,
        property: property
      };
    } catch (error) {
      logger.error('Error saving property:', error);
      throw error;
    }
  }

  async getProperty(propertyId) {
    try {
      const properties = await this.propertiesFile.read();
      const property = properties[propertyId];
      
      if (!property) {
        return null;
      }
      
      return property;
    } catch (error) {
      logger.error('Error getting property:', error);
      throw error;
    }
  }

  async getUserProperties(userId) {
    try {
      const properties = await this.propertiesFile.read();
      const userProperties = Object.values(properties).filter(
        p => p.userId === userId
      );
      
      return userProperties;
    } catch (error) {
      logger.error('Error getting user properties:', error);
      throw error;
    }
  }

  async updateProperty(propertyId, updates) {
    try {
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
      
      logger.info(`Property updated: ${propertyId}`);
      
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

