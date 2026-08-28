import type { CsvResult } from './types';

export function parseCsv(input: string): CsvResult {
  const text = input.replace(/^\uFEFF/, '');
  if (!text.trim()) throw new Error('The CSV is empty. Choose a file with a header row.');

  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      if (field.length) throw new Error(`Unexpected quote near row ${matrix.length + 1}.`);
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      matrix.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('A quoted field is not closed. Check the final rows of the CSV.');
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    matrix.push(row);
  }

  const nonBlank = matrix.filter((cells) => cells.some((cell) => cell.trim() !== ''));
  if (!nonBlank.length) throw new Error('The CSV is empty. Choose a file with a header row.');
  const headers = nonBlank[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error('Every column needs a header. Fill in blank header cells first.');
  if (new Set(headers).size !== headers.length) throw new Error('Column headers must be unique. Rename duplicate columns first.');

  const rows = nonBlank.slice(1).map((cells, rowIndex) => {
    if (cells.length > headers.length) throw new Error(`Row ${rowIndex + 2} has more fields than the header.`);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
  if (!rows.length) throw new Error('The CSV has headers but no data rows.');
  return { headers, rows };
}

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(headers: string[], rows: Record<string, string>[]): string {
  return `${headers.map(quote).join(',')}\r\n${rows.map((row) => headers.map((header) => quote(row[header] ?? '')).join(',')).join('\r\n')}\r\n`;
}
