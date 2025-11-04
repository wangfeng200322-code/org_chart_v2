import { getApiKeyFromParameterStore } from '../services/parameterStoreService.js';

export async function apiKeyAuth(req, res, next) {
  const headerName = process.env.API_KEY_HEADER_NAME || 'X-API-Key';
  const key = req.headers[headerName.toLowerCase()];

  // Dev/Test bypass using static key when not in production
  const isProd = process.env.NODE_ENV === 'production';
  const testKey = process.env.TEST_API_KEY;
  if (!isProd && testKey && key === testKey) {
    req.user = { role: 'admin', source: 'test' };
    return next();
  }

  if (!key) return res.status(401).json({ success: false, error: 'Missing API key' });

  try {
    const record = await getApiKeyFromParameterStore(key);
    if (!record) return res.status(403).json({ success: false, error: 'Invalid API key' });
    req.user = record;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ success: false, error: 'Forbidden' });
    next();
  };
}
