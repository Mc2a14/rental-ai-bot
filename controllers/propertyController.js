// Property Controller
const propertyService = require('../services/propertyService');
const logger = require('../utils/logger');

class PropertyController {
  async saveProperty(req, res) {
    try {
      const { userId, propertyData, propertyId } = req.body;
      
      logger.info(`Saving property for user: ${userId}`);
      logger.info(`Property name: ${propertyData?.name}`);
      logger.info(`Property ID (update): ${propertyId || 'new'}`);
      
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
      
      // If propertyId is provided, update existing property; otherwise create new
      let result;
      if (propertyId) {
        logger.info(`🔄 Attempting to UPDATE property: ${propertyId}`);
        result = await propertyService.updateProperty(propertyId, propertyData);
        logger.info(`✅ Property UPDATED: ${result.propertyId}`);
      } else {
        logger.info(`🆕 Creating NEW property for user: ${userId}`);
        result = await propertyService.saveProperty(userId, propertyData);
        logger.info(`✅ Property CREATED: ${result.propertyId}`);
      }
      
      logger.info(`Property operation completed: ${result.propertyId}`);
      
      // Verify the property was actually saved/updated
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

  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const { propertyId, label, description } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Property ID is required'
        });
      }

      if (!label) {
        return res.status(400).json({
          success: false,
          message: 'Image label is required (e.g., "Parking Lot", "Key Lock", "Building Entrance")'
        });
      }

      // Get the property to add image to
      const property = await propertyService.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Create image object
      const imageUrl = `/uploads/${req.file.filename}`;
      const imageData = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        label: label,
        description: description || '',
        filename: req.file.filename,
        uploadedAt: new Date().toISOString()
      };

      // Add image to property's images array
      const images = property.images || [];
      images.push(imageData);

      // Update property with new image
      await propertyService.updateProperty(propertyId, { images });

      logger.info(`Image uploaded for property ${propertyId}: ${label}`);

      return res.json({
        success: true,
        image: imageData,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      logger.error('Image upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error uploading image',
        error: error.message
      });
    }
  }
}

module.exports = new PropertyController();

