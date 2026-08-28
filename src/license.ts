const SLUG = 'import-reconciliation-ledger';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const API_BASE = 'https://api.sociobot.in/api/v1';

export interface LicenseState { token: string; valid: boolean; checkedAt: number; reason?: string }

export function acceptReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(KEY, token);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storedLicense(): LicenseState {
  const token = localStorage.getItem(KEY) ?? '';
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? '{}') as Partial<LicenseState>;
    return { token, valid: Boolean(token && cached.valid), checkedAt: cached.checkedAt ?? 0, reason: cached.reason };
  } catch {
    return { token, valid: false, checkedAt: 0 };
  }
}

export function restoreLicense(token: string): void {
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const cached = storedLicense();
  if (!cached.token) return cached;
  if (!force && Date.now() - cached.checkedAt < 86_400_000) return cached;
  try {
    const response = await fetch(`${API_BASE}/products/${SLUG}/verify?license=${encodeURIComponent(cached.token)}`);
    const verdict = await response.json() as { valid: boolean; reason?: string };
    const state = { token: cached.token, valid: verdict.valid, checkedAt: Date.now(), reason: verdict.reason };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(state));
    return state;
  } catch {
    return cached;
  }
}

export const checkoutUrl = `${API_BASE}/products/${SLUG}/checkout`;
