# Handoff — Import Reconciliation Ledger

## Release status

**PASS — independently verified live on 2026-09-06.**

- Implementation SHA: `7936faf8ee0fedfc46796a66a6a2373e6a8df029`
- Product URL: <https://import-reconciliation-ledger.sociobot.in>
- Prior failed candidate: `8c271f50f7372accf7a5eae3ede1b728c77da45a`
- Documentation report SHA: `4ba9542348b435f2d4aafe99acb95b852b1be1b8` (later than the deployed implementation).
- Independent verification documentation checkout: `9e4622f5dc17eebb601cd46bc6a68c8081c6f3be`.
- Independent report: [`.factory/verification-2.md`](verification-2.md). It records **0 findings** and **0 untested claims**.

The first live screen now says the job, **“Reconcile CSV imports before you upload,”** names operations and finance admins, and presents **“Try it with sample data”** before scrolling. The action opens a five-row CSV in a distinct demo workspace.

## What changed

- Added `.factory/claims.json` with eight observable, tagged browser claims and `.factory/demo.md`.
- Made demo mode a separate IndexedDB database (`reconciliation-ledger-demo`) and local-storage namespace. Reset restores the sample; Start for real discards demo storage and returns to saved real data.
- Kept pointer sample loads in place while moving keyboard focus to the sample rows after Enter/Space activation.
- Replaced the forced service-worker update path with a user-controlled update action. Initial service-worker control no longer reloads and loses an in-progress interaction.
- Rewrote the first screen in plain words, added clear demo/price/privacy facts, and removed mood-copy headings.
- Added 44px legal-link targets, fuller route metadata, generated social preview crop, robots, sitemap, and a styled real 404 page.
- Added static delivery configuration: immutable caching for content-hashed assets, no-cache service worker/manifest, manifest MIME type, CSP, Permissions-Policy, framing protection, and a 404 response override.
- Removed production source maps. Initial JS is 39.8 KB raw / 13.1 KB gzip; CSS is 13.0 KB raw / 3.6 KB gzip; hero is 54.0 KB.

## Verification

From documented clean setup:

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

- `npm test`: 6/6 Vitest and 24/24 Playwright desktop/mobile tests passed in the normal two-worker configuration.
- Every documented claim command in `.factory/claims.json` was run successfully. The claim suite covers isolated demo data, quoted CSV input, row accounting, CSV/report exports, offline reload, same-origin privacy requests, and the paid-tier display.
- `npm run build`: passed and created `dist/index.html`.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Live Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.1 s, TBT 0 ms, CLS 0, max potential FID 20 ms.
- Live `verify-url.sh`: HTTPS 200, title/lang/main/one h1/alt text present, 0 console errors, and 0 unlabeled buttons.
- Fresh live desktop and 390×844 phone contexts: first action remained in the first viewport (bottom 409px desktop, 441px phone); demo loaded five rows; pointer use did not scroll the page; keyboard activation moved focus to the source rows.
- Live axe (WCAG 2 A/AA) found 0 serious/critical issues on the app in both viewports and on `/privacy/` and `/terms/`.
- Live phone offline check: after the first demo visit, service-worker-controlled reload while offline retained the sample and showed the offline state.
- Live static checks: current built `index.html` and app JS are byte-identical to HTTPS responses; assets use `max-age=31536000, immutable`; the manifest is `application/manifest+json`; CSP and Permissions-Policy are present; an unknown URL returns HTTP 404 with the designed page.
- Verification 2 repeated all eight declared claim commands from `npm ci`, then the normal two-worker `npm test` (6 unit + 24 browser tests), `npm run build`, and `npm audit --omit=dev` (0 vulnerabilities). A fresh live full Lighthouse run returned 100 Performance, Accessibility, Best Practices, and SEO, with 0 ms TBT. Fresh desktop and phone contexts confirmed the first-screen job/audience/action, demo isolation, normal reconciliation, invalid-input recovery, keyboard focus, offline reload, route/link behavior, privacy, and accessibility.

## Earlier-finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims contract | Fixed: eight claimed outcomes and one tagged test per ID. |
| Audience absent on first screen | Fixed: operations and finance admins are named beside the job headline. |
| Mobile Lighthouse 83 / TBT 656 ms | Fixed: live score 100 / TBT 0 ms. |
| Short immutable asset cache | Fixed for content-hashed assets. |
| Missing CSP, Permissions-Policy, manifest MIME | Fixed and checked live. |
| 20px legal touch targets | Fixed at 44px or more. |
| Parallel axe/navigation race | Fixed by isolated audit pages and avoiding initial service-worker reloads; normal two-worker suite passed. |
| Focus lost after sample load | Fixed: keyboard goes to the new sample rows; pointer stays in place. |
| Forced service-worker updates | Fixed: only an explicit Update action requests `skipWaiting`. |

## Known gaps and next steps

- v1 remains limited to UTF-8 comma-delimited CSV, one header row, and the documented deterministic rules. XLSX, locale-specific delimiters/numbers, fuzzy matching, encrypted-at-rest projects, and direct SaaS writes are intentional non-goals.
- Browser storage is not app-encrypted; sensitive CSVs should remain on an encrypted, access-controlled device.
- Sociobot billing registration remains an external factory dependency. The free core and all exports work without it. The public offer metadata is at `/work/.evidence/billing-offer.json`; no payment-provider credential is embedded.
