// File management utility
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class FileManager {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensureDirectory() {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error('Error creating directory:', error);
      throw error;
    }
  }

  async read() {
    try {
      await this.ensureDirectory();
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return default based on file type
        const fileName = path.basename(this.filePath);
        if (fileName === 'users.json') return [];
        if (fileName === 'properties.json') return {};
        return [];
      }
      logger.error(`Error reading file ${this.filePath}:`, error);
      throw error;
    }
  }

  async write(data) {
    try {
      await this.ensureDirectory();
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      logger.error(`Error writing file ${this.filePath}:`, error);
      throw error;
    }
  }

  async exists() {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = FileManager;

