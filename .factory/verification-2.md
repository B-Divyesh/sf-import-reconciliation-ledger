# Independent verification 2 — Reconcile CSV imports before upload

**Verdict: PASS**

- **Work order:** `import-reconciliation-ledger-verify-2`
- **Candidate reviewed:** `7936faf8ee0fedfc46796a66a6a2373e6a8df029` (`7936faf`)
- **Documentation checkout:** `9e4622f5dc17eebb601cd46bc6a68c8081c6f3be` (`9e4622f`)
- **Live URL:** <https://import-reconciliation-ledger.sociobot.in>
- **Verified:** 2026-09-06
- **Findings:** 0
- **Untested public claims:** 0

The later checkout changes only `.factory/handoff.md` and
`.factory/verification-repair-1.md`; it does not change the implementation
candidate. The local production build and the live response were byte-identical
for `index.html`, app JS/CSS, service worker, manifest, offline page, 404 page,
and both legal pages.

## First screen and primary job

Fresh desktop (1440×900) and phone (390×844) browser contexts both loaded with
no console errors. Before scrolling, each showed:

- Job: **“Reconcile CSV imports before you upload.”**
- Audience: operations and finance admins.
- First action: **“Try it with sample data.”** It explains that it opens a
  realistic five-row import in a separate demo workspace.

The action stayed in the first viewport: its lower edge was 409 px on desktop
and 441 px on phone. The landing page has `lang=en`, one `h1`, and one `main`.

## Claims from a documented clean setup

After `npm ci`, every command declared in `.factory/claims.json` passed in both
the Chromium desktop and 390×844 phone projects (two tests per command):

| Claim | Command | Result |
| --- | --- | --- |
| Isolated demo sandbox | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS |
| Row accounting | `npm run test:e2e -- --grep @claim:row-accounting` | PASS |
| Supported CSV input | `npm run test:e2e -- --grep @claim:csv-input` | PASS |
| Free CSV export | `npm run test:e2e -- --grep @claim:csv-export` | PASS |
| Review report | `npm run test:e2e -- --grep @claim:review-report` | PASS |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| Local-only demo use | `npm run test:e2e -- --grep @claim:local-only` | PASS |
| Pro price / free core | `npm run test:e2e -- --grep @claim:pro-price` | PASS |

`npm test` also passed: 6/6 Vitest tests and 24/24 Playwright tests in the
normal two-worker configuration. `npm run build` passed and produced `dist/`.
`npm audit --omit=dev` reported 0 vulnerabilities.

No additional public claim was found on the landing page or README without a
matching, observable claim test.

## Live workflow and recovery evidence

- A fresh phone context created a real one-row `real.csv` workspace. Opening
  `?demo=1` showed the persistent **“Demo — sample data, nothing is saved to
  your real workspace”** banner and the five-row `sample-import.csv`. Reset
  restored that sample. **Start for real** returned to the original `real.csv`
  workspace with its one row intact.
- The normal sample workflow with `Account ID` as the stable key, `Customer`
  trim, `Amount` control total, and an existing `AC-101` record produced five
  ledger rows: 1 create, 1 match, and 3 skips. It displays duplicate-key and
  blank-key review evidence.
- An unterminated quoted field displayed “A quoted field is not closed. Check
  the final rows of the CSV.” A 20 MB-plus-one-byte file displayed the stated
  split-into-batches error. Both left the valid five-row sample loaded, proving
  recovery rather than destructive replacement.
- Keyboard Enter on the sample action moves focus to the `Source rows` heading.
  The skip link, controls, and visible focus treatment are available. Reduced
  motion reduces animation/transition duration to `.01ms` and uses automatic
  scrolling.
- After first live demo load, an active service worker controlled the page.
  In a fresh phone context, offline reload retained the demo banner and five
  sample rows and displayed “Offline · local work continues.” Worker activation
  is user-controlled: `SKIP_WAITING` is sent only from the explicit update
  action.

This static PWA has no product backend, tenant, or server-persisted customer
state; therefore tenant isolation, restart persistence, and API rate-limit
checks do not apply. CSV state is browser IndexedDB/local storage by design.

## Accessibility, routes, privacy, and delivery

- Live Playwright + axe-core WCAG 2 A/AA audits found zero serious or critical
  violations on `/`, `/privacy/`, and `/terms/`, on both desktop and phone. Axe
  was injected before document load (`context.addInitScript`), which preserves
  the production CSP rather than weakening it for the audit. No console errors
  occurred.
- Each route has its route-specific title, one `h1`, and one `main`. All
  collected product, legal, checkout, source, and `mailto:` links resolved as
  expected. `/robots.txt` and `/sitemap.xml` are served.
- An unknown live route returns HTTP **404**, presents the designed “Page not
  found” screen, and has a “Return to the ledger” link. This expected 404 is
  not a finding.
- Live headers include CSP, Permissions-Policy, Referrer-Policy,
  X-Content-Type-Options, X-Frame-Options, and Cross-Origin-Opener-Policy.
  The manifest is `application/manifest+json`; `sw.js` is `no-cache`; hashed
  assets are `max-age=31536000, immutable`.
- Full live Lighthouse 13.4.1 mobile run: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1,106 ms, TBT 0 ms, CLS 0.
- The current production asset budget is 13,036 B gzip JS, 3,614 B gzip CSS,
  and 53,976 B hero WebP. No third-party runtime font, script, analytics, or
  normal-use data request was observed; the local-only claim test records only
  same-origin requests during the demo flow.

## Earlier findings disposition

| Earlier finding | Current disposition and independent evidence |
| --- | --- |
| Missing claims contract | Fixed. Eight claims exist and all eight declared commands pass. |
| Audience/job unclear on first screen | Fixed. Fresh desktop and phone first screens state job, audience, and sample action before scrolling. |
| Mobile Lighthouse performance 83 / 656 ms TBT | Fixed. Fresh live full Lighthouse is 100 performance / 0 ms TBT. |
| Non-immutable assets | Fixed. Hashed live assets use one-year immutable caching. |
| Missing CSP, Permissions-Policy, manifest MIME | Fixed. All are present live with manifest JSON media type. |
| Legal links below touch target | Fixed. Normal browser suite passes 44 px legal-target check at 390 px. |
| Parallel browser suite race | Fixed. Default two-worker `npm test` passes 24 browser tests. |
| Keyboard focus lost after sample load | Fixed. Live Enter activation puts focus on `#source-proof`. |
| Forced service-worker update | Fixed. Worker accepts `SKIP_WAITING` only after the explicit app update action. |

## Remaining product limits

The documented v1 limits remain intentional: UTF-8 comma-delimited CSV with a
single header row, deterministic rules, exact matching, no XLSX or direct SaaS
writes, and no app-level encryption of browser storage. The optional Sociobot
billing registration remains a factory dependency; the free reconciliation
workspace and all exports remain available without it.
