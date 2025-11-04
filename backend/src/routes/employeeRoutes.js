import express from 'express';
import { search, details, orgChart } from '../controllers/employeeController.js';
import { validateSearchParams, validateOrgChartParams } from '../middleware/validators.js';

const router = express.Router();

router.get('/employees/search', validateSearchParams, search);
router.get('/employees/:email', details);
router.get('/org-chart', validateOrgChartParams, orgChart);

export default router;
