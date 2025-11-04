import express from 'express';
import { search, details, orgChart } from '../controllers/employeeController.js';

const router = express.Router();

router.get('/employees/search', search);
router.get('/employees/:email', details);
router.get('/org-chart', orgChart);

export default router;
