// Simple test script to verify cache service functionality
import cacheService from '../src/services/cacheService.js';

async function runTests() {
  console.log('Starting cache service tests...');
  
  // Test 1: Store and retrieve values
  console.log('Test 1: Store and retrieve values');
  const key = 'test-key';
  const value = { name: 'John Doe', email: 'john@example.com' };
  
  await cacheService.set(key, value);
  const result = await cacheService.get(key);
  
  if (JSON.stringify(result) === JSON.stringify(value)) {
    console.log('✓ Test 1 passed');
  } else {
    console.log('✗ Test 1 failed');
    console.log('Expected:', value);
    console.log('Got:', result);
  }
  
  // Test 2: Non-existent keys
  console.log('Test 2: Non-existent keys');
  const nonExistent = await cacheService.get('non-existent-key');
  
  if (nonExistent === null) {
    console.log('✓ Test 2 passed');
  } else {
    console.log('✗ Test 2 failed');
    console.log('Expected: null');
    console.log('Got:', nonExistent);
  }
  
  // Test 3: Overwrite existing keys
  console.log('Test 3: Overwrite existing keys');
  const value1 = { name: 'John Doe' };
  const value2 = { name: 'Jane Doe' };
  
  await cacheService.set(key, value1);
  await cacheService.set(key, value2);
  const overwriteResult = await cacheService.get(key);
  
  if (JSON.stringify(overwriteResult) === JSON.stringify(value2)) {
    console.log('✓ Test 3 passed');
  } else {
    console.log('✗ Test 3 failed');
    console.log('Expected:', value2);
    console.log('Got:', overwriteResult);
  }
  
  // Test 4: Delete keys
  console.log('Test 4: Delete keys');
  const deleteKey = 'delete-test-key';
  const deleteValue = { name: 'Delete Me' };
  
  await cacheService.set(deleteKey, deleteValue);
  await cacheService.del(deleteKey);
  const deleteResult = await cacheService.get(deleteKey);
  
  if (deleteResult === null) {
    console.log('✓ Test 4 passed');
  } else {
    console.log('✗ Test 4 failed');
    console.log('Expected: null');
    console.log('Got:', deleteResult);
  }
  
  // Test 5: LRU eviction
  console.log('Test 5: LRU eviction');
  // Reduce cache size for testing
  const originalSize = cacheService.localCacheMaxSize;
  cacheService.localCacheMaxSize = 3;
  
  // Fill up the cache
  for (let i = 0; i < 3; i++) {
    await cacheService.set(`key-${i}`, `value-${i}`);
  }
  
  // Add one more item, which should evict the first item
  await cacheService.set('new-key', 'new-value');
  
  // Check if first item was evicted
  const evictionResult = await cacheService.get('key-0');
  const newResult = await cacheService.get('new-key');
  
  if (evictionResult === undefined && newResult === 'new-value') {
    console.log('✓ Test 5 passed');
  } else {
    console.log('✗ Test 5 failed');
    console.log('Expected key-0 to be undefined, got:', evictionResult);
    console.log('Expected new-key to be "new-value", got:', newResult);
  }
  
  // Restore original cache size
  cacheService.localCacheMaxSize = originalSize;
  
  console.log('Cache service tests completed.');
  
  // Close Redis connection if open
  await cacheService.close();
}

// Set AWS region to avoid error
process.env.AWS_REGION = 'eu-central-1';

runTests().catch(console.error);