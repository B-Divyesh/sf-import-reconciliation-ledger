# Verification handoff — candidate `8c271f50f7372accf7a5eae3ede1b728c77da45a`

## FAIL

Independent QA against <https://import-reconciliation-ledger.sociobot.in> on
2026-08-28 failed the release contract.

The release-blocking reason is that `.factory/claims.json` is absent, so the
mandatory demo-entry claim test suite cannot be run. Other defects found:

- **Medium:** 19–20px Privacy/Terms/Source-code link targets at 390px violate
  the required 44×44px touch target.
- **Medium:** live hashed JS/CSS use `cache-control: public, must-revalidate,
  max-age=30`, not immutable long-lived asset caching.
- **Low:** loading the sample by keyboard re-renders to `body`, losing focus.
- **Low:** service-worker install calls `skipWaiting`, preventing a durable
  user-controlled “update available” toast.

Evidence, complete test results, PWA/privacy/rate-limit checks, and the exact
live-to-build identity comparison are in `.factory/verification.md`.

What passed: clean `npm ci`; 12 local test checks; production TypeScript/Vite
build; 390px and desktop normal/error workflow; local exports; live offline
reload; no serious/critical Axe results; mobile Lighthouse 100/100/100/100;
bundle budgets; and live byte-for-byte match to candidate assets. No product
source was modified during verification.

## Required next steps

1. Add the required `.factory/claims.json` and make every listed demo-entry
   claim test pass.
2. Correct the mobile link target sizes and preserve keyboard focus after
   dynamic source loading.
3. Configure immutable cache headers for hashed assets.
4. Change the service-worker update lifecycle so the update prompt can remain
   available until the user accepts it, then rerun independent verification.
