import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import employeeRoutes from './routes/employeeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimitConfig } from './config/appConfig.js';
import logger from './utils/logger.js';

const app = express();

logger.info('Setting up Express middleware');

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

// Global API rate limiter
logger.debug('Setting up rate limiter');
const apiLimiter = rateLimit({ 
  windowMs: rateLimitConfig.windowMs, 
  max: rateLimitConfig.max, 
  standardHeaders: true, 
  legacyHeaders: false 
});
app.use('/api', apiLimiter);

logger.debug('Setting up API routes with authentication middleware');
app.use('/api', apiKeyAuth, employeeRoutes);
app.use('/api', apiKeyAuth, uploadRoutes);
app.use('/health', healthRoutes);

logger.debug('Setting up error handler middleware');
// Error handler should be the last middleware
app.use(errorHandler);

logger.info('Express app configured successfully');

export default app;