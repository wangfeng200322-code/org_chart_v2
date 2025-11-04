export function validateSearchParams(req, res, next) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ success: false, error: 'q is required' });
  if (q.length > 100) return res.status(400).json({ success: false, error: 'q too long' });
  const limit = parseInt(req.query.limit, 10);
  const offset = parseInt(req.query.offset, 10);
  if (!Number.isNaN(limit) && (limit < 1 || limit > 100)) return res.status(400).json({ success: false, error: 'limit must be 1..100' });
  if (!Number.isNaN(offset) && offset < 0) return res.status(400).json({ success: false, error: 'offset must be >= 0' });
  next();
}

export function validateOrgChartParams(req, res, next) {
  const email = String(req.query.email || '').trim();
  if (!email) return res.status(400).json({ success: false, error: 'email is required' });
  const depth = parseInt(req.query.depth, 10);
  if (!Number.isNaN(depth) && (depth < 1 || depth > 3)) return res.status(400).json({ success: false, error: 'depth must be 1..3' });
  next();
}

export function validateCSVUpload(req, res, next) {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  const name = file.originalname || '';
  const type = file.mimetype || '';
  if (!(name.toLowerCase().endsWith('.csv') || type === 'text/csv' || type === 'application/vnd.ms-excel')) {
    return res.status(400).json({ success: false, error: 'Invalid file type, expected CSV' });
  }
  next();
}


