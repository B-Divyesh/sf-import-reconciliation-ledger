import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test('reconciles every source row and exports the files', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('Import Reconciliation Ledger');
  await page.getByRole('button', { name: 'Load five-row sample' }).click();
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  await page.getByRole('button', { name: 'Set mapping rules' }).click();
  await page.getByLabel('Transform for Customer').selectOption('trim');
  await page.getByLabel('Stable match key').selectOption('Account ID');
  await page.getByLabel('Amount field (optional)').selectOption('Amount');
  await page.getByRole('button', { name: 'Apply rules & reconcile' }).click();
  await expect(page.getByText(/rows share a source key/)).toBeVisible();
  await expect(page.locator('[data-decision-index]')).toHaveCount(5);
  await expect(page.getByText('5/5')).toBeVisible();
  await page.getByRole('button', { name: 'Review export' }).click();
  await expect(page.getByText('100% accounted for.')).toBeVisible();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export destination CSV' }).click();
  expect((await csvDownload).suggestedFilename()).toMatch(/destination\.csv$/);

  const reportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export immutable report' }).click();
  expect((await reportDownload).suggestedFilename()).toMatch(/review-[a-f0-9]{16}\.html$/);
});

test('has no serious accessibility violations on source and legal pages', async ({ page }) => {
  for (const path of ['/', '/privacy/', '/terms/']) {
    await page.goto(path);
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } }));
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
  }
});

test('keeps the installed workspace available offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'serviceWorker' in navigator);
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => Boolean(navigator.serviceWorker.controller)));
  await page.waitForFunction(() => document.documentElement.dataset.offlineReady === 'true');
  await page.getByRole('button', { name: 'Load five-row sample' }).click();
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
  await context.setOffline(true);
  await page.waitForTimeout(250);
  await page.reload();
  await expect(page.getByText('Offline · local work continues')).toBeVisible();
  await expect(page.getByText('5 rows · 4 columns loaded')).toBeVisible();
});
