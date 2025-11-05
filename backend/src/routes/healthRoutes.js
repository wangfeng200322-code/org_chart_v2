import express from 'express';
import { healthCheck } from '../services/databaseService.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  logger.debug('Health check endpoint called');
  
  try {
    const databaseOk = await healthCheck();
    logger.debug('Database health check result:', databaseOk);
    
    const cacheOk = !process.env.REDIS_URL || (cacheService.redisClient && cacheService.redisClient.isOpen);
    logger.debug('Cache health check result:', cacheOk);
    
    const status = databaseOk && cacheOk ? 'healthy' : 'unhealthy';
    logger.info('Overall health status:', status);
    
    res.json({ 
      status,
      database: databaseOk ? 'connected' : 'disconnected',
      cache: process.env.REDIS_URL ? (cacheOk ? 'connected' : 'disconnected') : 'not_configured'
    });
  } catch (error) {
    logger.error('Error during health check:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Internal server error during health check'
    });
  }
});

export default router;