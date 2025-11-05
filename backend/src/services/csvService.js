import { parse } from 'csv-parse/sync';
import { importEmployees } from './databaseService.js';

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

  if (ceoCount !== 1) {
    errors.push({ 
      row: 'file', 
      errors: [`exactly one CEO required (rows with empty manager_name and manager_email): found ${ceoCount}`] 
    });
  }

  // If CEO constraint violated, do not import any
  const finalValid = ceoCount === 1 ? valid : [];
  return { total: rows.length, valid: finalValid, errors };
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