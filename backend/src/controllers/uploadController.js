import { parseAndValidateCSV, importEmployeesFromCSV } from '../services/csvService.js';

export async function uploadCSV(req, res, next) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const rows = await parseAndValidateCSV(file.buffer.toString('utf8'));
    const result = await importEmployeesFromCSV(rows);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
