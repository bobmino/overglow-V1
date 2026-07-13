/**
 * [TASK-9] Sanitisation CSV / cellules (anti formula-injection + HTML).
 */

const FORBIDDEN_EXTRA_COLUMNS_MSG = 'Unexpected CSV columns rejected';

/**
 * Strip HTML tags, neutralize spreadsheet formulas (=, +, -, @).
 */
export const sanitizeCellValue = (value) => {
  if (value == null) return '';
  let str = String(value);

  // Neutralize formula injection (Excel/Sheets)
  if (/^[=+\-@]/.test(str.trim())) {
    str = `'${str.trim()}`;
  }

  // Strip HTML / script-ish content
  str = str
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .trim();

  return str;
};

/**
 * Validate and sanitize a parsed CSV row set.
 * @param {object[]} rows
 * @param {string[]} allowedColumns
 * @param {{ maxRows?: number }} options
 */
export const sanitizeCsvRows = (rows, allowedColumns, { maxRows = 1000 } = {}) => {
  if (!Array.isArray(rows)) {
    return { ok: false, errors: ['CSV payload must be an array of rows'], rows: [] };
  }
  if (rows.length > maxRows) {
    return { ok: false, errors: [`Too many rows (max ${maxRows})`], rows: [] };
  }

  const allow = new Set(allowedColumns);
  const errors = [];
  const sanitized = [];

  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object') {
      errors.push(`Row ${index + 1}: invalid object`);
      return;
    }

    const keys = Object.keys(row);
    const extras = keys.filter((k) => !allow.has(k));
    if (extras.length) {
      errors.push(`Row ${index + 1}: ${FORBIDDEN_EXTRA_COLUMNS_MSG}: ${extras.join(', ')}`);
      return;
    }

    const clean = {};
    for (const col of allowedColumns) {
      if (Object.prototype.hasOwnProperty.call(row, col)) {
        clean[col] = sanitizeCellValue(row[col]);
      }
    }
    sanitized.push(clean);
  });

  if (errors.length) {
    return { ok: false, errors, rows: [] };
  }

  return { ok: true, errors: [], rows: sanitized };
};

/**
 * Multer-compatible filter for CSV/XLSX only (5MB enforced by multer limits).
 */
export const CSV_ALLOWED_MIME = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const CSV_ALLOWED_EXT = ['.csv', '.xlsx'];

export const isAllowedCsvUpload = (file) => {
  const name = (file?.originalname || '').toLowerCase();
  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  const mime = (file?.mimetype || '').toLowerCase();
  return CSV_ALLOWED_EXT.includes(ext) && (
    CSV_ALLOWED_MIME.includes(mime)
    || mime === 'application/octet-stream' // some browsers
  );
};

export default {
  sanitizeCellValue,
  sanitizeCsvRows,
  isAllowedCsvUpload,
  CSV_ALLOWED_MIME,
  CSV_ALLOWED_EXT,
};
