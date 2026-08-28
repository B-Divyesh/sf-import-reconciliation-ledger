import { describe, expect, it } from 'vitest';
import { buildLedger, canonicalRow, transformValue } from '../../src/reconcile';
import type { Project } from '../../src/types';

const baseProject: Project = {
  id: 'test', name: 'Test', createdAt: '', updatedAt: '', sourceName: 'source.csv',
  sourceHeaders: ['id', 'name', 'amount'],
  sourceRows: [
    { id: 'A-1', name: ' north ', amount: '$1,200.00' },
    { id: 'A-1', name: 'duplicate', amount: '20' },
    { id: 'A-3', name: 'third', amount: '30' },
    { id: '', name: 'blank', amount: '10' }
  ],
  referenceName: 'existing.csv', referenceRows: [{ ID: 'A-3' }],
  mappings: [
    { source: 'id', target: 'ID', transform: 'trim', argument: '' },
    { source: 'name', target: 'Name', transform: 'titlecase', argument: '' },
    { source: 'amount', target: 'Amount', transform: 'number', argument: '' }
  ],
  keyField: 'ID', amountField: 'Amount', ledger: [], stage: 2, reportNote: ''
};

describe('reconciliation', () => {
  it('applies deterministic transforms', () => {
    expect(transformValue(' north wind ', { source: 'x', target: 'x', transform: 'titlecase', argument: '' })).toBe(' North Wind ');
    expect(transformValue('$1,200.00', { source: 'x', target: 'x', transform: 'number', argument: '' })).toBe('1200');
    expect(transformValue('a-b-a', { source: 'x', target: 'x', transform: 'replace', argument: 'a→z' })).toBe('z-b-z');
    expect(transformValue('8/14/2026', { source: 'x', target: 'x', transform: 'date', argument: '' })).toBe('2026-08-14');
    expect(transformValue('14/8/2026', { source: 'x', target: 'x', transform: 'date', argument: '' })).toBe('');
  });

  it('canonicalizes independent of property insertion order', () => {
    expect(canonicalRow({ b: '2', a: '1' })).toBe(canonicalRow({ a: '1', b: '2' }));
  });

  it('holds duplicate and blank keys while matching reference keys', async () => {
    const ledger = await buildLedger(baseProject);
    expect(ledger.map((row) => row.decision)).toEqual(['skip', 'skip', 'match', 'skip']);
    expect(ledger[0].duplicate).toBe(true);
    expect(ledger[2].reason).toMatch(/comparison/);
    expect(ledger.every((row) => row.sourceFingerprint.length === 16)).toBe(true);
  });
});
