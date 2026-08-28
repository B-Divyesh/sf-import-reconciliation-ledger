# Independent verification — FAIL

**Work order:** `import-reconciliation-ledger-verify-1`  
**Candidate:** `8c271f50f7372accf7a5eae3ede1b728c77da45a` (`8c271f5`)  
**Live URL:** <https://import-reconciliation-ledger.sociobot.in>  
**Verified:** 2026-08-28, from a clean clone, Node/npm install performed with `npm ci`.

## Release decision

**FAIL — do not release this candidate.** The required claims contract is absent, the first screen does not state the intended user in plain words, and mobile Lighthouse performance is below the required threshold. The product’s core local workflow and live deployment otherwise tested well; details below distinguish release blockers from passing evidence.

## Release-blocking defects

### P0 — required claims contract is absent

`.factory/claims.json` does not exist at the candidate commit. The work order explicitly makes a missing file a release-blocking finding and requires its tests to run before all other checks. Consequently there was no claim list or claim test command to execute from the demo entry point.

### P0 — first-read acceptance fails for the specified audience

Fresh cold read of the live screen:

> “Import Reconciliation Ledger”; “Account for every row”; “No uploads. No guessing.”; “Bring the rows to the desk.”; “Choose a UTF-8, comma-delimited CSV. It is read inside this browser and never sent to us.”

It conveys a private CSV tool and offers a clear one-click `Load five-row sample` trial, which works. It does **not** say who it is for (the brief’s operations and finance admins) in plain words, and does not plainly explain the match/skip/transform/reconciliation outcome on that first screen. This fails the work order’s mandatory first-read criterion even though the later workflow is coherent.

### P1 — mobile Lighthouse performance gate fails

Fresh live mobile Lighthouse 13.4.1 run, using the installed Chromium with `--headless --no-sandbox --disable-dev-shm-usage`:

| Category | Score |
| --- | ---: |
| Performance | **83** |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |

LCP was 1,571 ms and CLS 0, but total blocking time was **656 ms** (main-thread work 2.3 s; max potential FID 279 ms). The product contract requires mobile Lighthouse performance of at least 90 and INP below 200 ms. This conflicts with the previous handoff’s reported 99 performance / 0 ms TBT.

## Other defects

### P2 — immutable hashed assets are not served with immutable caching

`/assets/app-CQ0i2A-A.js`, `/assets/app-BMSTd4Jq.css`, and `/sw.js` all return `Cache-Control: public, must-revalidate, max-age=30`. The asset names are content-hashed but are not granted long-lived immutable HTTP caching, contrary to the PWA/performance caching requirement. The service worker does cache them after installation, but cold/repeat online loading unnecessarily revalidates them every 30 seconds.

### P2 — browser hardening headers and manifest media type are incomplete

The live responses have HSTS, `Referrer-Policy`, and `X-Content-Type-Options`, but no `Content-Security-Policy` or `Permissions-Policy`. `/manifest.webmanifest` is served as `application/octet-stream`, rather than a manifest JSON media type. These did not cause a visible runtime failure in Chromium, but are deployment-quality gaps for a local PII-handling PWA.

### P2 — legal footer touch targets are too small at 390 px

Fresh live mobile measurement found the footer `Privacy`, `Terms`, and `Source code` links to be 20.14 CSS px high (their widths were 54.8, 39.1, and 86.1 px). They are interactive controls but do not satisfy the 44×44 px touch-target requirement.

### P2 — default parallel browser test run is flaky

`npm run test:e2e` with the repository’s normal two workers produced **5 passed, 1 failed**: mobile `has no serious accessibility violations on source and legal pages` failed at `page.addScriptTag` with `Execution context was destroyed, most likely because of a navigation`. A serialized `npm test -- --workers=1` run passed all 6 Vitest and all 6 Playwright tests, and independent axe checks were clean. This is a test-race defect rather than evidence of an axe violation, but it means the default quality command is not reliably green.

### P3 — dynamic sample load loses keyboard focus; update prompt cannot be user-controlled

Tabbing to `Load five-row sample` and activating it with Enter correctly loads the data, but the source-stage re-render leaves `document.activeElement` on `body`. Focus should be retained or moved deliberately to the new source proof/action. Separately, the service worker calls `skipWaiting()` in every install while the app only exposes its Update action for `registration.waiting`; a new worker therefore cannot remain waiting for a user-controlled update choice.

