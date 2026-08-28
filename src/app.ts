import './styles.css';
import { parseCsv, toCsv } from './csv';
import { buildLedger, fingerprint, totals } from './reconcile';
import { deleteProject, listProjects, loadProject, saveProject } from './storage';
import { acceptReturnedLicense, checkoutUrl, restoreLicense, storedLicense, verifyLicense } from './license';
import type { Decision, Project, TransformKind } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;

const sampleCsv = `Account ID,Customer,Amount,Start date
AC-101, Northwind Ltd ,1200.00,8/14/2026
AC-102,Paper Street Co,875.50,2026-08-15
AC-102,Paper Street Duplicate,875.50,2026-08-15
,Missing Key,46.00,2026-08-16
AC-104,FIELD & STONE,"1,240.00",2026-08-17`;

let project = freshProject();
let saveTimer = 0;
let toastTimer = 0;
let busy = false;
let archivedProjects: Project[] = [];

function freshProject(): Project {
  const now = new Date().toISOString();
  return {
    id: 'current', name: 'Untitled import', createdAt: now, updatedAt: now,
    sourceName: '', sourceHeaders: [], sourceRows: [], referenceName: '', referenceRows: [],
    mappings: [], keyField: '', amountField: '', ledger: [], stage: 0, reportNote: ''
  };
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function setBusy(value: boolean): void {
  busy = value;
  document.documentElement.toggleAttribute('data-busy', value);
  const apply = document.querySelector<HTMLButtonElement>('[data-action="apply-rules"]');
  if (apply) { apply.disabled = value; apply.textContent = value ? 'Fingerprinting rows…' : 'Apply rules & reconcile'; }
}

function notify(message: string, action?: string): void {
  window.clearTimeout(toastTimer);
  document.querySelector('.toast')?.remove();
  const element = document.createElement('div');
  element.className = 'toast';
  element.setAttribute('role', 'status');
  element.innerHTML = `${escapeHtml(message)}${action ? ` <button type="button" data-toast-action>${escapeHtml(action)}</button>` : ''}`;
  document.body.append(element);
  if (!action) toastTimer = window.setTimeout(() => element.remove(), 4200);
}

async function persist(showFeedback = false): Promise<void> {
  project.updatedAt = new Date().toISOString();
  await saveProject(project);
  localStorage.setItem('ledger:last-project', project.id);
  const live = document.querySelector('#save-status');
  if (live) live.textContent = 'Saved on this device';
  if (showFeedback) notify('Project saved on this device.');
}

function queueSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void persist(), 350);
}

async function recalculate(keepDecisions = true): Promise<void> {
  const previous = new Map(project.ledger.map((row) => [row.sourceFingerprint, row.decision]));
  project.ledger = await buildLedger(project);
  if (keepDecisions) {
    project.ledger.forEach((row) => {
      const decision = previous.get(row.sourceFingerprint);
      if (decision) row.decision = decision;
    });
  }
  queueSave();
}

function header(): string {
  return `<a class="skip-link" href="#main">Skip to workspace</a>
    <header class="site-header">
      <div class="utility-line">
        <span class="status-dot ${navigator.onLine ? '' : 'offline'}" id="network-status">${navigator.onLine ? 'Private · device only' : 'Offline · local work continues'}</span>
        <nav aria-label="Utility"><a href="/privacy/">Privacy</a><button class="button--quiet" type="button" data-action="new-project">New project</button></nav>
      </div>
      <div class="masthead"><h1>Import Reconciliation Ledger</h1><p>Issue 001<br>Account for every row<br>No uploads. No guessing.</p></div>
    </header>
    <nav class="stage-nav" aria-label="Import stages">
      ${['Source', 'Rules', 'Reconcile', 'Export'].map((label, index) => `<button type="button" class="stage-tab" data-stage="${index}" ${project.stage === index ? 'aria-current="step"' : ''} ${index > 0 && !project.sourceRows.length ? 'disabled' : ''}><span>0${index + 1}</span>${label}</button>`).join('')}
    </nav>`;
}

function footer(): string {
  return `<footer class="site-footer"><div class="footer-inner">
    <p><strong>Import Reconciliation Ledger</strong><br>Files stay in this browser. Generated hero imagery is original AI-assisted artwork, commissioned for this product. This tool supports review; it does not certify accounting correctness.</p>
    <nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-import-reconciliation-ledger">Source code</a></nav>
    <p>CSV scope: UTF-8, comma-delimited, one header row, quoted fields supported. Dates and numbers use deterministic browser rules.</p>
  </div></footer>`;
}

