// Property Controller
const propertyService = require('../services/propertyService');
const logger = require('../utils/logger');

class PropertyController {
  async saveProperty(req, res) {
    try {
      const { userId, propertyData } = req.body;
      
      logger.info(`Saving property for user: ${userId}`);
      logger.info(`Property name: ${propertyData?.name}`);
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      if (!propertyData || !propertyData.name) {
        return res.status(400).json({
          success: false,
          message: 'Property data with name is required'
        });
      }
      
      const result = await propertyService.saveProperty(userId, propertyData);
      
      logger.info(`Property saved successfully: ${result.propertyId}`);
      
      // Verify the property was actually saved
      const verifyProperty = await propertyService.getProperty(result.propertyId);
      if (!verifyProperty) {
        logger.error(`WARNING: Property ${result.propertyId} was not found after saving!`);
      } else {
        logger.info(`Verified: Property ${result.propertyId} exists in database`);
      }
      
      return res.json({
        success: true,
        propertyId: result.propertyId,
        guestLink: `/property/${result.propertyId}`
      });
    } catch (error) {
      logger.error('Property save error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error saving property',
        error: error.message
      });
    }
  }

  async getProperty(req, res) {
    try {
      const { propertyId } = req.params;
      
      logger.info(`Getting property: ${propertyId}`);
      
      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }
      
      const property = await propertyService.getProperty(propertyId);
      
      if (!property) {
        // Log all available properties for debugging
        const allProperties = await propertyService.getAllProperties();
        logger.warn(`Property ${propertyId} not found. Available properties: ${Object.keys(allProperties).join(', ')}`);
        
        return res.status(404).json({
          success: false,
          message: 'Property not found',
          requestedId: propertyId,
          availableCount: Object.keys(allProperties).length
        });
      }
      
      logger.info(`Property found: ${property.name || propertyId}`);
      
      return res.json({
        success: true,
        property: property
      });
    } catch (error) {
      logger.error('Property get error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving property',
        error: error.message
      });
    }
  }

  async getUserProperties(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      const properties = await propertyService.getUserProperties(userId);
      
      return res.json({
        success: true,
        properties: properties
      });
    } catch (error) {
      logger.error('User properties get error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving user properties'
      });
    }
  }

  async getPropertyConfig(req, res) {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        return res.json({});
      }
      
      const property = await propertyService.getProperty(propertyId);
      
      if (!property) {
        return res.json({});
      }
      
      // Remove sensitive data for guest view
      const { userId, ...guestData } = property;
      
      return res.json(guestData);
    } catch (error) {
      logger.error('Property config get error:', error);
      return res.json({});
    }
  }
}

module.exports = new PropertyController();

