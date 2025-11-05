import { getApiKeyFromParameterStore } from '../services/parameterStoreService.js';
import logger from '../utils/logger.js';

export async function apiKeyAuth(req, res, next) {
  logger.debug('API key authentication middleware called');
  
  const headerName = process.env.API_KEY_HEADER_NAME || 'X-API-Key';
  logger.debug('Checking for API key in header:', headerName);
  
  const key = req.headers[headerName.toLowerCase()];
  logger.debug('API key from header:', key ? '[PROVIDED]' : '[NOT PROVIDED]');

  if (!key) {
    logger.warn('Missing API key in request');
    return res.status(401).json({ success: false, error: 'Missing API key' });
  }
  
  // Dev/Test bypass using static key when not in production
  const isProd = process.env.NODE_ENV === 'production';
  const testKey = process.env.TEST_API_KEY;
  
  logger.debug('Environment info:', {
    isProd,
    hasTestKey: !!testKey,
    testKey: testKey ? '[SET]' : '[NOT SET]'
  });

  if (!isProd && testKey && key === testKey) {
    logger.info('Using test API key for authentication');
    req.user = { role: 'admin', source: 'test' };
    return next();
  }

    try {
    logger.debug('Looking up API key in parameter store');
    const record = await getApiKeyFromParameterStore(key);
    logger.debug('API key lookup result:', record ? '[FOUND]' : '[NOT FOUND]');
    
    if (!record) {
      logger.warn('Invalid API key provided');
      return res.status(403).json({ success: false, error: 'Invalid API key' });
    }
    
    logger.info('API key authenticated successfully');
    req.user = record;
    next();
  } catch (err) {
    logger.error('Error during API key authentication:', err);
    next(err);
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    logger.debug('Role requirement check:', { requiredRole: role, userRole: req.user?.role });
    
    if (!req.user || req.user.role !== role) {
      logger.warn('Access forbidden due to insufficient permissions');
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    
    logger.debug('Role requirement satisfied');
    next();
  };
}