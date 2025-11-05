import redis from 'redis';

class CacheService {
  constructor() {
    // Local in-memory cache with LRU eviction
    this.localCache = new Map();
    this.localCacheMaxSize = 1000;
    
    // Redis client initialization
    this.redisClient = null;
    
    // Initialize Redis if connection string provided
    if (process.env.REDIS_URL) {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error', err);
      });
      
      this.redisClient.connect().catch(console.error);
    }
  }
  
  // Get data from cache
  async get(key) {
    // Try local cache first (LRU)
    if (this.localCache.has(key)) {
      return this.localCache.get(key);
    }
    
    // Try Redis if available
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        const value = await this.redisClient.get(key);
        if (value) {
          const parsed = JSON.parse(value);
          // Add to local cache if there's space
          if (this.localCache.size < this.localCacheMaxSize) {
            this.localCache.set(key, parsed);
          }
          return parsed;
        }
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }
    
    return null;
  }
  
  // Set data in cache
  async set(key, value, ttlSeconds = 300) {
    // Set in local cache with LRU eviction
    if (this.localCache.size >= this.localCacheMaxSize) {
      // Remove oldest entry (Map maintains insertion order)
      const firstKey = this.localCache.keys().next().value;
      if (firstKey) this.localCache.delete(firstKey);
    }
    this.localCache.set(key, value);
    
    // Set in Redis if available
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
  }
  
  // Delete data from cache
  async del(key) {
    this.localCache.delete(key);
    
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }
  }
  
  // Clear all cache
  async flush() {
    this.localCache.clear();
    
    if (this.redisClient && this.redisClient.isOpen) {
      try {
        await this.redisClient.flushAll();
      } catch (error) {
        console.error('Redis flush error:', error);
      }
    }
  }
  
  // Close Redis connection
  async close() {
    if (this.redisClient && this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }
}

export default new CacheService();