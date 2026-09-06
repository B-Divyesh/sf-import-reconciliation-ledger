# Verification 3 — Reconcile CSV imports before upload

**Verdict: PASS**

- Work order: `import-reconciliation-ledger-verify-3`
- Implementation reviewed: `1b358ff6b86db5bb88f2349f5d9f43585bbae2b6`
- Documentation checkout: `f0777979806847ec33fe127afb25ea931a3b6787`
- Live URL: <https://import-reconciliation-ledger.sociobot.in>
- Verified: 2026-09-06
- Findings: **0**
- Untested public claims: **0**

## Scope and build identity

The later commits after `1b358ff6` change only `.factory/handoff.md` and
`.factory/verification-repair-2.md`. A fresh production build from the
implementation candidate matched the live `index.html` and its hashed JS and
CSS byte-for-byte. The candidate is therefore the live product reviewed here.

## First screen and sample workspace

Fresh 1440 × 900 desktop and 390 × 844 phone contexts both showed, before
scrolling:

- Job: **Reconcile CSV imports before you upload**.
- Audience: operations and finance admins.
- First action: **Try it with sample data**, with an explanation that it opens
  a realistic five-row import in a separate demo workspace.

The action's lower edge was 409 px on desktop and 441 px on phone. Neither
viewport had horizontal root overflow or console/page errors.

In each fresh context, I created a one-row real workspace, entered the demo,
and saw the persistent **Demo — sample data, nothing is saved to your real
workspace** label. After mapping `Customer` trim, `Account ID` as the key, and
`Amount` as the control field, then supplying `AC-101` as the comparison row,
the live ledger showed 5 source, 1 create, 1 match, and 3 skip rows. It showed
two duplicate-key rows, a blank-key row, and totals of 4,237 before and after.
The export screen offered destination CSV, review report, ledger CSV, and
project JSON. Reset restored the five-row sample; Start for real returned to
the unchanged real one-row workspace.

## Claims and local quality gates

From the documented clean setup, `npm ci` installed 59 packages and
`npm audit --omit=dev` reported zero vulnerabilities. Each command below was
run exactly as declared in `.factory/claims.json`; every command passed in both
the desktop and phone Playwright projects.

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `row-accounting`, `csv-input` | PASS |
| `mapping-rules`, `control-totals`, `csv-export` | PASS |
| `ledger-csv`, `review-report`, `project-roundtrip` | PASS |
| `offline-reload`, `local-only`, `pro-price`, `pro-workspace` | PASS |

Each claim ID appears exactly once as an `@claim:` browser test. The public
copy and README were checked against the claim ledger; no unsupported public
outcome was found. In particular, the report is honestly described and tested
as an editable frozen snapshot, not an immutable or checksum-verifiable file.

`npm test` passed 6 Vitest tests and 38 Playwright tests with the normal
two-worker configuration. `npm run build` passed and produced `dist/index.html`.
The production build contains 13.83 KB gzip JS, 3.71 KB gzip CSS, and a
53,976-byte hero image.

## Accessibility, recovery, privacy, and PWA

- `verify-url.sh` passed the live root: HTTPS 200, title, `lang=en`, one h1,
  one main landmark, image alt text, labelled buttons, and no load errors.
- Playwright axe WCAG 2 A/AA checks found zero serious or critical violations
  on `/`, `/privacy/`, `/terms/`, `/offline.html`, and the designed 404 page,
  on desktop and phone.
- Keyboard checks found the skip link first, moved focus to `main`, and moved
  focus to `Source rows` after keyboard sample loading. Reduced motion reported
  a 0.01 ms transition and automatic scrolling.
- An unterminated quoted CSV and a file over 20 MB both produced actionable
  errors while retaining the loaded five-row sample. Reset demo then recovered
  the sample again.
- Normal demo requests stayed same-origin. There are no third-party runtime
  scripts, analytics, or fonts. The static app has no product backend, tenant
  state, health endpoint, restart process, or product API rate limit; those
  backend-only checks do not apply.
- In a fresh phone context, service-worker control was established. After
  taking that context offline and reloading, the demo banner and five rows
  remained and the page reported `Offline · local work continues`.

## Routes, delivery, and performance

The root, legal pages, offline page, icons/manifest support files, robots, and
sitemap returned 200. The optional hosted checkout returned its expected
redirect, the source link returned 200, and the mail link is explicit. An
unknown route returned HTTP 404 and the designed `Page not found` page; its
browser console's failed-resource entry is expected for that deliberate 404,
not a defect.

Live hashed assets use one-year immutable caching. The service worker and
manifest use no-cache. The live response includes CSP, Permissions-Policy,
Referrer-Policy, X-Content-Type-Options, X-Frame-Options, and COOP headers; the
manifest is `application/manifest+json`.

Fresh live mobile Lighthouse 13.4.1: Performance 100, Accessibility 100, Best
Practices 100, SEO 100; LCP 1,110 ms, TBT 0 ms, CLS 0. A desktop Lighthouse
run also scored 100 in every category.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims contract and six later uncovered claims | Fixed. Thirteen exact claim commands pass and cover every listed public outcome. |
| First screen did not state job or audience | Fixed on fresh desktop and phone before scrolling. |
| Mobile performance, immutable caching, headers, manifest type, and footer target gaps | Fixed. Fresh Lighthouse, live headers, manifest response, and axe/touch checks pass. |
| Parallel test race, sample-focus loss, forced worker update | Fixed. The normal two-worker suite passes; focus moves deliberately; worker activation is controlled by the explicit update action. |
| Immutable/checksum report claim | Fixed. The product and test call it an editable frozen snapshot. |
| Paid notes absent and archive limited to five | Fixed. The Pro claim archives six projects, reuses a note across projects, reloads, and reopens an archive. |
| Legal/standalone metadata, route skeleton, copy-audit gaps | Fixed. Fresh route, metadata, link, and accessibility checks pass. |

## Evidence

Evidence is in `/work/.evidence/import-reconciliation-ledger-verify-3/` and
`/work/.evidence/import-reconciliation-ledger-verify-3-url/`, including the
mobile and desktop Lighthouse JSON and live URL verifier output.

**PASS. There are zero findings and zero untested public claims.**
