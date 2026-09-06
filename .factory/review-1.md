# Review 1 — Reconcile CSV imports before upload

**Verdict: FAIL**

- Work order: `import-reconciliation-ledger-review-1`
- Implementation reviewed: `7936faf8ee0fedfc46796a66a6a2373e6a8df029`
- Documentation checkout reviewed: `d6dbb552d458f0f4f826b94963f38b8799bed903`
- Live URL: <https://import-reconciliation-ledger.sociobot.in>
- Reviewed: 2026-09-06
- Findings: **5**
- Untested public claims: **6**

The later commits from the implementation to the documentation checkout change
only `.factory/handoff.md`, `.factory/verification-repair-1.md`, and
`.factory/verification-2.md`. A fresh production build is byte-identical to
the live site for the app HTML, JavaScript, CSS, service worker, manifest,
offline page, legal pages, 404 page, icons, and image assets.

## Findings

### P1 — six public product outcomes are missing complete claim tests

All eight commands in `.factory/claims.json` pass, and every declared claim ID
has exactly one tagged test. The public product and README also promise six
outcomes that have no matching complete claim entry and browser assertion:

1. The full rename, omit, case, exact-replace, date, and number transform set.
   The browser claim path exercises only `trim`; unit coverage is partial and
   is not a tagged, observable claim test.
2. Before/after and per-decision control totals. The claim flow selects an
   amount field but does not assert any displayed total.
3. Ledger CSV export content. The privacy test clicks the button but does not
   inspect the download.
4. Project JSON export and restore as a round trip. No test uses either path.
5. The paid multi-project archive and reusable saved notes. The price test
   checks only the price, checkout URL, and access to the free sample.
6. An immutable, checksum-verifiable report. The report test checks rows,
   fingerprints, and duplicate evidence only.

These promises appear in `README.md`, the mapping and export screens, and the
paid-tier copy. This contradicts the README statement that every public claim
has an independently runnable command. The claims contract makes each missing
or incomplete claim a finding even when the underlying code appears to work.

### P1 — the exported report is described as immutable without integrity proof

The action says **“Export immutable report”**, and the file says **“IMMUTABLE
REVIEW EDITION.”** The exported HTML is editable. Its displayed 16-hex checksum
is calculated from the project name, generation time, row fingerprints, and
decisions. It excludes other report content such as the source filename,
mapping-rule text, and reviewer note. There is no verification action or
documented verification procedure. Editing any excluded content leaves the
displayed checksum unchanged.

The current `@claim:review-report` test does not assert the checksum, its input,
or tamper detection. For a product whose main job is an audit trail, the word
“immutable” gives stronger assurance than the artifact provides. Either call
it a frozen HTML snapshot, or hash a canonical complete report payload and
ship a tested verification path.

### P1 — the paid reusable-notes promise is not implemented

The public copy says Pro adds a multi-project archive and reusable report
notes. The data model contains only one `reportNote` inside each project. There
is no saved-note collection, selector, or action that reuses a note in another
project. The archive UI also renders only five projects after the current one;
older stored projects have no route or control that can open them.

The live checkout itself is registered and responds with a 303 redirect to the
hosted checkout. The defect is the product capability offered after purchase,
not the checkout link. This paid claim needs implementation and an isolated
license-fixture test, or it must be removed from the offer.

### P2 — secondary pages do not meet the required route metadata and skeleton

- `/privacy/` and `/terms/` omit `twitter:title`, `twitter:description`, and
  `twitter:image`.
- The 404 page omits canonical, Open Graph, and Twitter metadata, and has no
  skip link or standard navigation.
- The direct offline page omits a description, canonical, social metadata,
  skip link, and footer.
- The shared app/legal footer and standalone 404 footer do not show a
  version/build ID.
- External checkout and source-code links are not marked as external.

The unknown-route response is a deliberate HTTP 404 with a designed page and a
working return link. That status is expected and is not itself a defect.

### P2 — the required full landing copy audit is incomplete

`.factory/copy-audit.md` audits nine first-screen lines only. The plain-words
contract requires every landing-page sentence, including source, mapping,
reconciliation, export, paid-tier, empty-state, error, and footer copy, with
word counts and banned-word checks. The current file does not provide that
evidence.

## First screen

Fresh 1440×900 desktop and 390×844 phone contexts showed the same information
before scrolling:

- Job: **“Reconcile CSV imports before you upload.”**
- Audience: operations and finance admins reviewing transformed, matched,
  skipped, and created CSV rows.
- First action: **“Try it with sample data.”** The adjacent text says it opens
  a realistic five-row import in a separate demo workspace.

The action bottom was 409 px on desktop and 441 px on phone. Both pages started
at scroll position 0. The phone page had no root horizontal overflow. Each had
`lang=en`, one `h1`, one `main`, and no unexpected console or page error.

## Live sample, reset, and recovery

- The one-click sample changed the URL to `/?demo=1`, loaded
  `sample-import.csv`, and showed the persistent **“Demo — sample data, nothing
  is saved to your real workspace”** banner through rules and export.