function deskNote(): string {
  const counts = project.ledger.reduce((all, row) => ({ ...all, [row.decision]: all[row.decision] + 1 }), { create: 0, match: 0, skip: 0 });
  const license = storedLicense();
  return `<aside class="desk-note" aria-label="Desk note">
    <p class="kicker">Desk note</p><h2>${escapeHtml(project.name)}</h2>
    <p id="save-status">${project.sourceRows.length ? 'Saved on this device' : 'Not yet started'}</p>
    <dl>
      <div><dt>Source rows</dt><dd>${project.sourceRows.length}</dd></div>
      <div><dt>Proposed creates</dt><dd>${counts.create}</dd></div>
      <div><dt>Matches</dt><dd>${counts.match}</dd></div>
      <div><dt>Skipped</dt><dd>${counts.skip}</dd></div>
      <div><dt>Accounted</dt><dd>${project.ledger.length}/${project.sourceRows.length}</dd></div>
    </dl>
    <div class="actions"><button type="button" data-action="save-now">Save project</button><button type="button" class="button--danger" data-action="erase-project">Erase project</button></div>
    <div class="license-box">
      <p class="kicker">${license.valid ? 'Pro unlocked' : 'Optional Pro desk'}</p>
      <p>${license.valid ? 'Project archive and reusable desk notes are active.' : 'One-time $19. Unlock a multi-project archive and reusable report notes. Reconciliation and every export stay free.'}</p>
      ${license.valid ? `<button type="button" data-action="archive-project">Archive this edition</button>${archivedProjects.filter((item) => item.id !== project.id).slice(0, 5).map((item) => `<button class="button--quiet" type="button" data-open-project="${escapeHtml(item.id)}">Open · ${escapeHtml(item.name)}</button>`).join('')}` : `<a class="button button--primary" href="${checkoutUrl}">Buy Pro once</a><details><summary>Have a license?</summary><form data-license-form><label class="field">Paste license<input name="license" autocomplete="off" required></label><button type="submit">Verify license</button></form></details>`}
    </div>
  </aside>`;
}

function sourceStage(): string {
  return `<div><p class="kicker">01 / Source matter</p><h2 class="stage-heading">Bring the rows to the desk.</h2>
    <p class="deck">Choose a UTF-8, comma-delimited CSV. It is read inside this browser and never sent to us.</p>
    <div class="field-row"><label class="field">Project name<input id="project-name" value="${escapeHtml(project.name)}" maxlength="80"></label>
      <label class="field">Import a project JSON<input id="project-import" type="file" accept="application/json,.json"><small>Restores a ledger you exported earlier.</small></label></div>
    <div class="upload-grid">
      <div class="upload-panel"><label for="source-file"><span class="kicker">Primary evidence</span><strong>${project.sourceName ? escapeHtml(project.sourceName) : 'Choose source CSV'}</strong><small>${project.sourceRows.length ? `${project.sourceRows.length} rows · ${project.sourceHeaders.length} columns loaded` : 'Quoted commas and line breaks are supported. Maximum recommended size: 25,000 rows.'}</small></label><input id="source-file" type="file" accept="text/csv,.csv"></div>
      <figure class="hero-image"><img src="/assets/ledger-proof.webp" width="960" height="640" alt="Layered ledger sheets, registration marks, and a red proofing pencil on warm newsprint" fetchpriority="high"><figcaption>Every source row leaves a mark.</figcaption></figure>
    </div>
    <div class="sample-line"><span>Need a harmless trial?</span><button type="button" data-action="load-sample">Load five-row sample</button><span>or</span><button type="button" data-action="paste-csv">Paste CSV</button></div>
    ${project.sourceRows.length ? sourcePreview() : ''}
  </div>`;
}

