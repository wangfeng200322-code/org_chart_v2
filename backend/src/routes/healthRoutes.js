import express from 'express';
import { healthCheck } from '../services/databaseService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const ok = await healthCheck();
  res.json({ status: ok ? 'healthy' : 'unhealthy', database: ok ? 'connected' : 'disconnected' });
});

export default router;
