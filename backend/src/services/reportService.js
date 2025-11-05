import fs from 'fs';
import path from 'path';
import { stringify } from 'csv-stringify/sync';
import logger from '../utils/logger.js';

/**
 * Generates CSV reports for successful and failed employee imports
 * @param {Array} validRows - Array of valid employee rows that were successfully processed
 * @param {Array} errorRows - Array of error objects containing row information and errors
 * @param {string} uploadId - Unique identifier for this upload session
 * @returns {Promise<Object>} Object containing paths to the generated report files
 */
export async function generateUploadReports(validRows, errorRows, uploadId) {
  logger.info(`Generating upload reports for upload ID: ${uploadId}`);
  
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      logger.debug('Created reports directory');
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const successReportPath = path.join(reportsDir, `success-${uploadId}-${timestamp}.csv`);
    const failureReportPath = path.join(reportsDir, `failure-${uploadId}-${timestamp}.csv`);
    
    // Generate success report with only key identifiers
    if (validRows && validRows.length > 0) {
      logger.debug(`Generating success report with ${validRows.length} entries`);
      
      // Extract only key identifiers: first_name, last_name, email
      const successData = validRows.map(row => ({
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email
      }));
      
      const successCSV = stringify(successData, { header: true });
      fs.writeFileSync(successReportPath, successCSV);
      logger.info(`Success report generated at: ${successReportPath}`);
    } else {
      logger.debug('No valid rows to include in success report');
    }
    
    // Generate failure report with identifiers and errors
    if (errorRows && errorRows.length > 0) {
      logger.debug(`Generating failure report with ${errorRows.length} entries`);
      
      // Transform error rows to include identifiers and errors only
      const failureData = errorRows.map(errorRow => {
        // Create a base object with error information
        const baseRow = {
          row: errorRow.row,
          errors: errorRow.errors ? errorRow.errors.join('; ') : 'Unknown error'
        };
        
        // If the error row contains the original data, include identifiers
        if (errorRow.data) {
          return {
            first_name: errorRow.data.first_name || '',
            last_name: errorRow.data.last_name || '',
            email: errorRow.data.email || '',
            ...baseRow
          };
        }
        
        return baseRow;
      });
      
      const failureCSV = stringify(failureData, { header: true });
      fs.writeFileSync(failureReportPath, failureCSV);
      logger.info(`Failure report generated at: ${failureReportPath}`);
    } else {
      logger.debug('No error rows to include in failure report');
    }
    
    return {
      successReportPath: validRows && validRows.length > 0 ? successReportPath : null,
      failureReportPath: errorRows && errorRows.length > 0 ? failureReportPath : null
    };
  } catch (error) {
    logger.error('Error generating upload reports:', error);
    throw new Error(`Failed to generate upload reports: ${error.message}`);
  }
}

/**
 * Generates a summary report for the upload
 * @param {Object} summary - Upload summary data
 * @param {string} uploadId - Unique identifier for this upload session
 * @returns {Promise<string>} Path to the generated summary report file
 */
export async function generateSummaryReport(summary, uploadId) {
  logger.info(`Generating summary report for upload ID: ${uploadId}`);
  
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const summaryReportPath = path.join(reportsDir, `summary-${uploadId}-${timestamp}.txt`);
    
    const summaryContent = `
Upload Summary Report
=====================

Upload ID: ${uploadId}
Timestamp: ${new Date().toISOString()}

Total Rows Processed: ${summary.total || 0}
Successfully Imported: ${summary.valid || 0}
Failed Entries: ${summary.invalid || 0}

${summary.imported !== undefined ? `Database Records Imported: ${summary.imported}` : ''}
${summary.message ? `Status: ${summary.message}` : ''}

${summary.errors && summary.errors.length > 0 ? 
`Errors:
${summary.errors.map((err, index) => `${index + 1}. Row ${err.row}: ${err.errors.join(', ')}`).join('\n')}` : 
'No errors reported'}
    `.trim();
    
    fs.writeFileSync(summaryReportPath, summaryContent);
    logger.info(`Summary report generated at: ${summaryReportPath}`);
    
    return summaryReportPath;
  } catch (error) {
    logger.error('Error generating summary report:', error);
    throw new Error(`Failed to generate summary report: ${error.message}`);
  }
}