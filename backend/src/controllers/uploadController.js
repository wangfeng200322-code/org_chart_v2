import { parseAndValidateCSV, importEmployeesFromCSV } from '../services/csvService.js';
import { generateUploadReports, generateSummaryReport } from '../services/reportService.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

export async function uploadCSV(req, res, next) {
  // Generate a unique ID for this upload session
  const uploadId = crypto.randomBytes(8).toString('hex');
  logger.info(`Starting CSV upload process with ID: ${uploadId}`);
  
  try {
    const file = req.file;
    if (!file) {
      logger.warn('No file uploaded in request');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.debug('Parsing and validating CSV file');
    const parsed = await parseAndValidateCSV(file.buffer.toString('utf8'));
    logger.info(`CSV parsing completed. Total rows: ${parsed.total}, Valid: ${parsed.valid.length}, Invalid: ${parsed.errors.length}`);

    logger.debug('Importing employees from validated CSV data');
    const result = await importEmployeesFromCSV(parsed);
    
    const summary = {
      total: parsed.total,
      valid: parsed.valid.length,
      invalid: parsed.errors.length,
      imported: result.imported,
      message: result.imported > 0 && parsed.errors.length === 0 
        ? 'Import completed successfully' 
        : 'Import completed with validation errors',
      errors: parsed.errors
    };
    
    logger.info(`Employee import completed. Imported: ${result.imported} records`);
    
    // Generate reports for successful and failed entries
    try {
      logger.debug('Generating upload reports');
      await generateUploadReports(parsed.valid, parsed.errors, uploadId);
      await generateSummaryReport(summary, uploadId);
      logger.info('Upload reports generated successfully');
    } catch (reportError) {
      logger.error('Failed to generate upload reports:', reportError);
      // Don't fail the entire upload if report generation fails
    }

    const success = result.imported > 0 && parsed.errors.length === 0;
    
    logger.info(`Upload process completed with status: ${success ? 'success' : 'partial success with errors'}`);
    res.json({
      success,
      message: success ? 'Import completed successfully' : 'Import completed with validation errors',
      summary,
      imported: result.imported,
      errors: parsed.errors
    });
  } catch (err) {
    logger.error(`Error during CSV upload process for ID ${uploadId}:`, err);
    next(err);
  }
}