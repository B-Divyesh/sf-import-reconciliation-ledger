export type TransformKind = 'none' | 'trim' | 'uppercase' | 'lowercase' | 'titlecase' | 'replace' | 'number' | 'date';
export type Decision = 'create' | 'match' | 'skip';

export interface MappingRule {
  source: string;
  target: string;
  transform: TransformKind;
  argument: string;
}

export interface LedgerRow {
  index: number;
  source: Record<string, string>;
  transformed: Record<string, string>;
  sourceFingerprint: string;
  outputFingerprint: string;
  decision: Decision;
  reason: string;
  changedFields: string[];
  duplicate: boolean;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sourceName: string;
  sourceHeaders: string[];
  sourceRows: Record<string, string>[];
  referenceName: string;
  referenceRows: Record<string, string>[];
  mappings: MappingRule[];
  keyField: string;
  amountField: string;
  ledger: LedgerRow[];
  stage: number;
  reportNote: string;
}

export interface CsvResult {
  headers: string[];
  rows: Record<string, string>[];
}
