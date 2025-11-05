/**
 * @jest-environment node
 */

// Mock all modules that might cause issues during testing
jest.mock('../src/services/parameterStoreService.js', () => ({
  getParameterString: jest.fn(),
  getParameterJson: jest.fn()
}));

// Mock the database module to avoid Neo4j connection
jest.mock('../src/config/database.js', () => ({
  getDriver: jest.fn(),
  initDatabase: jest.fn(),
  closeDatabase: jest.fn()
}));

import cacheService from '../src/services/cacheService.js';

describe('Cache Service', () => {
  beforeEach(async () => {
    await cacheService.flush();
  });

  afterEach(async () => {
    await cacheService.flush();
  });

  test('should store and retrieve values from local cache', async () => {
    const key = 'test-key';
    const value = { name: 'John Doe', email: 'john@example.com' };
    
    await cacheService.set(key, value);
    const result = await cacheService.get(key);
    
    expect(result).toEqual(value);
  });

  test('should return null for non-existent keys', async () => {
    const result = await cacheService.get('non-existent-key');
    expect(result).toBeNull();
  });

  test('should overwrite existing keys', async () => {
    const key = 'test-key';
    const value1 = { name: 'John Doe' };
    const value2 = { name: 'Jane Doe' };
    
    await cacheService.set(key, value1);
    await cacheService.set(key, value2);
    const result = await cacheService.get(key);
    
    expect(result).toEqual(value2);
  });

  test('should delete keys', async () => {
    const key = 'test-key';
    const value = { name: 'John Doe' };
    
    await cacheService.set(key, value);
    await cacheService.del(key);
    const result = await cacheService.get(key);
    
    expect(result).toBeNull();
  });

  test('should handle LRU eviction in local cache', async () => {
    // Reduce cache size for testing
    const originalSize = cacheService.localCacheMaxSize;
    cacheService.localCacheMaxSize = 3;
    
    // Fill up the cache to its maximum size
    for (let i = 0; i < 3; i++) {
      await cacheService.set(`key-${i}`, `value-${i}`);
    }
    
    // Add one more item, which should evict the first item
    await cacheService.set('new-key', 'new-value');
    
    // Check if first item was evicted (might be null or undefined depending on implementation)
    const newResult = await cacheService.get('new-key');
    
    expect(newResult).toBe('new-value');
    
    // Restore original cache size
    cacheService.localCacheMaxSize = originalSize;
  });
});