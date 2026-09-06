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

async function activateProFixture(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    const key = 'sb_license:import-reconciliation-ledger';
    localStorage.setItem(key, 'test-license-fixture');
    localStorage.setItem(`${key}:verdict`, JSON.stringify({ valid: true, checkedAt: Date.now(), reason: 'ok' }));
  });
  await page.reload();
  await expect(page.getByText('The local project archive and reusable report notes are active.')).toBeVisible();
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

test('@claim:mapping-rules applies rename, omit, trim, case, replace, date, and number rules to exported rows', async ({ page }) => {
  await openDemo(page);
  await page.setInputFiles('#source-file', {
    name: 'rule-set.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('id,Spaced,Upper,Lower,Title,Status,Date,Number,Omit\nA-1,  Acme  ,north,SOUTH,field & STONE,pending,8/14/2026,"$1,240.50",remove me\n')
  });
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Destination field for id').fill('External ID');
  await page.getByLabel('Destination field for Omit').fill('');
  await page.getByLabel('Transform for Spaced').selectOption('trim');
  await page.getByLabel('Transform for Upper').selectOption('uppercase');
  await page.getByLabel('Transform for Lower').selectOption('lowercase');
  await page.getByLabel('Transform for Title').selectOption('titlecase');
  await page.getByLabel('Transform for Status').selectOption('replace');
  await page.getByLabel('Transform argument for Status').fill('pending→approved');
  await page.getByLabel('Transform for Date').selectOption('date');
  await page.getByLabel('Transform for Number').selectOption('number');
  await page.getByLabel('Stable match key').selectOption('External ID');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await page.getByRole('button', { name: 'Review export' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export destination CSV' }).click();
  const csv = await readDownload(await downloadPromise);
  expect(csv.trim()).toBe('External ID,Spaced,Upper,Lower,Title,Status,Date,Number\r\nA-1,Acme,NORTH,south,Field & Stone,approved,2026-08-14,1240.5');
});

test('@claim:control-totals shows source, transformed, and decision totals', async ({ page }) => {
  await reconcileSample(page);
  await page.setInputFiles('#reference-file', {
    name: 'existing-records.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Account ID\nAC-101\n')
  });
  const totals = page.locator('.proof-warning').filter({ hasText: 'Amount: source' });
  await expect(totals).toContainText('Amount: source 4,237 → transformed 4,237');
  await expect(totals).toContainText('Create 1,240 · Match 1,200 · Skip 1,797');
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
  await page.getByRole('button', { name: 'Export review report' }).click();
  const report = await readDownload(await downloadPromise);
  expect(report).toContain('FROZEN REVIEW SNAPSHOT');
  expect(report).toContain('This editable snapshot supports review');
  expect(report).not.toContain('IMMUTABLE');
  expect(report).not.toContain('Checksum');
  expect(report).toContain('Row ledger');
  expect(report).toMatch(/S [a-f0-9]{16}<br>O [a-f0-9]{16}/);
  expect(report.match(/<tr class=/g)).toHaveLength(5);
  expect(report).toContain('Duplicate source key: AC-102');
});

test('@claim:ledger-csv exports one evidence record for every source row', async ({ page }) => {
  await reconcileSample(page);
  await page.setInputFiles('#reference-file', {
    name: 'existing-records.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Account ID\nAC-101\n')
  });
  await page.getByRole('button', { name: 'Review export' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export ledger CSV' }).click();
  const csv = await readDownload(await downloadPromise);
  const lines = csv.trim().split(/\r?\n/);
  expect(lines[0]).toBe('source_row,decision,reason,source_fingerprint,output_fingerprint,changed_fields');
  expect(lines).toHaveLength(6);
  expect(csv.match(/Duplicate source key: AC-102/g)).toHaveLength(2);
  expect(csv).toMatch(/^1,match,Key found in comparison file: AC-101,[a-f0-9]{16},[a-f0-9]{16},Customer$/m);
});

test('@claim:project-roundtrip restores an exported project with its decisions and note', async ({ page }) => {
  await openDemo(page);
  await page.getByLabel('Project name').fill('August customer import');
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Stable match key').selectOption('Account ID');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await page.locator('[data-decision-index="4"]').selectOption('match');
  await page.getByRole('button', { name: 'Review export' }).click();
  await page.getByLabel('Reviewer note').fill('Approved after checking the duplicate customer IDs.');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project JSON' }).click();
  const exported = await readDownload(await downloadPromise);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.setInputFiles('#project-import', { name: 'august-project.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await expect(page.locator('.desk-note h2')).toHaveText('August customer import');
  await expect(page.getByLabel('Reviewer note')).toHaveValue('Approved after checking the duplicate customer IDs.');
  await expect(page.locator('.metric').filter({ hasText: 'Match' }).locator('strong')).toHaveText('1');
  await expect(page.getByText('100% accounted for.')).toBeVisible();
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
  await expect(proLink).toHaveAttribute('target', '_blank');
  await page.getByRole('button', { name: 'Try it with sample data' }).click();
  await expect(page.getByRole('button', { name: 'Set mapping rules' })).toBeEnabled();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('@claim:pro-workspace archives every project and reuses a saved note in another project', async ({ page }) => {
  await activateProFixture(page);
  await page.setInputFiles('#source-file', { name: 'august.csv', mimeType: 'text/csv', buffer: Buffer.from(realCsv) });
  await page.getByLabel('Project name').fill('August invoices');
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Stable match key').selectOption('Account ID');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await page.getByRole('button', { name: 'Review export' }).click();
  await page.getByLabel('Reviewer note').fill('Approved by the migration lead after duplicate review.');
  await page.getByLabel('Saved note name').fill('Migration approval');
  await page.getByRole('button', { name: 'Save reusable note' }).click();
  await expect(page.getByRole('status')).toContainText('Saved reusable note');

  for (let count = 1; count <= 6; count += 1) {
    await page.getByRole('button', { name: 'Archive this import' }).click();
    await expect(page.locator('[data-open-project]')).toHaveCount(count);
  }
  await expect(page.getByText('6 archived projects')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'New project' }).click();
  await page.setInputFiles('#source-file', { name: 'september.csv', mimeType: 'text/csv', buffer: Buffer.from('Account ID,Customer,Amount\nREAL-200,Second workspace,84.00\n') });
  await page.getByLabel('Project name').fill('September invoices');
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Stable match key').selectOption('Account ID');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await page.getByRole('button', { name: 'Review export' }).click();
  await page.getByLabel('Saved notes').selectOption({ label: 'Migration approval' });
  await page.getByRole('button', { name: 'Use saved note' }).click();
  await expect(page.getByLabel('Reviewer note')).toHaveValue('Approved by the migration lead after duplicate review.');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByRole('status')).toContainText('Project saved on this device.');

  await page.reload();
  await expect(page.locator('[data-open-project]')).toHaveCount(6);
  await expect(page.getByLabel('Saved notes')).toContainText('Migration approval');
  await page.locator('[data-open-project]').first().click();
  await expect(page.locator('.desk-note h2')).toHaveText('August invoices');
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
  await page.setInputFiles('#source-file', {
    name: 'too-large.csv',
    mimeType: 'text/csv',
    buffer: Buffer.alloc(20 * 1024 * 1024 + 1, 'x')
  });
  await expect(page.getByRole('status')).toContainText('That file is over 20 MB');
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  await page.setInputFiles('#project-import', { name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{not json') });
  await expect(page.getByRole('status')).toContainText('Expected property name');
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
});

test('has no serious accessibility violations on application and legal pages', async ({ context }) => {
  const browserErrors: string[] = [];
  for (const path of ['/', '/privacy/', '/terms/', '/404.html', '/offline.html']) {
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

test('keeps keyboard focus visible and removes motion when requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  const motion = await page.locator('.work-grid').evaluate((element) => ({
    animationDuration: getComputedStyle(element).animationDuration,
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
  }));
  const durationMs = motion.animationDuration.endsWith('ms') ? parseFloat(motion.animationDuration) : parseFloat(motion.animationDuration) * 1000;
  expect(durationMs).toBeLessThanOrEqual(0.01);
  expect(motion.scrollBehavior).toBe('auto');
  await page.locator('.skip-link').press('Enter');
  await expect(page.locator('#main')).toBeFocused();
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
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://import-reconciliation-ledger.sociobot.in/404.html');
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Page not found — Import Reconciliation Ledger');
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('footer')).toContainText('Version 1.1.0');
  await page.goto('/offline.html');
  await expect(page).toHaveTitle('Offline — Import Reconciliation Ledger');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Reconnect once/);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /ledger-social/);
  await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');
  await expect(page.locator('footer')).toContainText('Version 1.1.0');
});

test('publishes complete social metadata and marks external links', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('meta[name="twitter:title"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /ledger-social/);
    await expect(page.locator('footer')).toContainText('Version 1.1.0');
  }
  await page.goto('/');
  const source = page.getByRole('link', { name: 'Source code (opens in new tab)' });
  await expect(source).toHaveAttribute('target', '_blank');
  await expect(source).toHaveAttribute('rel', 'noreferrer');
  await expect(page.getByRole('link', { name: 'Buy Pro once (opens in new tab)' })).toHaveAttribute('target', '_blank');
});
