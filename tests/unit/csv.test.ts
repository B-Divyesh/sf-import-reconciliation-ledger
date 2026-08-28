import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from '../../src/csv';

describe('CSV parser', () => {
  it('parses quoted commas, escaped quotes, and line breaks', () => {
    const result = parseCsv('id,note\r\n1,"hello, world"\r\n2,"said ""yes"""\r\n3,"two\nlines"');
    expect(result.headers).toEqual(['id', 'note']);
    expect(result.rows).toEqual([
      { id: '1', note: 'hello, world' },
      { id: '2', note: 'said "yes"' },
      { id: '3', note: 'two\nlines' }
    ]);
  });

  it('rejects blank and duplicate headers', () => {
    expect(() => parseCsv('id,,name\n1,2,a')).toThrow(/Every column/);
    expect(() => parseCsv('id,id\n1,2')).toThrow(/unique/);
  });

  it('round trips special fields', () => {
    const csv = toCsv(['id', 'note'], [{ id: '1', note: 'comma, quote " and\nline' }]);
    expect(parseCsv(csv).rows[0].note).toBe('comma, quote " and\nline');
  });
});
