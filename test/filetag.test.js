const FileTag = require('../lib');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('FileTag', () => {
  let tempDir;
  let testDbPath;
  let testFilePath;
  let fileTag;

  beforeEach(async () => {
    // Create a temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filetag-test-'));
    testDbPath = path.join(tempDir, '.filetag-test.json');
    testFilePath = path.join(tempDir, 'test-file.txt');
    
    // Create a test file
    await fs.writeFile(testFilePath, 'test content');
    
    // Create FileTag instance
    fileTag = new FileTag(testDbPath);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('init', () => {
    test('should initialize with empty database if file does not exist', async () => {
      await fileTag.init();
      expect(fileTag.db).toEqual({});
    });

    test('should load existing database', async () => {
      const testDb = {
        '/path/to/file': { tags: ['test'], created: '2024-01-01', modified: '2024-01-01' }
      };
      await fs.writeFile(testDbPath, JSON.stringify(testDb));
      
      await fileTag.init();
      expect(fileTag.db).toEqual(testDb);
    });
  });

  describe('addTags', () => {
    test('should add tags to a file', async () => {
      const tags = await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      expect(tags).toEqual(['tag1', 'tag2']);
    });

    test('should not add duplicate tags', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      const tags = await fileTag.addTags(testFilePath, ['tag2', 'tag3']);
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should throw error for non-existent file', async () => {
      await expect(
        fileTag.addTags('/non/existent/file.txt', ['tag1'])
      ).rejects.toThrow('File not found');
    });

    test('should store absolute path', async () => {
      await fileTag.addTags(testFilePath, ['tag1']);
      const absolutePath = path.resolve(testFilePath);
      expect(fileTag.db[absolutePath]).toBeDefined();
    });
  });

  describe('removeTags', () => {
    test('should remove tags from a file', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2', 'tag3']);
      const remaining = await fileTag.removeTags(testFilePath, ['tag2']);
      expect(remaining).toEqual(['tag1', 'tag3']);
    });

    test('should return empty array if file has no tags', async () => {
      const remaining = await fileTag.removeTags(testFilePath, ['tag1']);
      expect(remaining).toEqual([]);
    });

    test('should handle removing non-existent tags', async () => {
      await fileTag.addTags(testFilePath, ['tag1']);
      const remaining = await fileTag.removeTags(testFilePath, ['tag2']);
      expect(remaining).toEqual(['tag1']);
    });
  });

  describe('getTags', () => {
    test('should return tags for a file', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      const tags = await fileTag.getTags(testFilePath);
      expect(tags).toEqual(['tag1', 'tag2']);
    });

    test('should return empty array for untagged file', async () => {
      const tags = await fileTag.getTags(testFilePath);
      expect(tags).toEqual([]);
    });
  });

  describe('findByTags', () => {
    let file1, file2, file3;

    beforeEach(async () => {
      file1 = path.join(tempDir, 'file1.txt');
      file2 = path.join(tempDir, 'file2.txt');
      file3 = path.join(tempDir, 'file3.txt');
      
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      await fs.writeFile(file3, 'content3');

      await fileTag.addTags(file1, ['work', 'important']);
      await fileTag.addTags(file2, ['work', 'draft']);
      await fileTag.addTags(file3, ['personal', 'important']);
    });

    test('should find files with any matching tag', async () => {
      const results = await fileTag.findByTags(['work'], false);
      expect(results).toHaveLength(2);
      expect(results).toContain(path.resolve(file1));
      expect(results).toContain(path.resolve(file2));
    });

    test('should find files with all matching tags', async () => {
      const results = await fileTag.findByTags(['work', 'important'], true);
      expect(results).toHaveLength(1);
      expect(results).toContain(path.resolve(file1));
    });

    test('should return empty array when no files match', async () => {
      const results = await fileTag.findByTags(['nonexistent'], false);
      expect(results).toEqual([]);
    });
  });

  describe('listAllTags', () => {
    test('should list all unique tags', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      
      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');

      await fileTag.addTags(file1, ['tag1', 'tag2']);
      await fileTag.addTags(file2, ['tag2', 'tag3']);

      const tags = await fileTag.listAllTags();
      expect(tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should return empty array when no tags exist', async () => {
      const tags = await fileTag.listAllTags();
      expect(tags).toEqual([]);
    });
  });

  describe('listAll', () => {
    test('should list all files with their tags', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      const all = await fileTag.listAll();
      
      const absolutePath = path.resolve(testFilePath);
      expect(all[absolutePath]).toBeDefined();
      expect(all[absolutePath].tags).toEqual(['tag1', 'tag2']);
      expect(all[absolutePath].created).toBeDefined();
      expect(all[absolutePath].modified).toBeDefined();
    });
  });

  describe('clearTags', () => {
    test('should clear all tags from a file', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      await fileTag.clearTags(testFilePath);
      
      const tags = await fileTag.getTags(testFilePath);
      expect(tags).toEqual([]);
    });
  });

  describe('save and persistence', () => {
    test('should persist data across instances', async () => {
      await fileTag.addTags(testFilePath, ['tag1', 'tag2']);
      
      // Create new instance with same database
      const fileTag2 = new FileTag(testDbPath);
      const tags = await fileTag2.getTags(testFilePath);
      
      expect(tags).toEqual(['tag1', 'tag2']);
    });
  });
});