function sourcePreview(): string {
  return `<div class="section-rule"><h3>Source proof</h3><p>First ${Math.min(5, project.sourceRows.length)} of ${project.sourceRows.length} rows</p></div>
    <div class="table-wrap" tabindex="0" aria-label="Source CSV preview"><table><thead><tr><th>Row</th>${project.sourceHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>
    ${project.sourceRows.slice(0, 5).map((row, index) => `<tr><td>${index + 1}</td>${project.sourceHeaders.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="actions"><button type="button" class="button--primary" data-action="next">Set mapping rules</button></div>`;
}

const transforms: { value: TransformKind; label: string }[] = [
  { value: 'none', label: 'Keep as-is' }, { value: 'trim', label: 'Trim spaces' },
  { value: 'uppercase', label: 'Uppercase' }, { value: 'lowercase', label: 'Lowercase' },
  { value: 'titlecase', label: 'Title case' }, { value: 'replace', label: 'Replace exact text' },
  { value: 'number', label: 'Normalize number' }, { value: 'date', label: 'Date → YYYY-MM-DD' }
];

function rulesStage(): string {
  const targets = project.mappings.filter((rule) => rule.target.trim()).map((rule) => rule.target.trim());
  return `<div><p class="kicker">02 / Rules desk</p><h2 class="stage-heading">Make every change visible.</h2>
    <p class="deck">Rename destination columns and choose one deterministic transform per field. Blank destination names are omitted.</p>
    <div class="mapping-list" aria-label="Column mappings">
      ${project.mappings.map((rule, index) => `<div class="mapping-row" data-map-row="${index}">
        <code>${escapeHtml(rule.source)}</code><span class="arrow" aria-hidden="true">→</span>
        <label class="field"><span class="live-region">Destination for ${escapeHtml(rule.source)}</span><input data-map-target="${index}" value="${escapeHtml(rule.target)}" aria-label="Destination field for ${escapeHtml(rule.source)}"></label>
        <label class="field transform-control"><span class="live-region">Transform for ${escapeHtml(rule.source)}</span><select data-map-transform="${index}" aria-label="Transform for ${escapeHtml(rule.source)}">${transforms.map((item) => `<option value="${item.value}" ${rule.transform === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label>
        <label class="field argument-control"><span class="live-region">Argument for ${escapeHtml(rule.source)}</span><input data-map-argument="${index}" value="${escapeHtml(rule.argument)}" placeholder="old→new" aria-label="Transform argument for ${escapeHtml(rule.source)}" ${rule.transform === 'replace' ? '' : 'disabled'}></label>
      </div>`).join('')}
    </div>
    <div class="section-rule"><h3>Reconciliation anchors</h3><p>Required to propose decisions</p></div>
    <div class="field-row">
      <label class="field">Stable match key<select id="key-field"><option value="">Choose a field</option>${targets.map((field) => `<option ${project.keyField === field ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><small>Blank and duplicate keys are held for review.</small></label>
      <label class="field">Amount field (optional)<select id="amount-field"><option value="">Do not total</option>${targets.map((field) => `<option ${project.amountField === field ? 'selected' : ''}>${escapeHtml(field)}</option>`).join('')}</select><small>Used for before/after evidence only.</small></label>
    </div>
    <div class="actions"><button type="button" data-action="back">Back to source</button><button type="button" class="button--primary" data-action="apply-rules" ${project.keyField ? '' : 'disabled'}>Apply rules & reconcile</button></div>
  </div>`;
}

function reconcileStage(): string {
  const duplicateCount = project.ledger.filter((row) => row.duplicate).length;
  const count = (decision: Decision) => project.ledger.filter((row) => row.decision === decision).length;
  const sums = totals(project.ledger, project.amountField);
  const amountRule = project.mappings.find((rule) => rule.target.trim() === project.amountField);
  const sourceTotal = amountRule ? project.ledger.reduce((sum, row) => sum + (Number((row.source[amountRule.source] ?? '').replace(/[^0-9+.\-]/g, '')) || 0), 0) : 0;
  const mappedFields = project.mappings.filter((rule) => rule.target.trim()).map((rule) => rule.target.trim());
  return `<div><p class="kicker">03 / Reconciliation desk</p><h2 class="stage-heading">Account for the full edition.</h2>
    <p class="deck">Compare against an optional existing-records CSV, inspect conflicts, and make the final decision for each source row.</p>
    <div class="field-row">
      <label class="field">Existing records CSV (optional)<input id="reference-file" type="file" accept="text/csv,.csv"><small>${project.referenceName ? `${escapeHtml(project.referenceName)} · ${project.referenceRows.length} comparison rows` : `Must contain a “${escapeHtml(project.keyField)}” column. Exact-key matches only.`}</small></label>
      <label class="field">Show rows<select id="row-filter"><option value="all">All source rows</option><option value="attention">Needs attention</option><option value="create">Create</option><option value="match">Match</option><option value="skip">Skip</option></select></label>
    </div>
    <div class="metric-strip" aria-label="Reconciliation totals">
      <div class="metric"><strong>${project.ledger.length}</strong><span>Source rows</span></div><div class="metric"><strong>${count('create')}</strong><span>Create</span></div><div class="metric"><strong>${count('match')}</strong><span>Match</span></div><div class="metric"><strong>${count('skip')}</strong><span>Skip</span></div>
    </div>
    ${project.amountField ? `<p class="proof-warning"><strong>${escapeHtml(project.amountField)}: source ${formatNumber(sourceTotal)} → transformed ${formatNumber(sums.all)}</strong>Create ${formatNumber(sums.create)} · Match ${formatNumber(sums.match)} · Skip ${formatNumber(sums.skip)}</p>` : ''}
    ${duplicateCount ? `<p class="proof-warning"><strong>${duplicateCount} rows share a source key.</strong>They default to skip. Review them individually; this is the pattern that import previews can silently merge.</p>` : `<p class="success-note"><strong>No duplicate source keys found.</strong>Every row still needs a recorded decision below.</p>`}
    ${project.ledger.length ? ledgerTable(mappedFields) : `<div class="empty-ledger"><strong>No ledger rows yet.</strong><p>Return to Rules and select a stable match key.</p></div>`}
    <div class="actions"><button type="button" data-action="back">Back to rules</button><button type="button" class="button--primary" data-action="next">Review export</button></div>
  </div>`;
}

function ledgerTable(mappedFields: string[]): string {
  const visibleFields = mappedFields.slice(0, 3);
  return `<div class="table-wrap" tabindex="0" aria-label="Row reconciliation ledger"><table id="ledger-table"><thead><tr><th>Row / fingerprint</th><th>Decision</th><th>Evidence</th>${visibleFields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}</tr></thead><tbody>
  ${project.ledger.map((row) => `<tr data-decision="${row.decision}" data-attention="${row.duplicate || row.decision === 'skip'}" class="${row.duplicate ? 'is-duplicate' : ''}">
    <td><strong>#${row.index + 1}</strong><br><span class="fingerprint" title="Source fingerprint">S ${row.sourceFingerprint}</span><br><span class="fingerprint" title="Output fingerprint">O ${row.outputFingerprint}</span></td>
    <td><label><span class="live-region">Decision for row ${row.index + 1}</span><select class="decision-select" data-decision-index="${row.index}"><option value="create" ${row.decision === 'create' ? 'selected' : ''}>Create</option><option value="match" ${row.decision === 'match' ? 'selected' : ''}>Match</option><option value="skip" ${row.decision === 'skip' ? 'selected' : ''}>Skip</option></select></label><span class="reason">${escapeHtml(row.reason)}</span></td>
    <td>${row.duplicate ? '<span class="decision decision--skip">Duplicate key</span>' : row.changedFields.length ? `<span class="decision decision--match">${row.changedFields.length} changed</span>` : '<span class="decision decision--create">Unchanged</span>'}</td>
    ${visibleFields.map((field) => `<td class="${row.changedFields.includes(field) ? 'changed' : ''}">${escapeHtml(row.transformed[field])}${row.changedFields.includes(field) ? '<span class="live-region">Changed by rule</span>' : ''}</td>`).join('')}
  </tr>`).join('')}</tbody></table></div>`;
}

function exportStage(): string {
  const counts = { create: 0, match: 0, skip: 0 };
  project.ledger.forEach((row) => { counts[row.decision] += 1; });
  const unresolved = project.ledger.length !== project.sourceRows.length;
  return `<div><p class="kicker">04 / Final edition</p><h2 class="stage-heading">Freeze the audit trail.</h2>
    <p class="deck">The destination file contains create and match rows. The review report contains every source row, both fingerprints, changed fields, decisions, and a report checksum.</p>
    ${unresolved ? '<p class="proof-warning"><strong>The ledger is incomplete.</strong>Return to reconciliation before exporting.</p>' : `<p class="success-note"><strong>100% accounted for.</strong>${project.sourceRows.length} source rows resolve to ${counts.create} create, ${counts.match} match, and ${counts.skip} skip decisions.</p>`}
    <div class="metric-strip"><div class="metric"><strong>${project.sourceRows.length}</strong><span>Source</span></div><div class="metric"><strong>${counts.create}</strong><span>Create</span></div><div class="metric"><strong>${counts.match}</strong><span>Match</span></div><div class="metric"><strong>${counts.skip}</strong><span>Skip</span></div></div>
    <div class="field"><label for="report-note">Reviewer note</label><textarea id="report-note" maxlength="600" placeholder="Scope, approvals, or exceptions for this edition">${escapeHtml(project.reportNote)}</textarea><small>Included in the report. Reusable saved notes are part of optional Pro; this note and all exports are free.</small></div>
    <div class="section-rule"><h3>Files on the desk</h3><p>Nothing is uploaded</p></div>
    <div class="actions"><button type="button" class="button--primary" data-action="export-csv">Export destination CSV</button><button type="button" data-action="export-report">Export immutable report</button><button type="button" data-action="export-ledger">Export ledger CSV</button><button type="button" data-action="export-project">Export project JSON</button></div>
    <div class="section-rule"><h3>Before the real import</h3></div><ol><li>Review every duplicate-key and skip decision in the report.</li><li>Compare destination totals with an independent source control.</li><li>Upload the destination CSV to the target system’s preview.</li><li>Compare its proposed changes to this frozen report before committing.</li></ol>
    <div class="actions"><button type="button" data-action="back">Back to reconciliation</button></div>
  </div>`;
}

function renderApp(): void {
  const stage = [sourceStage, rulesStage, reconcileStage, exportStage][project.stage]();
  app.innerHTML = `${header()}<main id="main" tabindex="-1"><div class="work-grid">${stage}${deskNote()}</div></main>${footer()}<div class="live-region" aria-live="polite" id="announcer"></div>`;
  bindEvents();
}

function legalPage(kind: 'privacy' | 'terms'): void {
  const privacy = `<p class="kicker">Effective 28 August 2026</p><h1>Privacy, in plain ink.</h1><p>Import Reconciliation Ledger is local-first. CSV contents, mapping rules, row decisions, fingerprints, and project names are processed in your browser and stored in this browser’s IndexedDB. We do not receive them.</p>
    <h2>What leaves your device</h2><p>Nothing during normal free use. There is no analytics, advertising, telemetry, or third-party runtime script. If you buy or verify Pro, your browser contacts Sociobot’s billing API with the license token. Payment is handled on Sociobot’s hosted checkout; this app never sees card details.</p>
    <h2>Your controls</h2><p>Use “Export project JSON” to take a copy. Use “New project” to replace the current workspace. Browser site-data controls can permanently erase all saved projects and licenses. Project data is not encrypted by the app; use an encrypted, access-controlled device for sensitive records.</p>
    <h2>Retention and contact</h2><p>We retain no CSV data because it is never uploaded. The merchant of record retains purchase records under its own legal obligations. Privacy questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>`;
  const terms = `<p class="kicker">Effective 28 August 2026</p><h1>Terms of use.</h1><p>Import Reconciliation Ledger is a deterministic preparation and review utility. It does not connect to destination systems, perform an import, or certify accounting, tax, payroll, or regulatory correctness.</p>
    <h2>Your responsibility</h2><p>You are responsible for verifying mapping rules, row decisions, control totals, and the destination system’s own preview before committing an import. Keep backups of source files and exported reports.</p>
    <h2>Free and Pro use</h2><p>The free workspace includes reconciliation and all data exports. Pro is a one-time $19 license that adds the local multi-project archive and reusable report notes. Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license automatically. Accessibility, safety warnings, and exports are never paywalled.</p>
    <h2>Warranty and liability</h2><p>The software is provided “as is,” without warranties. To the extent allowed by law, the authors are not liable for imported, changed, merged, skipped, or lost data. These terms are governed by applicable law where the merchant of record operates.</p>`;
  app.innerHTML = `<a class="skip-link" href="#main">Skip to content</a><main id="main" class="legal"><a href="/">← Return to ledger</a>${kind === 'privacy' ? privacy : terms}</main>${footer()}`;
}

async function loadCsvFile(file: File, asReference = false): Promise<void> {
  if (file.size > 20 * 1024 * 1024) throw new Error('That file is over 20 MB. Split it into smaller batches first.');
  const parsed = parseCsv(await file.text());
  if (asReference) {
    if (!parsed.headers.includes(project.keyField)) throw new Error(`The comparison file needs a “${project.keyField}” column.`);
    project.referenceName = file.name;
    project.referenceRows = parsed.rows;
    await recalculate(false);
    renderApp();
    notify(`${parsed.rows.length} comparison rows applied.`);
  } else {
    project.sourceName = file.name;
    project.sourceHeaders = parsed.headers;
    project.sourceRows = parsed.rows;
    project.mappings = parsed.headers.map((source) => ({ source, target: source, transform: 'none', argument: '' }));
    project.keyField = '';
    project.amountField = '';
    project.referenceName = '';
    project.referenceRows = [];
    project.ledger = [];
    await persist();
    renderApp();
    notify(`${parsed.rows.length} source rows loaded locally.`);
  }
}

async function applyRules(): Promise<void> {
  if (!project.keyField) return notify('Choose a stable match key first.');
  if (project.mappings.filter((rule) => rule.target.trim()).length === 0) return notify('Keep at least one destination field.');
  setBusy(true);
  await recalculate(false);
  setBusy(false);
  project.stage = 2;
  await persist();
  renderApp();
  document.querySelector<HTMLElement>('#main')?.focus();
}

function download(name: string, body: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileStem(): string {
  return (project.name || 'import').toLocaleLowerCase('en-US').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'import';
}

function exportDestination(): void {
  const headers = project.mappings.filter((rule) => rule.target.trim()).map((rule) => rule.target.trim());
  const rows = project.ledger.filter((row) => row.decision !== 'skip').map((row) => row.transformed);
  download(`${fileStem()}-destination.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8');
  notify(`${rows.length} destination rows exported.`);
}

function exportLedgerCsv(): void {
  const headers = ['source_row', 'decision', 'reason', 'source_fingerprint', 'output_fingerprint', 'changed_fields'];
  const rows = project.ledger.map((row) => ({ source_row: String(row.index + 1), decision: row.decision, reason: row.reason, source_fingerprint: row.sourceFingerprint, output_fingerprint: row.outputFingerprint, changed_fields: row.changedFields.join('|') }));
  download(`${fileStem()}-ledger.csv`, toCsv(headers, rows), 'text/csv;charset=utf-8');
}

async function exportReport(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const checksum = await fingerprint({ project: project.name, generatedAt, ledger: project.ledger.map((row) => `${row.sourceFingerprint}:${row.outputFingerprint}:${row.decision}`).join('|') });
  const fields = project.mappings.filter((rule) => rule.target.trim()).map((rule) => rule.target.trim());
  const report = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(project.name)} — reconciliation report</title><style>body{max-width:1200px;margin:40px auto;padding:0 20px;color:#171714;background:#fbfaf6;font:14px/1.5 ui-monospace,monospace}h1{font:700 52px/.9 Georgia,serif;border-bottom:6px solid}table{width:100%;border-collapse:collapse}th{background:#171714;color:#fff;text-align:left}th,td{padding:8px;border:1px solid #777;vertical-align:top}.skip{background:#f1ddd8}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.meta div{border-top:2px solid;padding:8px 0}@media(max-width:600px){.meta{grid-template-columns:1fr 1fr}.scroll{overflow:auto}}@media print{body{margin:0}}</style></head><body><main><p>IMMUTABLE REVIEW EDITION</p><h1>${escapeHtml(project.name)}</h1><div class="meta"><div>Generated<br><strong>${generatedAt}</strong></div><div>Source<br><strong>${escapeHtml(project.sourceName)}</strong></div><div>Rows<br><strong>${project.sourceRows.length}</strong></div><div>Checksum<br><strong>${checksum}</strong></div></div><h2>Reviewer note</h2><p>${escapeHtml(project.reportNote || 'No note supplied.')}</p><h2>Rules</h2><ul>${project.mappings.filter((rule) => rule.target.trim()).map((rule) => `<li>${escapeHtml(rule.source)} → ${escapeHtml(rule.target)} · ${escapeHtml(rule.transform)} ${escapeHtml(rule.argument)}</li>`).join('')}</ul><h2>Row ledger</h2><div class="scroll"><table><thead><tr><th>Row</th><th>Decision / reason</th><th>Fingerprints</th>${fields.map((field) => `<th>${escapeHtml(field)}</th>`).join('')}</tr></thead><tbody>${project.ledger.map((row) => `<tr class="${row.decision === 'skip' ? 'skip' : ''}"><td>${row.index + 1}</td><td><strong>${row.decision.toUpperCase()}</strong><br>${escapeHtml(row.reason)}</td><td>S ${row.sourceFingerprint}<br>O ${row.outputFingerprint}</td>${fields.map((field) => `<td>${escapeHtml(row.transformed[field])}${row.changedFields.includes(field) ? ' †' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p>† changed by a declared rule. Generated locally by Import Reconciliation Ledger. This report supports review and does not certify accounting correctness.</p></main></body></html>`;
  download(`${fileStem()}-review-${checksum}.html`, report, 'text/html;charset=utf-8');
  notify(`Review report frozen with checksum ${checksum}.`);
}

function bindEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach((button) => button.addEventListener('click', () => {
    project.stage = Number(button.dataset.stage); queueSave(); renderApp(); document.querySelector<HTMLElement>('#main')?.focus();
  }));
  document.querySelector('[data-action="next"]')?.addEventListener('click', () => { project.stage = Math.min(3, project.stage + 1); queueSave(); renderApp(); document.querySelector<HTMLElement>('#main')?.focus(); });
  document.querySelector('[data-action="back"]')?.addEventListener('click', () => { project.stage = Math.max(0, project.stage - 1); queueSave(); renderApp(); document.querySelector<HTMLElement>('#main')?.focus(); });
  document.querySelector('[data-action="save-now"]')?.addEventListener('click', () => void persist(true));
  document.querySelector('[data-action="archive-project"]')?.addEventListener('click', () => {
    project = { ...structuredClone(project), id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    void persist().then(async () => { archivedProjects = await listProjects(); renderApp(); notify('Project edition added to the local archive.'); });
  });
  document.querySelectorAll<HTMLButtonElement>('[data-open-project]').forEach((button) => button.addEventListener('click', () => {
    void loadProject(button.dataset.openProject ?? '').then((saved) => { if (saved) { project = saved; localStorage.setItem('ledger:last-project', saved.id); renderApp(); notify(`Opened ${saved.name}.`); } });
  }));
  document.querySelector('[data-action="erase-project"]')?.addEventListener('click', () => {
    if (!project.sourceRows.length || confirm(`Permanently erase “${project.name}” from this browser? Export it first if you need a copy.`)) {
      const id = project.id;
      void deleteProject(id).then(async () => { project = freshProject(); await persist(); archivedProjects = await listProjects(); renderApp(); notify('Local project erased.'); });
    }
  });
  document.querySelector('[data-action="new-project"]')?.addEventListener('click', () => {
    if (!project.sourceRows.length || confirm(`Start a new project? Export “${project.name}” first unless you archived it with Pro.`)) { project = freshProject(); void persist().then(renderApp); }
  });
  document.querySelector<HTMLInputElement>('#project-name')?.addEventListener('input', (event) => { project.name = (event.target as HTMLInputElement).value; queueSave(); });
  document.querySelector<HTMLInputElement>('#source-file')?.addEventListener('change', (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (file) void loadCsvFile(file).catch((error: Error) => notify(error.message)); });
  document.querySelector<HTMLInputElement>('#reference-file')?.addEventListener('change', (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (file) void loadCsvFile(file, true).catch((error: Error) => notify(error.message)); });
  document.querySelector('[data-action="load-sample"]')?.addEventListener('click', () => void loadCsvFile(new File([sampleCsv], 'sample-import.csv', { type: 'text/csv' })));
  document.querySelector('[data-action="paste-csv"]')?.addEventListener('click', () => { const text = prompt('Paste CSV text. It stays in this browser.'); if (text) void loadCsvFile(new File([text], 'pasted-source.csv', { type: 'text/csv' })).catch((error: Error) => notify(error.message)); });
  document.querySelector<HTMLInputElement>('#project-import')?.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
    void file.text().then((text) => { const restored = JSON.parse(text) as Project; if (!restored.id || !Array.isArray(restored.sourceRows) || !Array.isArray(restored.mappings)) throw new Error('That file is not a ledger project export.'); project = { ...restored, id: 'current', updatedAt: new Date().toISOString() }; return recalculate(); }).then(() => persist()).then(renderApp).catch((error: Error) => notify(error.message));
  });
  document.querySelectorAll<HTMLInputElement>('[data-map-target]').forEach((input) => input.addEventListener('input', () => { project.mappings[Number(input.dataset.mapTarget)].target = input.value; queueSave(); }));
  document.querySelectorAll<HTMLSelectElement>('[data-map-transform]').forEach((select) => select.addEventListener('change', () => { project.mappings[Number(select.dataset.mapTransform)].transform = select.value as TransformKind; renderApp(); queueSave(); }));
  document.querySelectorAll<HTMLInputElement>('[data-map-argument]').forEach((input) => input.addEventListener('input', () => { project.mappings[Number(input.dataset.mapArgument)].argument = input.value; queueSave(); }));
  document.querySelector<HTMLSelectElement>('#key-field')?.addEventListener('change', (event) => { project.keyField = (event.target as HTMLSelectElement).value; renderApp(); queueSave(); });
  document.querySelector<HTMLSelectElement>('#amount-field')?.addEventListener('change', (event) => { project.amountField = (event.target as HTMLSelectElement).value; queueSave(); });
  document.querySelector('[data-action="apply-rules"]')?.addEventListener('click', () => { if (!busy) void applyRules(); });
  document.querySelectorAll<HTMLSelectElement>('[data-decision-index]').forEach((select) => select.addEventListener('change', () => { const row = project.ledger[Number(select.dataset.decisionIndex)]; row.decision = select.value as Decision; row.reason = `Reviewer set ${select.value}`; queueSave(); renderApp(); }));
  document.querySelector<HTMLSelectElement>('#row-filter')?.addEventListener('change', (event) => { const filter = (event.target as HTMLSelectElement).value; document.querySelectorAll<HTMLTableRowElement>('#ledger-table tbody tr').forEach((row) => { row.hidden = filter !== 'all' && (filter === 'attention' ? row.dataset.attention !== 'true' : row.dataset.decision !== filter); }); });
  document.querySelector<HTMLTextAreaElement>('#report-note')?.addEventListener('input', (event) => { project.reportNote = (event.target as HTMLTextAreaElement).value; queueSave(); });
  document.querySelector('[data-action="export-csv"]')?.addEventListener('click', exportDestination);
  document.querySelector('[data-action="export-ledger"]')?.addEventListener('click', exportLedgerCsv);
  document.querySelector('[data-action="export-report"]')?.addEventListener('click', () => void exportReport());
  document.querySelector('[data-action="export-project"]')?.addEventListener('click', () => download(`${fileStem()}-project.json`, JSON.stringify(project, null, 2), 'application/json'));
  document.querySelector<HTMLFormElement>('[data-license-form]')?.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget as HTMLFormElement); restoreLicense(String(data.get('license') ?? '')); notify('License saved. Verifying…'); void verifyLicense(true).then(async (state) => { archivedProjects = state.valid ? await listProjects() : []; renderApp(); notify(state.valid ? 'Pro desk unlocked.' : 'That license could not be verified.'); }); });
}

