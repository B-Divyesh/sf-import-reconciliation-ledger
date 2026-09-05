# Visual thesis — The Reconciliation Broadsheet

## Direction and rationale

The product is a **monochrome typographic broadsheet**: an evidence desk, not a spreadsheet skin. A wide newspaper masthead, numbered stages, printer's rules, margin annotations, and dense tabular figures make every import feel like an issue assembled for review. The visual metaphor fits the job: source rows arrive as reports, transformations become an editorial record, and the signed export is a frozen edition. Decoration only explains this paper trail.

The treatment is deliberately single-mode. A stable paper/ink palette keeps exported HTML reports and the live workspace visually identical, reduces visual ambiguity during review, and preserves print fidelity. The background is always explicitly painted.

## Tokens

- `paper #F2EFE7`: warm uncoated stock; page background.
- `sheet #FBFAF6`: raised working surface and input background.
- `ink #171714`: primary text and rules (15.8:1 on paper).
- `quiet #5C5A52`: annotations and secondary text (6.1:1 on paper).
- `proof #A32A1E`: proofreader red, primary action and changed/error marks (6.0:1 on paper).
- `proof-dark #7A1E16`: hover/pressed red.
- `green #225A43`: accounted/create confirmation (7.2:1 on paper).
- `amber #735315`: warning/skip state (6.0:1 on paper).
- `rule #A9A397`: secondary rules and input boundaries (3.0:1 UI contrast).
- `veil #E5E0D5`: selected rows, grouped matter, disabled surfaces.

Color is always accompanied by a word, mark, or count. There is no dark mode: the broadsheet is a physical-paper thesis and its fixed treatment is essential to report parity.

## Typography

- Display/editorial: Georgia, Cambria, “Times New Roman”, serif. The familiar news face gives the masthead authority without a downloaded font.
- Working/tabular: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace. Field names, amounts, fingerprints, badges, and controls use tabular figures.
- Scale: 12px folio; 14px annotation; 16px body/control minimum; 20px section; 32px title; clamp(42px, 8vw, 92px) masthead.
- Body leading is 1.55; explanatory copy is capped at 68 characters. Table numbers use `font-variant-numeric: tabular-nums`.

No external fonts or runtime assets are loaded.

## Spacing and composition

An 8px base rhythm with 4px for fine optical corrections. Main gutters are 16px on 390px screens, 32px on tablets, and 48px on desktop. Desktop uses a 12-column editorial grid; the active workbench spans nine columns with a three-column “desk note” rail. Sections are separated by 2px ink rules and whitespace rather than generic cards. Independent source/target panes may use a single bordered sheet.

On phones, comparative tables become horizontally scrollable evidence strips, toolbar actions stack full-width, the desk rail moves beneath the workbench, and nonessential explanatory columns are hidden behind row details. All interactive targets are at least 44px.

## Interaction grammar

- The workflow is a four-part issue: **Source → Rules → Reconcile → Export**. A numbered folio shows the current stage and completion state.
- Primary actions are solid proof red with uppercase mono labels. Secondary actions are paper buttons with ink borders.
- Changed values receive a proofreader underline and a “changed” label; decisions use written create/match/skip badges.
- Every transformation reruns deterministically and refreshes before/after counts. Nothing silently commits.
- Row decisions are selectable from native controls; fingerprints have copy actions. Keyboard users follow document order, with a skip link and a 3px proof-red focus outline.
- Autosave feedback reads “Saved on this device”; offline status reads “Offline · local work continues.”

## Motion policy

Only state continuity moves: stage content fades/settles 8px over 180ms; status notices enter from their physical bottom-right origin over 220ms; changed cells briefly tint over 240ms. No looping animation. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes are instantaneous (opacity may change without delay).

## Original asset plan and provenance

The hero is a generated editorial still-life used only on the empty/source stage: overlapping ledger sheets with row lines, registration marks, and a red proofing pencil, photographed as a high-contrast monochrome print. It communicates raw rows becoming accountable evidence. It contains no legible text, people, brands, UI screenshots, or claims.

**Prompt sheet**

- Subject: top-down still life of layered accounting ledger sheets, punched paper, carbon copy edge, ruler, red proofreader pencil, small check marks and registration crosses.
- World/materials: warm uncoated newsprint, black printer ink, graphite, stamped red marks, subtle paper fibers.
- Light/lens: hard oblique morning light, crisp contact shadows, 50mm editorial product photograph, flat overhead composition.
- Palette words: bone paper, charcoal ink, restrained oxblood red, faded graphite.
- Negative list: no readable text, no letters, no numbers, no logo, no watermark, no human hands, no screens, no gradients, no blue, no glossy plastic, no currency symbols.
- Production command: `/opt/fleet/lib/gen-image.sh <prompt> assets/src/ledger-proof.png 1536x1024 high`
- Model: Azure AI Foundry `factory-image`; generated 2026-08-28. Original commissioned asset for this product.

Hand-authored SVG assets cover the app mark and PWA icons: a folded ledger sheet crossed by a proofing tick. They use only the product tokens, include no third-party marks, and are MIT-licensed with the application.

`public/assets/ledger-social-affb5b2a.webp` is a 1200×630, 41 KB centre crop derived from the reviewed original hero still-life. It is used only for Open Graph and Twitter previews, carries no text, and has the same original-asset provenance.
