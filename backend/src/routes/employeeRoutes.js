import express from 'express';
import { search, details, orgChart } from '../controllers/employeeController.js';
import { validateSearchParams, validateOrgChartParams } from '../middleware/validators.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Apply caching middleware to search and org-chart endpoints
router.get('/employees/search', cacheMiddleware(120), validateSearchParams, search);
router.get('/employees/:email', details);
router.get('/org-chart', cacheMiddleware(120), validateOrgChartParams, orgChart);

export default router;