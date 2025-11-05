/**
 * Cache middleware for API endpoints
 * Caches responses based on URL and query parameters
 */

import cacheService from '../services/cacheService.js';

/**
 * Cache middleware function
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
export function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key from URL and query parameters
    const cacheKey = `middleware:${req.originalUrl}`;
    
    // Try to get cached response
    const cachedResponse = await cacheService.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (body) {
      // Restore original json method
      res.json = originalJson;
      
      // Cache the response
      cacheService.set(cacheKey, body, ttlSeconds);
      
      // Send the response
      return res.json(body);
    };
    
    next();
  };
}