# Landing copy audit

Audited 2026-09-06 against every state rendered by `src/app.ts` and every CSV error from `src/csv.ts`. Counts treat a space-separated item as one word. Variable values use braces. No line exceeds 22 words. No line uses a banned plain-words term.

## First screen and demo

| Copy | Words | Result |
| --- | ---: | --- |
| Reconcile CSV imports before you upload | 6 | pass |
| For operations and finance admins, it shows every transformed, matched, skipped, and created CSV row before upload. | 17 | pass |
| Opens a realistic five-row import in a separate demo workspace. | 10 | pass |
| Files stay on this device | 5 | pass |
| Works offline after the first visit | 6 | pass |
| Optional Pro is $19 once; core exports stay free | 9 | pass |
| Review every row before a real import. | 7 | pass |
| Demo — sample data, nothing is saved to your real workspace. | 11 | pass |
| Reset the sample or return to your real workspace. | 9 | pass |

## Source and mapping

| Copy | Words | Result |
| --- | ---: | --- |
| Choose a CSV to review | 5 | pass |
| Choose a UTF-8, comma-delimited CSV with one header row. | 9 | pass |
| It is read inside this browser and never sent to us. | 11 | pass |
| Restores a ledger you exported earlier. | 6 | pass |
| Quoted commas and line breaks are supported. | 7 | pass |
| Reviewable CSV rows become an audit record. | 7 | pass |
| Or paste a small CSV without uploading it. | 8 | pass |
| First {shown} of {total} rows | 5 | pass |
| Show every column change | 4 | pass |
| Rename destination columns and choose one deterministic transform per field. | 10 | pass |
| Blank destination names are omitted. | 5 | pass |
| Required to propose decisions | 4 | pass |
| Blank and duplicate keys are held for review. | 8 | pass |
| Used for before/after evidence only. | 5 | pass |

## Reconciliation and export

| Copy | Words | Result |
| --- | ---: | --- |
| Account for every source row | 5 | pass |
| Compare against an optional existing-records CSV, inspect conflicts, and make the final decision for each source row. | 17 | pass |
| Must contain a “{field}” column. | 5 | pass |
| Exact-key matches only. | 3 | pass |
| {count} rows share a source key. | 6 | pass |
| They default to skip. | 4 | pass |
| Review them individually; this is the pattern that import previews can silently merge. | 13 | pass |
| No duplicate source keys found. | 5 | pass |
| Every row still needs a recorded decision below. | 8 | pass |
| No ledger rows yet. | 4 | pass |
| Return to Rules and select a stable match key. | 9 | pass |
| Export the reviewed import record | 5 | pass |
| The destination file contains create and match rows. | 8 | pass |
| The frozen review report records every source row, both fingerprints, changed fields, and decisions. | 14 | pass |
| The ledger is incomplete. | 4 | pass |
| Return to reconciliation before exporting. | 5 | pass |
| 100% accounted for. | 3 | pass |
| {source} source rows resolve to {create} create, {match} match, and {skip} skip decisions. | 13 | pass |
| This note and every export are free. | 7 | pass |
| Pro can save a note for another project. | 8 | pass |
| Nothing is uploaded | 3 | pass |
| Review every duplicate-key and skip decision in the report. | 9 | pass |
| Compare destination totals with an independent source control. | 8 | pass |
| Upload the destination CSV to the target system’s preview. | 9 | pass |
| Compare its proposed changes to this frozen report before committing. | 10 | pass |

## Project and Pro states

| Copy | Words | Result |
| --- | ---: | --- |
| Local CSV review for operations and finance admins. | 8 | pass |
| This tool supports review; it does not certify accounting correctness. | 10 | pass |
| CSV scope: UTF-8, comma-delimited, one header row, quoted fields supported. | 10 | pass |
| Demo records are isolated from your saved imports. | 8 | pass |
| Start for real when you are ready to use your own CSV. | 12 | pass |
| The local project archive and reusable report notes are active. | 10 | pass |
| One-time $19. | 2 | pass |
| Pro adds a local multi-project archive and reusable report notes. | 10 | pass |
| Reconciliation and every export stay free. | 6 | pass |
| No archived projects yet. | 4 | pass |
| No saved notes yet | 4 | pass |

## Feedback, empty, and error states

| Copy | Words | Result |
| --- | ---: | --- |
| Project saved on this device. | 5 | pass |
| {count} source rows loaded locally. | 5 | pass |
| {count} comparison rows applied. | 4 | pass |
| Choose a stable match key first. | 6 | pass |
| Keep at least one destination field. | 6 | pass |
| {count} destination rows exported. | 4 | pass |
| Frozen review report exported. | 4 | pass |
| Project added to the local archive. | 6 | pass |
| Local project erased. | 3 | pass |
| Name the reusable note first. | 5 | pass |
| Write a reviewer note before saving it. | 7 | pass |
| Saved reusable note “{name}”. | 4 | pass |
| Choose a saved note first. | 5 | pass |
| Used saved note “{name}”. | 4 | pass |
| Reusable note deleted. | 3 | pass |
| License saved. | 2 | pass |
| Verifying… | 1 | pass |
| Pro workspace active. | 3 | pass |
| That license could not be verified. | 6 | pass |
| Back online. | 2 | pass |
| Local work was uninterrupted. | 4 | pass |
| Offline. | 1 | pass |
| Local work continues. | 3 | pass |
| An app update is ready. | 5 | pass |
| That file is over 20 MB. | 6 | pass |
| Split it into smaller batches first. | 6 | pass |
| The comparison file needs a “{field}” column. | 7 | pass |
| The CSV is empty. | 4 | pass |
| Choose a file with a header row. | 7 | pass |
| A quoted field is not closed. | 6 | pass |
| Check the final rows of the CSV. | 7 | pass |
| Every column needs a header. | 5 | pass |
| Fill in blank header cells first. | 6 | pass |
| Column headers must be unique. | 5 | pass |
| Rename duplicate columns first. | 4 | pass |
| Row {number} has more fields than the header. | 8 | pass |
| The CSV has headers but no data rows. | 8 | pass |
| That file is not a ledger project export. | 8 | pass |

## Terminology

| Concept | One term used |
| --- | --- |
| Incoming spreadsheet text file | CSV |
| Persisted user workspace | project |
| Test-only workspace | demo workspace |
| Row outcome | decision |
| Existing-record comparison | reference CSV |
| Downloaded review artifact | frozen review report |
| Paid convenience tier | Pro |
| Cross-project text template | reusable note |

Banned-word scan: no matches for leverage, seamless, effortless, robust, powerful, intuitive, reimagine, supercharge, unlock, delightful, journey, ecosystem, or AI-powered.
