# Import Reconciliation Ledger

A private, offline-capable CSV preparation desk for operations and finance admins. It maps source columns, applies visible deterministic transforms, compares stable keys, exposes duplicate-key risks, records a decision for every source row, and exports both the destination CSV and a checksum-named review report.

Live: <https://import-reconciliation-ledger.sociobot.in>

## What it does

- Reads UTF-8, comma-delimited CSV files entirely in the browser (quoted commas, escaped quotes, and quoted line breaks supported).
- Maps and renames fields with explicit trim, case, exact-replace, date, and number transforms.
- Creates stable SHA-256-derived source/output fingerprints.
- Proposes create/match/skip decisions from an exact reference key and holds blank or duplicate source keys for review.
- Computes row counts and an optional numeric control total.
- Exports destination CSV, row ledger CSV, self-contained immutable HTML review report, and restorable project JSON.
- Persists work in IndexedDB and runs offline after the first successful load.

It does **not** upload files, write to Salesforce/Workday/NetSuite, guess mappings, or certify accounting correctness.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm test` runs Vitest unit coverage plus Playwright desktop/mobile, accessibility, export, and offline tests. The production build lands in `dist/`, with `dist/index.html` at its root. Deploy the `dist/` directory as a static site with clean-path support for `/privacy/` and `/terms/`.

## Privacy and paid tier

CSV/project data stays in browser IndexedDB; there is no analytics or telemetry. Users should still use an encrypted, access-controlled device for sensitive records. Free use includes the complete reconciliation workflow and every export. Optional Pro is a $19 one-time license for multi-project archive conveniences and reusable notes, verified only through the Sociobot billing API. No product ID or payment provider is embedded.

See [the researched brief](.factory/brief.json), [visual system](.factory/design.md), [privacy notice](privacy/index.html), and [terms](terms/index.html).

## License

MIT. Generated artwork provenance is documented in `.factory/design.md` and `assets/src/ledger-proof.json`.
