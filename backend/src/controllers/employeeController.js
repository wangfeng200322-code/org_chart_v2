import { findEmployeesByName, getEmployeeByEmail, getOrgChart } from '../services/databaseService.js';
import logger from '../utils/logger.js';

export async function search(req, res, next) {
  try {
    const q = req.query.q || '';
    const limit = parseInt(req.query.limit, 10) || 25;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    logger.info('Employee search request received', { query: q, limit, offset });
    
    const results = await findEmployeesByName(q, { limit, offset });
    
    logger.debug('Employee search completed', { query: q, resultCount: results.length });
    
    res.json({ success: true, data: results });
  } catch (err) {
    logger.error('Employee search failed', { error: err.message, stack: err.stack });
    next(err);
  }
}

export async function details(req, res, next) {
  try {
    const email = req.params.email;
    const employee = await getEmployeeByEmail(email);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

export async function orgChart(req, res, next) {
  try {
    const email = req.query.email;
    const depth = parseInt(req.query.depth, 10) || 2;
    const chart = await getOrgChart(email, depth);
    res.json({ success: true, data: chart });
  } catch (err) {
    next(err);
  }
}