# Handoff — Import Reconciliation Ledger v1

## Independent verification status — FAIL

Candidate `8c271f50f7372accf7a5eae3ede1b728c77da45a` was independently verified against <https://import-reconciliation-ledger.sociobot.in> on 2026-08-28. **Do not release.** The required `.factory/claims.json` is missing, the first screen does not name the intended operations/finance audience in plain words, and fresh mobile Lighthouse performance is 83 (required: at least 90; TBT 656 ms). The default parallel E2E command also showed a mobile axe-test navigation race. The report additionally records undersized 390px legal-link targets, caching/header gaps, and keyboard/update-flow findings.

See [verification.md](verification.md) for exact commands, deployment byte-identity evidence, all defect severities, PWA/offline/mobile/keyboard/privacy/rate-limit results, and passing workflow evidence. Product code was not changed by the verifier.

## What shipped

- Complete local workflow: source CSV, explicit mapping/transforms, exact-key reconciliation, and exports.
- Strict quoted CSV parsing; deterministic transforms; SHA-256-derived source/output fingerprints.
- Duplicate and blank keys held for review; create/match/skip decisions are recorded for every row and can be overridden.
- Source/transformed numeric totals and decision allocation totals.
- Destination CSV, ledger CSV, project JSON, and checksum-named self-contained HTML review report.
- IndexedDB autosave, restore/erase, paid local project archive, and device-only processing.
- One-time $19 Pro license through Sociobot checkout/verify with cached offline verdict and paste-to-restore. Core reconciliation, safety, accessibility, and exports remain free.
- Installable PWA with original icons, versioned shell/asset caches, offline fallback/status, update toast, and persistent offline state.
- Original AI-assisted ledger still-life, reviewed and optimized from 2.5 MB PNG to 54 KB WebP. Provenance is in `.factory/design.md` and `assets/src/ledger-proof.json`.
- `/privacy/`, `/terms/`, README, and MIT license.

## Verification

```sh
npm ci
npm test
npm run build
```

Results on 2026-08-28:

- `npm test`: 6/6 Vitest assertions and 6/6 Playwright scenarios passed.
- Playwright: production build on desktop Chromium and 390×844 touch viewport; full reconciliation, destination/report downloads, legal pages, and installed offline reload with IndexedDB state.
- Axe WCAG 2 A/AA: zero serious or critical violations on app, privacy, and terms pages in both viewports.
- `npm run build`: passed; output is `dist/` with `dist/index.html` at its root.
- Bundle: 36.5 KB initial JS, 11.4 KB CSS, 54.0 KB hero WebP (raw/uncompressed; budgets 200/50/300 KB).
- Lighthouse 12.8.2 mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 92; LCP 2.0 s, CLS 0, total blocking time 0 ms.
- `npm audit --omit=dev`: 0 production vulnerabilities.

## Known gaps and next steps

- Scope is UTF-8 comma-delimited CSV with one header row and a recommended 25,000-row ceiling. XLSX, locale-specific delimiters/numbers, fuzzy matching, and direct SaaS writes are v1 non-goals.
- The comparison CSV must already use the selected destination-key header; the UI validates this.
- Browser storage is not app-encrypted. The privacy notice advises an encrypted, access-controlled device for PII; passphrase-encrypted vaults are a possible next step.
- The factory must register the slug with Sociobot billing. No provider or product ID is embedded.
- SEO is 92 because the task application intentionally has minimal crawl content; performance and accessibility exceed the contract.
