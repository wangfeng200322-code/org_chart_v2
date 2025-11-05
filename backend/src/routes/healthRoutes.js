import express from 'express';
import { healthCheck } from '../services/databaseService.js';
import cacheService from '../services/cacheService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const databaseOk = await healthCheck();
  const cacheOk = !process.env.REDIS_URL || (cacheService.redisClient && cacheService.redisClient.isOpen);
  
  const status = databaseOk && cacheOk ? 'healthy' : 'unhealthy';
  
  res.json({ 
    status,
    database: databaseOk ? 'connected' : 'disconnected',
    cache: process.env.REDIS_URL ? (cacheOk ? 'connected' : 'disconnected') : 'not_configured'
  });
});

export default router;