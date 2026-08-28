import type { LedgerRow, MappingRule, Project } from './types';

export function transformValue(value: string, rule: MappingRule): string {
  switch (rule.transform) {
    case 'trim': return value.trim();
    case 'uppercase': return value.toLocaleUpperCase('en-US');
    case 'lowercase': return value.toLocaleLowerCase('en-US');
    case 'titlecase': return value.toLocaleLowerCase('en-US').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('en-US'));
    case 'replace': {
      const [find = '', replacement = ''] = rule.argument.split('→');
      return find ? value.split(find).join(replacement) : value;
    }
    case 'number': {
      const cleaned = value.replace(/[^0-9+.\-]/g, '');
      const number = Number(cleaned);
      return cleaned && Number.isFinite(number) ? String(number) : '';
    }
    case 'date': {
      const trimmed = value.trim();
      const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
      const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
      const parts = iso ? [Number(iso[1]), Number(iso[2]), Number(iso[3])] : us ? [Number(us[3]), Number(us[1]), Number(us[2])] : [];
      if (!parts.length) return '';
      const [year, month, day] = parts;
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
    }
    default: return value;
  }
}

export function canonicalRow(row: Record<string, string>): string {
  return Object.keys(row).sort().map((key) => `${key.length}:${key}=${row[key].length}:${row[key]}`).join('|');
}

export async function fingerprint(row: Record<string, string>): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalRow(row));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export async function buildLedger(project: Project): Promise<LedgerRow[]> {
  const mappedRules = project.mappings.filter((rule) => rule.target.trim());
  const referenceKeys = new Set(project.referenceRows.map((row) => row[project.keyField] ?? ''));
  const outputRows = project.sourceRows.map((source) => Object.fromEntries(mappedRules.map((rule) => [rule.target.trim(), transformValue(source[rule.source] ?? '', rule)])));
  const keyCounts = new Map<string, number>();
  for (const row of outputRows) {
    const key = row[project.keyField]?.trim();
    if (key) keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }

  return Promise.all(outputRows.map(async (transformed, index) => {
    const source = project.sourceRows[index];
    const key = transformed[project.keyField]?.trim() ?? '';
    const duplicate = Boolean(key && (keyCounts.get(key) ?? 0) > 1);
    let decision: LedgerRow['decision'] = 'create';
    let reason = 'Key not found in comparison file';
    if (!key) {
      decision = 'skip';
      reason = project.keyField ? `Blank ${project.keyField}` : 'No match key selected';
    } else if (duplicate) {
      decision = 'skip';
      reason = `Duplicate source key: ${key}`;
    } else if (referenceKeys.has(key)) {
      decision = 'match';
      reason = `Key found in comparison file: ${key}`;
    } else if (!project.referenceRows.length) {
      reason = 'No comparison file; proposed create';
    }

    const changedFields = mappedRules.filter((rule) => (source[rule.source] ?? '') !== (transformed[rule.target.trim()] ?? '')).map((rule) => rule.target.trim());
    return {
      index,
      source,
      transformed,
      sourceFingerprint: await fingerprint(source),
      outputFingerprint: await fingerprint(transformed),
      decision,
      reason,
      changedFields,
      duplicate
    };
  }));
}

export function totals(ledger: LedgerRow[], amountField: string) {
  const value = (row: LedgerRow) => Number(row.transformed[amountField]?.replace(/[^0-9+.\-]/g, '')) || 0;
  return {
    all: ledger.reduce((sum, row) => sum + value(row), 0),
    create: ledger.filter((row) => row.decision === 'create').reduce((sum, row) => sum + value(row), 0),
    match: ledger.filter((row) => row.decision === 'match').reduce((sum, row) => sum + value(row), 0),
    skip: ledger.filter((row) => row.decision === 'skip').reduce((sum, row) => sum + value(row), 0)
  };
}
