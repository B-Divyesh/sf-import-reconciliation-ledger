# Review 2 — Reconcile CSV imports before upload

**Verdict: PASS**

- Work order: `import-reconciliation-ledger-review-2`
- Implementation reviewed: `1b358ff6b86db5bb88f2349f5d9f43585bbae2b6`
- Documentation checkout reviewed: `f0db558ac5e1e2c6c1c271c48f78509a322363e9`
- Live URL: <https://import-reconciliation-ledger.sociobot.in>
- Reviewed: 2026-09-06
- Findings: **0**
- Untested public claims: **0**

The implementation candidate and current documentation checkout differ only in
factory reports. A fresh production build from the current checkout matched the
live `index.html` and both hashed JS/CSS assets byte-for-byte, so the live
product is the implementation at `1b358ff6`.

## First screen and demo path

Fresh 1440 x 900 desktop and 390 x 844 phone contexts showed these items
before scrolling, with no console errors or horizontal root overflow:

- Job: **Reconcile CSV imports before you upload**.
- Audience: operations and finance admins.
- First action: **Try it with sample data**, which explains that it opens a
  realistic five-row import in a separate demo workspace.

The action bottom was 409 px on desktop and 441 px on phone. In a fresh real
workspace I loaded `real.csv` with one row, entered the demo, and saw the
persistent label **Demo — sample data, nothing is saved to your real
workspace**. After selecting Customer trim, Account ID as the key, Amount as
the control field, and an `AC-101` comparison row, the live ledger showed 5
source, 1 create, 1 match, and 3 skip records; two duplicate-key records; one
blank-key record; and source/transformed totals of 4,237. The export stage
offered destination CSV, review report, ledger CSV, and project JSON. Reset
restored the sample. Start for real returned to the unchanged `real.csv` row
and removed the demo label.

## Claims and clean quality gates

From a separate clean clone at `f0db558`, `npm ci` installed 59 packages and
`npm audit --omit=dev` reported zero vulnerabilities. Every command declared
in `.factory/claims.json` was run exactly as written and passed in the desktop
and phone Playwright projects:

| Claim IDs | Result |
| --- | --- |
| `demo-sandbox`, `row-accounting`, `csv-input` | PASS |
| `mapping-rules`, `control-totals`, `csv-export` | PASS |
| `ledger-csv`, `review-report`, `project-roundtrip` | PASS |
| `offline-reload`, `local-only`, `pro-price`, `pro-workspace` | PASS |

`npm test` passed all 6 Vitest tests and all 38 Playwright tests with the
normal two workers. `npm run build` passed and produced `dist/index.html`.
Its initial JS is 13.83 KB gzip, CSS is 3.71 KB gzip, and the hero image is
53,976 bytes. I cross-checked the live app and README against the 13-entry
claims ledger; every public product outcome is covered, including the honest
editable frozen review snapshot rather than an immutability promise.

## Accessibility, recovery, privacy, and offline use

- `verify-url.sh` passed live: HTTPS 200, title, `lang=en`, one h1, one main,
  image alt text, labelled buttons, and no load errors.
- Live Playwright axe WCAG 2 A/AA scans found zero serious or critical issues
  on `/`, `/privacy/`, `/terms/`, `/offline.html`, and the designed 404 page.
- Keyboard focus reaches the skip link first, moves to `main`, and moves to
  `Source rows` after activating the sample with Enter. Reduced-motion mode
  uses a 0.01 ms animation duration and automatic scrolling.
- An unterminated quoted CSV and a file over 20 MB gave clear recovery
  messages and retained the five-row sample. Phone footer controls are at
  least 44 px high and the 390 px root has no horizontal overflow.
- A fresh phone service-worker context was controlled before going offline.
  Offline reload retained the demo label and five rows and displayed
  **Offline · local work continues**.
- The normal demo reconciliation/export flow made only same-origin requests.
  There are no third-party runtime scripts, analytics, or fonts. This static
  local-first PWA has no product backend, tenant state, health endpoint,
  restart process, or product API rate limit; backend-only checks do not
  apply.

## Routes, links, headers, and performance

The root, legal pages, offline page, PWA assets, and internal links returned
200. GitHub returned 200, the mail link is explicit, and the hosted checkout
returned its expected 303 redirect. An unknown route returned HTTP 404 with a
styled `Page not found` page and a working route home; its failed-resource
console entry is expected for that deliberate 404, not a defect.

Live responses include CSP, Permissions-Policy, Referrer-Policy,
X-Content-Type-Options, X-Frame-Options, and COOP. The manifest is
`application/manifest+json`; the service worker is no-cache; hashed assets use
one-year immutable caching. Fresh live mobile Lighthouse 13.4.1 scored:

| Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 100 | 100 | 100 | 1,177 ms | 0 ms | 0 |

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing claims file and later six incomplete claims | Fixed. All 13 exact claim commands pass, and the current public outcomes are covered. |
| Job and audience absent from the first screen | Fixed. Both fresh viewport checks show the job and operations/finance audience before scrolling. |
| Mobile performance, cache policy, security headers, manifest MIME, and touch-target gaps | Fixed. Fresh Lighthouse, live headers, manifest response, cache checks, and phone measurements pass. |
| Parallel test race, keyboard sample-focus loss, and forced update behaviour | Fixed. The normal two-worker suite passes; sample activation deliberately moves focus; offline worker behaviour passes its isolated claim test. |
| Immutable/checksum report wording | Fixed. Product copy and export tests accurately call the downloadable file an editable frozen snapshot. |
| Pro reusable notes absent and archive display limited to five | Fixed. The Pro claim archives six projects, reuses a saved note across projects, reloads, and reopens an archive. |
| Legal/standalone metadata, route skeleton, external-link labels, footer build ID, and incomplete copy audit | Fixed. Current route, link, metadata, accessibility, and documentation checks pass. |

## Evidence

Evidence is in `/work/.evidence/import-reconciliation-ledger-review-2/`,
including live desktop/phone screenshots, browser checks, URL-verifier output,
build-match hashes, and mobile Lighthouse JSON.

**PASS. There are zero findings and zero untested public claims.**
