const fs = require('fs').promises;
const path = require('path');

/**
 * FileTag - A simple file tagging system
 * Stores tags as extended attributes or in a JSON database
 */
class FileTag {
  constructor(dbPath = '.filetag.json') {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize the tag database
   */
  async init() {
    try {
      const data = await fs.readFile(this.dbPath, 'utf8');
      this.db = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, create new database
      this.db = {};
      await this.save();
    }
  }

  /**
   * Save the database to disk
   */
  async save() {
    await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2));
  }

  /**
   * Add tags to a file
   * @param {string} filePath - Path to the file
   * @param {string[]} tags - Array of tags to add
   */
  async addTags(filePath, tags) {
    if (!this.db) {
      await this.init();
    }

    const absolutePath = path.resolve(filePath);
    
    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    if (!this.db[absolutePath]) {
      this.db[absolutePath] = {
        tags: [],
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };
    }

    // Add new tags (avoid duplicates)
    const existingTags = new Set(this.db[absolutePath].tags);
    tags.forEach(tag => existingTags.add(tag));
    this.db[absolutePath].tags = Array.from(existingTags);
    this.db[absolutePath].modified = new Date().toISOString();

    await this.save();
    return this.db[absolutePath].tags;
  }

  /**
   * Remove tags from a file
   * @param {string} filePath - Path to the file
   * @param {string[]} tags - Array of tags to remove
   */
  async removeTags(filePath, tags) {
    if (!this.db) {
      await this.init();
    }

    const absolutePath = path.resolve(filePath);

    if (!this.db[absolutePath]) {
      return [];
    }

    const tagSet = new Set(tags);
    this.db[absolutePath].tags = this.db[absolutePath].tags.filter(
      tag => !tagSet.has(tag)
    );
    this.db[absolutePath].modified = new Date().toISOString();

    await this.save();
    return this.db[absolutePath].tags;
  }

  /**
   * Get all tags for a file
   * @param {string} filePath - Path to the file
   * @returns {string[]} Array of tags
   */
  async getTags(filePath) {
    if (!this.db) {
      await this.init();
    }

    const absolutePath = path.resolve(filePath);
    return this.db[absolutePath]?.tags || [];
  }

  /**
   * Find files by tags
   * @param {string[]} tags - Array of tags to search for
   * @param {boolean} matchAll - If true, file must have all tags; if false, any tag matches
   * @returns {string[]} Array of file paths
   */
  async findByTags(tags, matchAll = false) {
    if (!this.db) {
      await this.init();
    }

    const results = [];

    for (const [filePath, data] of Object.entries(this.db)) {
      const fileTags = new Set(data.tags);
      
      if (matchAll) {
        // File must have all search tags
        if (tags.every(tag => fileTags.has(tag))) {
          results.push(filePath);
        }
      } else {
        // File must have at least one search tag
        if (tags.some(tag => fileTags.has(tag))) {
          results.push(filePath);
        }
      }
    }

    return results;
  }

  /**
   * List all tags in the database
   * @returns {string[]} Array of all unique tags
   */
  async listAllTags() {
    if (!this.db) {
      await this.init();
    }

    const allTags = new Set();
    for (const data of Object.values(this.db)) {
      data.tags.forEach(tag => allTags.add(tag));
    }

    return Array.from(allTags).sort();
  }

  /**
   * Get all files with their tags
   * @returns {Object} Object mapping file paths to their data
   */
  async listAll() {
    if (!this.db) {
      await this.init();
    }

    return { ...this.db };
  }

  /**
   * Clear all tags from a file
   * @param {string} filePath - Path to the file
   */
  async clearTags(filePath) {
    if (!this.db) {
      await this.init();
    }

    const absolutePath = path.resolve(filePath);
    delete this.db[absolutePath];
    await this.save();
  }
}

module.exports = FileTag;
