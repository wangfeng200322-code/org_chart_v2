import { parseAndValidateCSV, importEmployeesFromCSV } from '../services/csvService.js';

export async function uploadCSV(req, res, next) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const parsed = await parseAndValidateCSV(file.buffer.toString('utf8'));
    const result = await importEmployeesFromCSV(parsed);
    const summary = {
      total: parsed.total,
      valid: parsed.valid.length,
      invalid: parsed.errors.length
    };
    const success = result.imported > 0 && parsed.errors.length === 0;
    res.json({
      success,
      message: success ? 'Import completed successfully' : 'Import completed with validation errors',
      summary,
      imported: result.imported,
      errors: parsed.errors
    });
  } catch (err) {
    next(err);
  }
}