async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;
  const registration = await navigator.serviceWorker.register('/sw.js');
  if (registration.waiting) notify('A new edition is ready.', 'Update');
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) notify('A new edition is ready.', 'Update'); });
  });
  document.addEventListener('click', (event) => { if ((event.target as HTMLElement).matches('[data-toast-action]')) registration.waiting?.postMessage('SKIP_WAITING'); });
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
  await navigator.serviceWorker.ready;
  const cache = await caches.open('ledger-v2-shell');
  const shellUrls = ['/', ...Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>('script[src], link[rel="stylesheet"]')).map((element) => element instanceof HTMLScriptElement ? element.src : element.href)];
  for (const url of shellUrls) {
    const cacheBusted = new URL(url, location.origin);
    cacheBusted.searchParams.set('offline-precache', 'v2');
    const response = await fetch(cacheBusted, { cache: 'reload' });
    if (response.ok) await cache.put(url, response);
  }
  document.documentElement.dataset.offlineReady = 'true';
}

async function start(): Promise<void> {
  if (location.pathname.startsWith('/privacy')) return legalPage('privacy');
  if (location.pathname.startsWith('/terms')) return legalPage('terms');
  acceptReturnedLicense();
  const lastId = localStorage.getItem('ledger:last-project') ?? 'current';
  try { project = (await loadProject(lastId)) ?? freshProject(); } catch { project = freshProject(); }
  renderApp();
  window.addEventListener('online', () => { renderApp(); notify('Back online. Local work was uninterrupted.'); void verifyLicense().then(() => renderApp()); });
  window.addEventListener('offline', () => { renderApp(); notify('Offline. Local work continues.'); });
  void verifyLicense().then((state) => { if (state.token) renderApp(); });
  void registerServiceWorker().catch(() => { /* offline installation remains optional */ });
  archivedProjects = storedLicense().valid ? await listProjects() : [];
  if (archivedProjects.length > 1) renderApp();
}

void start();
