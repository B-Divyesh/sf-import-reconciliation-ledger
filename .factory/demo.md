# Demo sandbox

Open [/?demo=1](https://import-reconciliation-ledger.sociobot.in/?demo=1), or select **Try it with sample data** on the first screen.

The demo loads a five-row customer import: one existing key, two duplicate source keys, one blank key, and one clean create. It is realistic enough to show the reconciliation counts and skip evidence immediately.

Demo projects use the separate IndexedDB database `reconciliation-ledger-demo` and the `demo:ledger:last-project` local-storage key. They never read or write the real `reconciliation-ledger` database. The persistent banner provides **Reset demo** to restore the five rows and **Start for real** to discard demo storage and return to the real workspace.

The demo is available offline after its first successful load, with the same service-worker shell as the real workspace.
