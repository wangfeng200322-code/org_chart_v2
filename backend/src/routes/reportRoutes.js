import express from 'express';
import fs from 'fs';
import path from 'path';
import { requireRole } from '../middleware/apiKeyAuth.js';

const router = express.Router();

// Serve reports directory as static files (admin only)
router.use('/', requireRole('admin'), express.static(path.join(process.cwd(), 'reports')));

// List available reports
router.get('/', requireRole('admin'), (req, res) => {
  const reportsDir = path.join(process.cwd(), 'reports');
  
  fs.readdir(reportsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list reports' });
    }
    
    const reports = files.map(file => {
      const filePath = path.join(reportsDir, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        size: stat.size,
        modified: stat.mtime
      };
    });
    
    res.json({ reports });
  });
});

export default router;