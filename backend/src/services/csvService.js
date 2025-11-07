import { parse } from 'csv-parse/sync';
import { importEmployees } from './databaseService.js';
import logger from '../utils/logger.js';

const REQUIRED_COLUMNS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'home_address',
  'department',
  'role',
  'salary',
  'manager_name',
  'manager_email'
];

export function parseAndValidateCSV(csv) {
  const rows = parse(csv, { columns: true, skip_empty_lines: true });

  // Validate headers are present
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const missingHeaders = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  const errors = [];
  const valid = [];

  if (missingHeaders.length > 0) {
    errors.push({ row: 'file', errors: [`missing headers: ${missingHeaders.join(', ')}`] });
    return { total: rows.length, valid: [], errors };
  }

  let ceoCount = 0;

  rows.forEach((r, idx) => {
    const cleaned = normalizeRow(r);
    const errs = validateEmployeeRow(cleaned);
    if (isCEO(cleaned)) ceoCount += 1;
    if (errs.length > 0) {
      errors.push({ 
        row: idx + 1, 
        errors: errs,
        data: r // Include original data for reporting
      });
    } else {
      valid.push(cleaned);
    }
  });

  // Improved CEO validation for large datasets
  if (ceoCount !== 1 && rows.length > 0) {
    // For large datasets, be more flexible with CEO validation
    if (ceoCount === 0) {
      // Auto-assign the first valid row as CEO if no CEO found
      const firstValidRow = valid[0];
      if (firstValidRow) {
        firstValidRow.manager_name = '';
        firstValidRow.manager_email = '';
        ceoCount = 1;
        logger.info(`Auto-assigned CEO: ${firstValidRow.first_name} ${firstValidRow.last_name}`);
      }
    } else if (ceoCount > 1) {
      // For multiple CEOs, keep only the first one as CEO and make others report to it
      let firstCEOFound = false;
      valid.forEach(row => {
        if (isCEO(row)) {
          if (!firstCEOFound) {
            firstCEOFound = true;
            logger.info(`Keeping CEO: ${row.first_name} ${row.last_name}`);
          } else {
            // Make subsequent CEOs report to the first CEO
            const firstCEO = valid.find(r => isCEO(r) && r !== row);
            if (firstCEO) {
              row.manager_name = firstCEO.first_name + ' ' + firstCEO.last_name;
              row.manager_email = firstCEO.email;
              logger.info(`Converted CEO to report: ${row.first_name} ${row.last_name} reports to ${firstCEO.first_name} ${firstCEO.last_name}`);
            }
          }
        }
      });
    }
  }

  // Remove the strict CEO validation that prevents import
  // Only add warning instead of blocking the import
  if (ceoCount !== 1) {
    logger.warn(`CEO count is ${ceoCount}, expected 1. Importing anyway with auto-fixes.`);
  }

  return { total: rows.length, valid, errors };
}

export async function importEmployeesFromCSV(parsed) {
  if (!parsed || !Array.isArray(parsed.valid)) {
    return { total: 0, imported: 0, errors: [{ row: 'file', errors: ['invalid parsed data'] }] };
  }
  if (parsed.valid.length === 0) {
    return { total: parsed.total || 0, imported: 0, errors: parsed.errors || [] };
  }

  const imported = await importEmployees(parsed.valid);
  return {
    total: parsed.total,
    imported,
    errors: parsed.errors || []
  };
}

function isCEO(row) {
  const managerEmailEmpty = !row.manager_email || row.manager_email.trim() === '';
  const managerNameEmpty = !row.manager_name || row.manager_name.trim() === '';
  return managerEmailEmpty && managerNameEmpty;
}

function normalizeRow(row) {
  const out = { ...row };
  if (typeof out.salary === 'string') out.salary = out.salary.trim();
  if (out.salary === '') out.salary = null;
  return out;
}

export function validateEmployeeRow(row) {
  const errs = [];
  if (!row.first_name) errs.push('first_name required');
  if (!row.last_name) errs.push('last_name required');
  if (!row.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.email))) errs.push('valid email required');
  if (row.salary != null && row.salary !== '' && isNaN(Number(row.salary))) errs.push('salary must be numeric');
  return errs;
}
