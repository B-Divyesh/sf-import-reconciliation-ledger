# Import Reconciliation Ledger

Import Reconciliation Ledger is a private CSV review tool for operations and finance admins. It helps them account for each transformed, matched, skipped, and created row before an upload.

Live: <https://import-reconciliation-ledger.sociobot.in>

## What it does

- [Accounts for every sample row and flags blank or duplicate keys for review.](.factory/claims.json)
- [Exports reviewed create and match rows as CSV without a Pro license.](.factory/claims.json)
- [Exports a review report with every source row, decision, and fingerprint pair.](.factory/claims.json)
- [Keeps demo work isolated from saved imports and works offline after the first visit.](.factory/claims.json)
- [Keeps CSV data on the device during normal use.](.factory/claims.json)

The supported input is UTF-8, comma-delimited CSV with one header row. The app offers explicit rename, trim, case, exact-replace, date, and number rules; exact-key comparison; row counts; optional control totals; destination CSV; ledger CSV; checksum-named HTML report; and project JSON export.

It does not write to business systems, guess mappings, or certify accounting correctness.

## Try the demo

Open <https://import-reconciliation-ledger.sociobot.in/?demo=1> or select **Try it with sample data**. The five-row sample shows a match, two duplicate keys, a blank key, and a create. Its IndexedDB database is separate from real work. **Reset demo** restores the sample; **Start for real** discards it and returns to real data. Details are in [`.factory/demo.md`](.factory/demo.md).

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm test` runs Vitest plus Playwright desktop/mobile, accessibility, export, demo-isolation, and offline checks. Each public claim has an independently runnable command in [`.factory/claims.json`](.factory/claims.json). The production build lands in `dist/`, with `dist/index.html` at its root. `staticwebapp.config.json` is copied into `dist/` with immutable cache rules for hashed assets, the manifest media type, hardening headers, navigation fallback, and the designed 404 page.

## Privacy and paid tier

CSV/project data stays in browser IndexedDB; there is no analytics or telemetry. Users should still use an encrypted, access-controlled device for sensitive records. Free use includes reconciliation and every export. Optional Pro is a $19 one-time license for a local multi-project archive and reusable notes, verified only through the Sociobot billing API. No product ID or payment provider is embedded. Billing registration is a factory dependency; unavailable licensing does not limit the free core.

See [the researched brief](.factory/brief.json), [visual system](.factory/design.md), [privacy notice](privacy/index.html), and [terms](terms/index.html).

## License

MIT. Generated artwork provenance is documented in `.factory/design.md` and `assets/src/ledger-proof.json`.
