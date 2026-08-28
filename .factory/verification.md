# Independent verification — candidate `8c271f50f7372accf7a5eae3ede1b728c77da45a`

**Verdict: FAIL** — verified 2026-08-28 against
<https://import-reconciliation-ledger.sociobot.in>.

This was a clean-clone verification. Product source was not changed; this report
and the handoff are the only repository changes.

## Release blockers and defects

### Critical — required claims contract is absent

`.factory/claims.json` does not exist in the candidate. The work order requires
running *every* test in that file through the demo entry point before anything
else, and explicitly makes a missing file release-blocking. Consequently there
were no claim tests to execute and the required claims evidence is absent.

### Medium — 390px touch targets do not meet the 44px contract

On the cold live page at 390×844, the footer `Privacy`, `Terms`, and `Source
code` links measured 20px, 20px, and 20px high respectively. The utility
`Privacy` link measured 19px high. These are interactive targets and violate
the 44×44px requirement in the acceptance/accessibility contract.

### Medium — deployed hashed assets are not immutable cached

The live hashed JS and CSS assets both return:

```
cache-control: public, must-revalidate, max-age=30
```

The PWA/performance contract requires long-lived immutable caching for hashed
assets. The same 30-second policy is used for the service worker, manifest,
HTML, and offline page. This is a deployment configuration issue, not a source
hash mismatch.

### Low — keyboard focus is lost after loading the sample

Using Tab then Enter to activate **Load five-row sample** worked on desktop and
390px mobile, but the source-stage re-render left `document.activeElement` on
`body` (0px outline). The user must tab from the beginning again instead of
continuing at the newly revealed preview/action. The dynamic update should
retain or deliberately move focus.

### Low — update toast cannot be a durable user-controlled update prompt

`public/sw.js` calls `self.skipWaiting()` during every install, while the app
offers an “Update” action only for `registration.waiting`. An updated worker
therefore activates immediately and `controllerchange` reloads the page. The
specified in-app “update available” toast cannot remain available for a user
to choose an update. Live worker registration/offline behavior works; this is
the update-flow defect.

## Required first-read test

Cold live page result: **pass**. The first screen says it is an “Import
Reconciliation Ledger,” says “Choose a UTF-8, comma-delimited CSV” and “It is
read inside this browser and never sent to us,” and identifies the work as
accounting for every row before import. It provides the plainly labelled,
one-click **Load five-row sample** control. There were no console or page
errors and no failed page requests on this cold load.

## Local quality gates

Executed from the clean candidate:

```sh
npm ci
npm test
npm run build
npm audit --omit=dev
```

Results:

- `npm ci`: completed; 0 vulnerabilities reported.
- `npm test`: passed — 6 Vitest assertions plus 6 Playwright scenarios, on
  Chromium desktop and 390×844 mobile.
- `npm run build`: passed (`tsc --noEmit && vite build`); output is `dist/`.
  There is no separate lint script in `package.json`.
- `npm audit --omit=dev`: 0 production vulnerabilities.
- Build budget evidence: initial JS 36,482 bytes (12.37 KB gzip), CSS 11,405
  bytes (3.29 KB gzip), and hero WebP 53,976 bytes — all within the stated
  200KB/50KB/300KB budgets.

Independent mobile Lighthouse against the live URL: Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; LCP 1,509ms, CLS
0, total blocking time 69ms, total transfer 82,736 bytes.

## Functional evidence

Independently exercised a normal four-row CSV with an amount, a date, a matched
reference key, a duplicate source key, and a non-reference key:

- Trim, number, and date transforms produced `Alice`, `1200`, and
  `2026-08-14` deterministically.
- Before a comparison file the decisions were create/skip/skip/create. After a
  one-row exact-key comparison file they were match/skip/skip/create.
- Duplicate keys were held as skip with an explicit warning; a reviewer override
  was retained in the ledger as `Reviewer set create`.
- The destination CSV contained the match, reviewer-approved duplicate, and
  create rows; ledger CSV included every source row plus source/output
  fingerprints and decision/reason; HTML report and project JSON downloaded.
- Invalid CSV with a blank header showed “Every column needs a header. Fill in
  blank header cells first.” Loading the sample afterwards recovered normally.
  An invalid comparison file showed “The comparison file needs a “Account ID”
  column.”

## Accessibility and responsive evidence

- Axe WCAG 2 A/AA: no serious or critical findings on `/`, `/privacy/`, and
  `/terms/` at desktop and 390×844.
- Each tested page has one `main` and one `h1`; the live HTML declares `lang=en`.
- Keyboard Tab reaches the skip link first with a 3px `rgb(163, 42, 30)` focus
  outline. Tab/Enter can activate the sample on desktop and mobile, subject to
  the focus-loss finding above.
- At 390px `documentElement.scrollWidth === innerWidth` (390); no whole-page
  horizontal overflow. Reduced-motion context reports `scroll-behavior: auto`
  and effectively zero animation duration (`0.00001s`).
- The measured link-target failure is recorded as a Medium defect above.

## PWA, privacy, and network evidence

- Live mobile installation registered and controlled `/sw.js`; caches were
  `ledger-v2-shell` and `ledger-v2-assets`.
- After loading the sample, setting the context offline, and reloading, the live
  app displayed “Offline · local work continues” and retained the five source
  rows. No console/page errors occurred.
- Cold normal-use request capture contained only same-origin HTML, JS, CSS,
  image, and service-worker precache requests. No analytics, CDN, or CSV upload
  request was observed. Source inspection confirms the only external runtime
  call is the optional Sociobot license verification endpoint; checkout is a
  user-activated link. Privacy/legal pages exist and state the local-first
  behavior.
- The optional product verification API was burst-tested with 40 invalid-token
  GETs: 30 returned 200 and 10 returned 429 with `Retry-After: 4`. A follow-up
  rolling-window check also returned 429 with `Retry-After: 1`. Rate limiting is
  therefore present at roughly 30 requests per active window.
- Response policies observed: HSTS, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin` are present. No CSP,
  `X-Frame-Options`, or `Permissions-Policy` header was served. The manifest is
  served as `application/octet-stream`; Chromium nevertheless installed the
  PWA successfully.

## Deployment identity

The local production build byte-matched the live deployment (SHA-256) for `/`,
`/assets/app-CQ0i2A-A.js`, `/assets/app-BMSTd4Jq.css`, `/sw.js`,
`/manifest.webmanifest`, `/offline.html`, `/privacy/`, and `/terms/`.
Therefore the findings apply to the requested candidate commit and not an
unrelated deployment.
