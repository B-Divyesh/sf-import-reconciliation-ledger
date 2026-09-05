import { expect, test, type Download, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';

const realCsv = 'Account ID,Customer,Amount\nREAL-100,Real workspace,42.00\n';

async function openDemo(page: Page): Promise<void> {
  await page.goto('/?demo=1');
  await expect(page.getByLabel('Demo workspace')).toBeVisible();
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
}

async function reconcileSample(page: Page): Promise<void> {
  await openDemo(page);
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Transform for Customer').selectOption('trim');
  await page.getByLabel('Stable match key').selectOption('Account ID');
  await page.getByLabel('Amount field (optional)').selectOption('Amount');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await expect(page.getByText(/rows share a source key/)).toBeVisible();
  await expect(page.locator('[data-decision-index]')).toHaveCount(5);
}

async function readDownload(download: Download): Promise<string> {
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path!, 'utf8');
}

test('@claim:demo-sandbox keeps sample work separate from a real workspace', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('#source-file', { name: 'real-import.csv', mimeType: 'text/csv', buffer: Buffer.from(realCsv) });
  await expect(page.getByText('1 rows · 3 columns loaded')).toBeVisible();

  await page.goto('/?demo=1');
  await expect(page.getByLabel('Demo workspace')).toContainText('sample data');
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByLabel('Demo workspace')).toHaveCount(0);
  await expect(page.getByText('1 rows · 3 columns loaded')).toBeVisible();
  await expect(page.getByText('real-import.csv')).toBeVisible();
});

test('@claim:csv-input imports quoted commas and quoted line breaks from a CSV', async ({ page }) => {
  await openDemo(page);
  await page.setInputFiles('#source-file', {
    name: 'quoted.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Account ID,Customer,Note\nAC-200,"Northwind, Ltd","first line\nsecond line"\n')
  });
  await expect(page.getByText('1 rows · 3 columns loaded')).toBeVisible();
  await expect(page.locator('tbody')).toContainText('Northwind, Ltd');
  await expect(page.locator('tbody')).toContainText('first line');
  await expect(page.locator('tbody')).toContainText('second line');
});

test('@claim:row-accounting records every sample row and flags seeded duplicate keys', async ({ page }) => {
  await reconcileSample(page);
  await page.setInputFiles('#reference-file', {
    name: 'existing-records.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Account ID\nAC-101\n')
  });
  await expect(page.getByText('1 comparison rows applied.')).toBeVisible();
  await expect(page.locator('.metric').filter({ hasText: 'Source rows' }).locator('strong')).toHaveText('5');
  await expect(page.locator('.metric').filter({ hasText: 'Create' }).locator('strong')).toHaveText('1');
  await expect(page.locator('.metric').filter({ hasText: 'Match' }).locator('strong')).toHaveText('1');
  await expect(page.locator('.metric').filter({ hasText: 'Skip' }).locator('strong')).toHaveText('3');
  await expect(page.getByText('Duplicate source key: AC-102')).toHaveCount(2);
  await expect(page.getByText('Blank Account ID')).toBeVisible();
});

test('@claim:csv-export exports only reviewed create and match rows without a Pro license', async ({ page }) => {
  await reconcileSample(page);
  await page.getByRole('button', { name: 'Review export' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export destination CSV' }).click();
  const csv = await readDownload(await downloadPromise);
  const rows = csv.trim().split(/\r?\n/);
  expect(rows[0]).toBe('Account ID,Customer,Amount,Start date');
  expect(rows).toHaveLength(3);
  expect(csv).toContain('AC-101,Northwind Ltd,1200.00,8/14/2026');
  expect(csv).toContain('AC-104,FIELD & STONE,"1,240.00",2026-08-17');
  expect(csv).not.toContain('Paper Street Duplicate');
});

test('@claim:review-report exports every row with decisions and fingerprints', async ({ page }) => {
  await reconcileSample(page);
  await page.getByRole('button', { name: 'Review export' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export immutable report' }).click();
  const report = await readDownload(await downloadPromise);
  expect(report).toContain('Row ledger');
  expect(report).toMatch(/S [a-f0-9]{16}<br>O [a-f0-9]{16}/);
  expect(report.match(/<tr class=/g)).toHaveLength(5);
  expect(report).toContain('Duplicate source key: AC-102');
});

test('@claim:offline-reload keeps the demo workspace after the first visit', async ({ browser }) => {
  const offlineContext = await browser.newContext();
  try {
    const page = await offlineContext.newPage();
    await openDemo(page);
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration.active && navigator.serviceWorker.controller && document.documentElement.dataset.offlineReady === 'true');
    });
    await offlineContext.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Offline · local work continues')).toBeVisible();
    await expect(page.getByLabel('Demo workspace')).toBeVisible();
    await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  } finally {
    await offlineContext.close();
  }
});

test('@claim:local-only sends no CSV data to another origin during demo use', async ({ page, baseURL }) => {
  const requestUrls: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('http')) requestUrls.push(request.url());
  });
  await reconcileSample(page);
  await page.getByRole('button', { name: 'Review export' }).click();
  await page.getByRole('button', { name: 'Export ledger CSV' }).click();
  const origin = new URL(baseURL!).origin;
  expect(requestUrls).not.toEqual([]);
  expect(requestUrls.every((url) => new URL(url).origin === origin)).toBe(true);
});

test('@claim:pro-price shows the one-time Pro price while leaving the core workspace available', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Optional Pro is $19 once; core exports stay free')).toBeVisible();
  const proLink = page.getByRole('link', { name: 'Buy Pro once' });
  await expect(proLink).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/import-reconciliation-ledger/checkout');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByRole('button', { name: 'Set mapping rules' })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('keeps focus after keyboard sample loading and recovers from malformed CSV', async ({ page }) => {
  await page.goto('/');
  const sampleAction = page.getByRole('button', { name: 'Try it with sample data' });
  await sampleAction.focus();
  await sampleAction.press('Enter');
  await expect(page.locator('#source-proof')).toBeFocused();
  await page.setInputFiles('#source-file', {
    name: 'broken.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Account ID,Customer\nAC-1,"unclosed')
  });
  await expect(page.getByRole('status')).toContainText('A quoted field is not closed');
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
});

test('has no serious accessibility violations on application and legal pages', async ({ context }) => {
  const browserErrors: string[] = [];
  for (const path of ['/', '/privacy/', '/terms/']) {
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    page.on('pageerror', (error) => browserErrors.push(error.message));
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await page.close();
  }
  expect(browserErrors).toEqual([]);
});

test('keeps legal touch targets and the source screen inside a 390px viewport', async ({ page }) => {
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const link of await page.locator('.site-footer nav a').all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('uses route titles and provides a styled not-found page with a way back', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Import Reconciliation Ledger — Reconcile CSV imports');
  await page.goto('/privacy/');
  await expect(page).toHaveTitle('Privacy — Import Reconciliation Ledger');
  await page.goto('/terms/');
  await expect(page).toHaveTitle('Terms — Import Reconciliation Ledger');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Import Reconciliation Ledger');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the ledger' })).toHaveAttribute('href', '/');
});
