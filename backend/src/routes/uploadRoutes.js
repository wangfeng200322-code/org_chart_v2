import express from 'express';
import multer from 'multer';
import { uploadCSV } from '../controllers/uploadController.js';

const router = express.Router();
const upload = multer();

router.post('/upload/csv', upload.single('file'), uploadCSV);

export default router;
