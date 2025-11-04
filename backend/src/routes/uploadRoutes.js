import express from 'express';
import multer from 'multer';
import { uploadCSV } from '../controllers/uploadController.js';
import { validateCSVUpload } from '../middleware/validators.js';

const router = express.Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload/csv', upload.single('file'), validateCSVUpload, uploadCSV);

export default router;