## Passing evidence

### Build, deployment identity, and budget

- `npm ci` completed with 0 vulnerabilities reported by npm.
- `npm run build` passed (`tsc --noEmit && vite build`) and created `dist/`.
- Built initial JS: 36,482 bytes (12,370 gzip); CSS: 11,405 bytes (3,290 gzip); hero WebP: 53,976 bytes; no downloaded fonts. These are inside the 200 KB JS, 50 KB CSS, and 300 KB hero budgets.
- The built and live `index.html`, JS, CSS, service worker, manifest, offline page, legal pages, hero image, and all four icons were SHA-256-identical. The live deployment is this candidate, not a stale or divergent deployment.

### End-to-end reconciliation and recovery

On a fresh production build I used the one-click five-row sample, trimmed `Customer`, selected `Account ID` as the match key and `Amount` as the control total, then loaded an existing-records CSV containing only `AC-101`.

- The ledger recorded, respectively: `match` for `AC-101`; `skip` / duplicate for both `AC-102` rows; `skip` / blank key for the missing-key row; and `create` for `AC-104`.
- The displayed totals were 5 source, 1 create, 1 match, 3 skip. The warning explicitly identified two duplicate source-key rows.
- The destination CSV contained only `AC-101` and `AC-104`; the checksum-named HTML review report contained all five rows, decisions, fingerprints, and skip evidence.
- A malformed unterminated quoted CSV was rejected with “A quoted field is not closed. Check the final rows of the CSV.” Existing source data remained available afterward. A comparison CSV without `Account ID` was rejected with an actionable error.

### Accessibility, input, mobile, and privacy

- Direct Playwright + axe-core 4.10.2 checks found zero serious/critical WCAG 2 A/AA violations on `/`, `/privacy/`, and `/terms/`, on desktop and 390×844 mobile. `npx @axe-core/cli` itself could not run because its Selenium launcher could not locate a system Chrome binary; the Playwright axe injection used the pinned installed browser instead.
- `/opt/fleet/lib/verify-url.sh` passed the live page: HTTPS 200, title, `lang=en`, one `<h1>`, `<main>`, image alt text, and no console/page errors. Its simple `innerText` heuristic reported one unlabeled button because `Verify license` is inside a closed `<details>`; Playwright role/name lookup identifies it correctly.
- Keyboard tab order reaches the skip link, privacy/new project, stages, source inputs, and the sample button; actual keyboard focus has a 3 px proof-red `:focus-visible` outline. Enter loads the sample. At 390 px the root page has `scrollWidth === innerWidth === 390`; later wide ledgers intentionally use a focusable horizontal evidence strip.
- Reduced-motion mode computes an animation duration of `0.01ms`; no console/page errors were observed.
- First-load requests stayed on `import-reconciliation-ledger.sociobot.in`; there are no analytics, third-party fonts, or data uploads. Files and project state use browser storage. There is no sign-in flow.

### PWA and billing endpoint

- The live manifest has 192/512 maskable icons, standalone display, versioned `start_url`, and matching theme/background colors.
- On live at 390 px the active service worker controlled the page and had `ledger-v2-shell` and `ledger-v2-assets` caches. After loading the sample, `context.setOffline(true)` plus reload retained the sample and showed `Offline · local work continues`. `registration.update()` completed with an active worker; no new worker was available to exercise the update toast.
- The sole optional outbound product endpoint is Sociobot’s license API. A sequential burst of 40 invalid-license verification requests to `https://api.sociobot.in/api/v1/products/import-reconciliation-ledger/verify` first returned 429 at request **31**; subsequent responses supplied `Retry-After: 2` or `3`. No external payment provider is embedded.

## Commands and reproducibility

```sh
npm ci
npm run build
npm test -- --workers=1
npm run test:e2e              # observed one mobile flaky failure in a parallel run
npm run preview -- --port 4173
VERIFY_NODE_MODULES=/work/repo/node_modules \
  /opt/fleet/lib/verify-url.sh https://import-reconciliation-ledger.sociobot.in /tmp/irl-verify
```

The product code was not modified during verification. Resolve every P0/P1 finding, rerun the claims before other checks, then rerun the full default test suite and Lighthouse before requesting release approval.
