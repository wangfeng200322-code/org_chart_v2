import parse from 'csv-parse/lib/sync';

export function parseAndValidateCSV(csv) {
  const rows = parse(csv, { columns: true, skip_empty_lines: true });
  const valid = [];
  const errors = [];

  rows.forEach((r, idx) => {
    const errs = validateEmployeeRow(r);
    if (errs.length > 0) {
      errors.push({ row: idx + 1, errors: errs });
    } else {
      valid.push(r);
    }
  });

  return { total: rows.length, valid, errors };
}

export async function importEmployeesFromCSV(parsed) {
  // For demo, just return counts
  return { total: parsed.total, imported: parsed.valid.length, errors: parsed.errors };
}

export function validateEmployeeRow(row) {
  const errs = [];
  if (!row.first_name) errs.push('first_name required');
  if (!row.last_name) errs.push('last_name required');
  if (!row.email || !row.email.includes('@')) errs.push('valid email required');
  return errs;
}
