# Handoff — Import Reconciliation Ledger

## Release status

**FAIL — strict review 1 found 5 findings and 6 untested public claims.**

- Implementation SHA: `7936faf8ee0fedfc46796a66a6a2373e6a8df029`
- Documentation checkout reviewed: `d6dbb552d458f0f4f826b94963f38b8799bed903`
- Product URL: <https://import-reconciliation-ledger.sociobot.in>
- Current report: [`.factory/review-1.md`](review-1.md)
- Earlier passing verification: [`.factory/verification-2.md`](verification-2.md)

The implementation was not changed during review. Commits after `7936faf`
contain reports only, and the current build is byte-identical to the live app,
assets, service worker, manifest, legal pages, offline page, and 404 page.

## Current findings

1. Six public outcomes lack complete tagged claim tests: the full mapping-rule
   set, control totals, ledger CSV, project JSON round trip, paid archive/notes,
   and immutable/checksum verification.
2. The HTML review report is called immutable, but its partial displayed
   checksum does not make the file tamper-verifiable.
3. Paid copy promises reusable report notes, but the implementation only stores
   one note inside each project. The archive UI exposes only five older
   projects.
4. Secondary pages are missing required metadata and shared structure; all
   footers omit a version/build ID.
5. `.factory/copy-audit.md` covers only first-screen text, not every landing
   sentence required by the plain-words contract.

See the review for exact locations, severity, evidence, and repair options.

## Passing verification

From a clean dependency install:

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

- All eight exact `.factory/claims.json` commands passed in desktop and phone
  projects.
- `npm test` passed 6 unit and 24 browser tests with two workers.
- `npm run build` created `dist/index.html`.
- The production-only audit reported 0 vulnerabilities.
- Fresh live Lighthouse 13.4.1 mobile scored 100 in Performance,
  Accessibility, Best Practices, and SEO. LCP was 1.165 s, TBT 0 ms, CLS 0.
- Live axe checks found no serious or critical issues on the app, legal pages,
  or 404 page.
- Fresh desktop and phone contexts confirmed the job, audience, sample action,
  demo banner, reset, real-data isolation, populated reconciliation, exports,
  invalid and boundary recovery, keyboard focus, reduced motion, offline
  reload, links, and hardening headers.
- The expected unknown-route HTTP 404 shows the designed return path. The 404
  status itself is not a defect.

Evidence is stored at
`/work/.evidence/import-reconciliation-ledger-review-1/` and the required copy
of the report is `/work/.evidence/qa-report.md`.

## Earlier-finding disposition

The earlier missing claims file, first-screen audience, Lighthouse regression,
caching, hardening headers, manifest MIME, legal touch targets, parallel test
race, keyboard focus, and forced service-worker activation findings all remain
fixed. Review 1 adds the current findings above.

## Known product limits

The documented v1 input remains UTF-8 comma-delimited CSV with one header row,
deterministic rules, exact matching, and no direct SaaS writes. Browser storage
is not app-encrypted; users are told to use an encrypted, access-controlled
device for sensitive data. The product is static and has no backend or shared
database.
