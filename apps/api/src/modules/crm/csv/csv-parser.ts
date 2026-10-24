/**
 * Lightweight, zero-dependency RFC 4180 compliant CSV parser and generator
 * supporting quoted fields, commas inside quotes, CRLF/LF line endings,
 * and Unicode / Persian text.
 */

export function parseCsvRows(csv: string): string[][] {
  if (!csv || !csv.trim()) {
    return [];
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  let i = 0;
  // Strip UTF-8 Byte Order Mark (BOM) if present
  if (csv.charCodeAt(0) === 0xfeff) {
    i = 1;
  }

  const len = csv.length;

  while (i < len) {
    const char = csv[i];
    const nextChar = i + 1 < len ? csv[i + 1] : '';

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          // Skip whitespace between closing quote and next delimiter
          while (i < len && (csv[i] === ' ' || csv[i] === '\t')) {
            i++;
          }
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field and row
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out any trailing empty row
  return rows.filter((r, idx) => {
    if (idx === rows.length - 1 && r.length === 1 && r[0]?.trim() === '') {
      return false;
    }
    return true;
  });
}

/**
 * Parses CSV content into an array of objects keyed by header names.
 * Trims header names and removes quotes.
 */
export function parseCsv(csv: string): Record<string, string>[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) {
    return [];
  }

  const headerRow = rows[0];
  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) {
      continue;
    }
    // Skip completely empty lines
    if (row.length === 1 && row[0]?.trim() === '') {
      continue;
    }
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (header) {
        record[header] = row[c] ?? '';
      }
    }
    records.push(record);
  }

  return records;
}

/**
 * Escapes a single CSV field according to RFC 4180.
 * Values with commas, quotes, or newlines are wrapped in double quotes,
 * and internal double quotes are escaped as `""`.
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 CSV string from headers and 2D row array.
 */
export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
): string {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generates a CSV string from an array of objects.
 */
export function generateCsvFromObjects<T extends Record<string, any>>(
  records: T[],
  columns?: string[],
): string {
  if (records.length === 0) {
    if (columns && columns.length > 0) {
      return columns.map(escapeCsvField).join(',');
    }
    return '';
  }

  const first = records[0];
  const headers = columns ?? (first ? Object.keys(first) : []);
  const rows = records.map((rec) => headers.map((h) => rec[h]));
  return generateCsv(headers, rows);
}