- With `Customer` trim, `Account ID` matching, `Amount` totals, and one existing
  `AC-101` record, the ledger showed 5 source rows, 1 create, 1 match, and 3
  skips. Both `AC-102` rows carried duplicate evidence, and the blank key was
  identified.
- Destination CSV contained its header and only `AC-101` and `AC-104`. The
  review report contained five ledger rows, fingerprint pairs, and duplicate
  evidence.
- In a fresh phone context, a real one-row `real.csv` workspace was created
  first. Entering the demo, resetting it, and selecting **Start for real**
  restored that exact real file and row. The demo banner disappeared.
- An unterminated quote and a 20 MB-plus-one-byte file produced clear errors.
  Both left the valid five-row sample intact.

## Accessibility, mobile, privacy, offline, and links

- Live axe-core WCAG 2 A/AA checks found zero serious or critical violations on
  `/`, `/privacy/`, `/terms/`, and the designed 404 page at phone size; the
  landing page also passed at desktop size.
- The live URL verifier passed with the expected title, `lang`, one `h1`, one
  `main`, image alt text, no unlabeled buttons, and no console errors.
- Keyboard Tab reaches the skip link first. Focus uses a 3 px proof-red outline.
  Enter on the sample action moves focus to the `Source rows` heading. Native
  controls remain keyboard operable.
- Reduced-motion mode computes `.01ms` animation and transition durations and
  automatic scrolling. A 200% zoom smoke check kept the heading and sample
  action visible without root overflow.
- During the full live demo/reconcile/export flow, every HTTP request remained
  on the product origin. No analytics, third-party font, or runtime script was
  observed.
- In a fresh phone context, the service worker controlled the demo. Offline
  reload retained the banner and five rows and displayed **“Offline · local
  work continues.”** The worker calls `skipWaiting` only after the explicit
  update action; no waiting update existed to activate during this review.
- All collected internal links returned 200. The source repository returned
  200. The product checkout returned 303 to the hosted checkout. The privacy
  contact is a valid `mailto:` link.
- Live headers include CSP, Permissions-Policy, Referrer-Policy,
  X-Content-Type-Options, X-Frame-Options, and Cross-Origin-Opener-Policy. The
  manifest uses `application/manifest+json`; the service worker is `no-cache`;
  hashed assets use one-year immutable caching.

This is a static, local-first PWA. It has no product backend, tenant database,
health endpoint, or server-persisted customer state, so backend tenant,
restart-persistence, health, and 429 checks do not apply.

## Declared claim commands

After `npm ci`, each exact command passed twice, once in desktop Chromium and
once in the 390×844 phone project:

| Claim | Command | Result |
| --- | --- | --- |
| Demo isolation | `npm run test:e2e -- --grep @claim:demo-sandbox` | 2 passed |
| Row accounting | `npm run test:e2e -- --grep @claim:row-accounting` | 2 passed |
| CSV input | `npm run test:e2e -- --grep @claim:csv-input` | 2 passed |
| Destination CSV | `npm run test:e2e -- --grep @claim:csv-export` | 2 passed |
| Review report | `npm run test:e2e -- --grep @claim:review-report` | 2 passed |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | 2 passed |
| Local-only demo | `npm run test:e2e -- --grep @claim:local-only` | 2 passed |
| Pro price / free core | `npm run test:e2e -- --grep @claim:pro-price` | 2 passed |

The declared commands pass. The verdict remains FAIL because six other public
outcomes are absent or incomplete in the claims ledger.

## Quality gates and performance

- `npm ci`: passed; 59 packages installed; 0 vulnerabilities.
- `npm test`: passed; 6/6 unit tests and 24/24 browser tests with two workers.
- `npm run build`: passed and created `dist/index.html`.
- `npm audit --omit=dev`: passed with 0 vulnerabilities.
- Production assets: 13.11 KB gzip JavaScript, 3.60 KB gzip CSS, and 53,976 B
  hero WebP.
- Fresh live Lighthouse 13.4.1 mobile: Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1,165 ms, TBT 0 ms, CLS 0.

Evidence is under
`/work/.evidence/import-reconciliation-ledger-review-1/`, including desktop and
phone screenshots, `live-browser.json`, the URL-verifier output, and the full
Lighthouse JSON.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Claims file absent | The file and eight commands now exist and pass. This review finds additional public claims outside it. |
| Job and audience absent on first screen | Fixed on fresh desktop and phone. |
| Mobile performance 83 / TBT 656 ms | Fixed: 100 / 0 ms in this review. |
| Hashed assets lacked immutable caching | Fixed live. |
| CSP, Permissions-Policy, and manifest MIME missing | Fixed live. |
| Legal touch targets below 44 px | Fixed in the browser suite and phone check. |
| Parallel browser race | Fixed: the normal two-worker suite passed 24/24. |
| Focus lost after keyboard sample load | Fixed: focus moves to `#source-proof`. |
| Forced service-worker activation | Fixed in implementation; activation requires the explicit update action. |

## Release decision

**FAIL.** There are 5 findings and 6 untested public claims. The successful
workflow, build, performance, accessibility, and eight declared claim commands
do not satisfy the zero-finding and zero-untested-claim release rule.
