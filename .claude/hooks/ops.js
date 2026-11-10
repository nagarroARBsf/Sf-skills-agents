'use strict';
// Operations shared by the hooks and the CLI: Code Analyzer, source inventory, git delta.

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');

const SF_SOURCE = /\.(cls|trigger|page|component|flow-meta\.xml)$|\/(lwc|aura)\/.+\.(js|ts|html|cmp|app|evt)$/;

function isSalesforceSource(file) {
  const f = file.split(path.sep).join('/');
  return SF_SOURCE.test(f) && !/\/__tests__\//.test(f);
}

// ------------------------------------------------------------------ official Salesforce Code Analyzer

function analyzerAvailable() {
  if (!lib.has('sf')) return { ok: false, reason: 'sf CLI not found on PATH' };
  const r = lib.run('sf', ['code-analyzer', 'run', '--help'], { timeout: 60000 });
  if (r.status !== 0) return { ok: false, reason: "Code Analyzer plugin not installed. Run: sf plugins install code-analyzer" };
  return { ok: true };
}

// Runs `sf code-analyzer run` and returns a normalised result. `targets` are paths relative to root.
function analyze(root, cfg, targets, opts = {}) {
  const avail = analyzerAvailable();
  if (!avail.ok) return { ran: false, reason: avail.reason };
  const threshold = Number(opts.severity || cfg.quality.analyzerSeverityThreshold);
  const selector = opts.ruleSelector || cfg.quality.analyzerRuleSelector || 'Recommended';
  const outFile = path.join(os.tmpdir(), `sf-sdlc-analyzer-${process.pid}-${Date.now()}.json`);
  const args = ['code-analyzer', 'run', '--rule-selector', selector, '--severity-threshold', String(threshold), '--output-file', outFile];
  for (const extra of opts.outputFiles || []) args.push('--output-file', extra);
  for (const cfgName of ['code-analyzer.yml', 'code-analyzer.yaml']) {
    if (fs.existsSync(path.join(root, cfgName))) { args.push('--config-file', cfgName); break; }
  }
  for (const t of targets && targets.length ? targets : ['.']) args.push('--target', t);
  const r = lib.run('sf', args, { cwd: root, timeout: (opts.timeoutMinutes || 15) * 60000 });
  const report = lib.readJson(outFile);
  try { fs.unlinkSync(outFile); } catch { /* already gone */ }
  if (!report) {
    return { ran: false, reason: `Code Analyzer did not produce a report (exit ${r.status}).`, detail: (r.stderr || r.stdout).split('\n').slice(-15).join('\n') };
  }
  const violations = (report.violations || []).map((v) => {
    const loc = (v.locations || [])[v.primaryLocationIndex || 0] || {};
    return { rule: v.rule, engine: v.engine, severity: v.severity, file: loc.file, line: loc.startLine, message: v.message, tags: v.tags };
  }).sort((a, b) => a.severity - b.severity || String(a.file).localeCompare(String(b.file)));
  const blocking = violations.filter((v) => v.severity <= threshold);
  return {
    ran: true, threshold, ruleSelector: selector, command: 'sf ' + args.join(' '),
    counts: report.violationCounts, versions: report.versions,
    violations, blocking, passed: blocking.length === 0,
  };
}

function formatViolations(list, limit = 40) {
  const lines = list.slice(0, limit).map((v) => `  sev${v.severity} ${v.file}:${v.line}  ${v.rule} (${v.engine}) — ${v.message}`);
  if (list.length > limit) lines.push(`  … ${list.length - limit} more`);
  return lines.join('\n');
}

// ------------------------------------------------------------------ git helpers

function stagedFiles(root, includeUnstaged) {
  const a = lib.git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'], root);
  if (a === null) return null;
  const files = new Set(a.split('\n').filter(Boolean));
  if (includeUnstaged) for (const f of (lib.git(['diff', '--name-only', '--diff-filter=ACMR'], root) || '').split('\n')) if (f) files.add(f);
  return [...files];
}

function changedFiles(root, base) {
  if (lib.git(['rev-parse', '--is-inside-work-tree'], root) === null) return null;
  if (lib.git(['rev-parse', '--verify', '--quiet', 'HEAD'], root) === null) {
    // Repository without commits: everything present is new.
    const all = (lib.git(['ls-files', '--cached', '--others', '--exclude-standard'], root) || '').split('\n').filter(Boolean);
    return { base: '(no commits yet)', rows: all.map((file) => ({ status: 'A', file })) };
  }
  const ref = base || mergeBase(root);
  const out = lib.git(['diff', '--name-status', '-M', ref], root);
  if (out === null) return null;
  const rows = out.split('\n').filter(Boolean).map((l) => {
    const p = l.split('\t');
    return { status: p[0][0], file: p[p.length - 1], from: p.length > 2 ? p[1] : undefined };
  });
  for (const f of (lib.git(['ls-files', '--others', '--exclude-standard'], root) || '').split('\n')) if (f) rows.push({ status: 'A', file: f });
  return { base: ref, rows };
}

function mergeBase(root) {
  const cfg = lib.loadConfig(root);
  for (const b of [cfg.git.pullRequestBase, cfg.git.integrationBranch, cfg.git.mainBranch, 'main', 'master']) {
    if (!b) continue;
    for (const ref of [`origin/${b}`, b]) {
      const mb = lib.git(['merge-base', 'HEAD', ref], root);
      if (mb) return mb;
    }
  }
  return 'HEAD';
}

// ------------------------------------------------------------------ metadata component mapping

// Folder name under a package directory -> metadata type. Bundle types are one component per folder.
const TYPES = {
  classes: 'ApexClass', triggers: 'ApexTrigger', pages: 'ApexPage', components: 'ApexComponent',
  lwc: 'LightningComponentBundle', aura: 'AuraDefinitionBundle', flows: 'Flow', objects: 'CustomObject',
  permissionsets: 'PermissionSet', permissionsetgroups: 'PermissionSetGroup', profiles: 'Profile',
  customMetadata: 'CustomMetadata', labels: 'CustomLabels', flexipages: 'FlexiPage', layouts: 'Layout',
  tabs: 'CustomTab', applications: 'CustomApplication', staticresources: 'StaticResource',
  namedCredentials: 'NamedCredential', externalCredentials: 'ExternalCredential', connectedApps: 'ConnectedApp',
  externalClientApps: 'ExternalClientApplication', remoteSiteSettings: 'RemoteSiteSetting',
  platformEventChannels: 'PlatformEventChannel', reports: 'Report', dashboards: 'Dashboard', reportTypes: 'ReportType',
  sharingRules: 'SharingRules', queues: 'Queue', groups: 'Group', roles: 'Role', quickActions: 'QuickAction',
  globalValueSets: 'GlobalValueSet', email: 'EmailTemplate', customPermissions: 'CustomPermission',
  omniScripts: 'OmniScript', omniIntegrationProcedures: 'OmniIntegrationProcedure',
  omniDataTransforms: 'OmniDataTransform', omniUiCard: 'OmniUiCard', bots: 'Bot',
  genAiPlannerBundles: 'GenAiPlannerBundle', genAiPlugins: 'GenAiPlugin', genAiFunctions: 'GenAiFunction',
  genAiPromptTemplates: 'GenAiPromptTemplate', aiAuthoringBundles: 'AiAuthoringBundle',
  digitalExperiences: 'DigitalExperienceBundle', experiences: 'ExperienceBundle', sites: 'CustomSite', networks: 'Network',
  externalServiceRegistrations: 'ExternalServiceRegistration', duplicateRules: 'DuplicateRule', matchingRules: 'MatchingRules',
  assignmentRules: 'AssignmentRules', approvalProcesses: 'ApprovalProcess', workflows: 'Workflow',
  pathAssistants: 'PathAssistant', recordTypes: 'RecordType', cspTrustedSites: 'CspTrustedSite',
};
const OBJECT_CHILDREN = {
  fields: 'CustomField', validationRules: 'ValidationRule', recordTypes: 'RecordType', listViews: 'ListView',
  webLinks: 'WebLink', compactLayouts: 'CompactLayout', businessProcesses: 'BusinessProcess', fieldSets: 'FieldSet',
  indexes: 'Index', sharingReasons: 'SharingReason',
};
const BUNDLES = new Set(['lwc', 'aura', 'digitalExperiences', 'experiences', 'aiAuthoringBundles', 'genAiPlannerBundles', 'staticresources']);

const stripExt = (name) => name.replace(/-meta\.xml$/, '').replace(/\.[^.]+$/, '');

// Map a source file path to { type, apiName } or null when it is not a metadata component.
function componentOf(file, pkgDirs) {
  const f = file.split(path.sep).join('/');
  const dir = pkgDirs.map((d) => d.replace(/\/+$/, '') + '/').find((d) => f.startsWith(d));
  if (!dir) return null;
  const parts = f.slice(dir.length).split('/');
  const i = parts.findIndex((p) => TYPES[p]);
  if (i < 0 || i === parts.length - 1) return null;
  const folder = parts[i];
  const rest = parts.slice(i + 1);
  if (folder === 'objects') {
    const obj = rest[0];
    if (rest.length >= 3 && OBJECT_CHILDREN[rest[1]]) return { type: OBJECT_CHILDREN[rest[1]], apiName: `${obj}.${stripExt(rest[2])}` };
    return { type: 'CustomObject', apiName: obj };
  }
  if (BUNDLES.has(folder)) return { type: TYPES[folder], apiName: folder === 'staticresources' ? stripExt(rest[0]) : rest[0] };
  if (['reports', 'dashboards', 'email', 'documents'].includes(folder)) return { type: TYPES[folder], apiName: rest.map(stripExt).join('/') };
  return { type: TYPES[folder], apiName: stripExt(rest[rest.length - 1]) };
}

function inventory(root, cfg) {
  const pkgDirs = lib.packageDirs(root, cfg);
  const seen = new Map();
  const folders = new Set();
  for (const d of pkgDirs) {
    lib.walk(path.join(root, d), (full, e, isDir) => {
      if (isDir) { folders.add(e.name); return; }
      const c = componentOf(path.relative(root, full), pkgDirs);
      if (c) seen.set(`${c.type}:${c.apiName}`, c);
    });
  }
  const byType = {};
  for (const c of seen.values()) (byType[c.type] = byType[c.type] || []).push(c.apiName);
  for (const t of Object.keys(byType)) byType[t].sort();
  const counts = Object.fromEntries(Object.entries(byType).map(([t, v]) => [t, v.length]).sort());
  return { packageDirectories: pkgDirs, apiVersion: lib.apiVersion(root, cfg), total: seen.size, counts, components: byType, folders: [...folders].sort() };
}

function delta(root, cfg, base) {
  const pkgDirs = lib.packageDirs(root, cfg);
  const ch = changedFiles(root, base);
  if (!ch) return { error: 'not a git repository' };
  const agg = new Map();
  for (const row of ch.rows) {
    const c = componentOf(row.file, pkgDirs);
    if (!c) continue;
    const key = `${c.type}:${c.apiName}`;
    const e = agg.get(key) || { ...c, statuses: [], files: [] };
    e.statuses.push(row.status); e.files.push(row.file);
    agg.set(key, e);
  }
  const bundleTypes = new Set(['LightningComponentBundle', 'AuraDefinitionBundle', 'DigitalExperienceBundle', 'ExperienceBundle', 'AiAuthoringBundle', 'GenAiPlannerBundle']);
  const list = [];
  for (const e of agg.values()) {
    let status = e.statuses.every((s) => s === 'A') ? 'new' : e.statuses.every((s) => s === 'D') ? 'removed' : 'changed';
    if (bundleTypes.has(e.type)) {
      // A bundle is one component: adding or deleting some of its files changes it.
      const dir = path.dirname(path.join(root, e.files[0]));
      let present = 0;
      lib.walk(dir, (full, ent, isDir) => { if (!isDir) present++; });
      if (status === 'removed' && present > 0) status = 'changed';
      if (status === 'new' && present > e.files.length) status = 'changed';
    }
    list.push({ type: e.type, apiName: e.apiName, status, files: e.files });
  }
  list.sort((a, b) => a.type.localeCompare(b.type) || a.apiName.localeCompare(b.apiName));
  const bucket = (s) => list.filter((c) => c.status === s).map(({ type, apiName, files }) => ({ type, apiName, files }));
  return { base: ch.base, new: bucket('new'), changed: bucket('changed'), removed: bucket('removed') };
}

function packageXml(components, apiVersion) {
  const byType = {};
  for (const c of components) (byType[c.type] = byType[c.type] || new Set()).add(c.apiName);
  const types = Object.keys(byType).sort().map((t) =>
    `    <types>\n${[...byType[t]].sort().map((m) => `        <members>${m}</members>`).join('\n')}\n        <name>${t}</name>\n    </types>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Package xmlns="http://soap.sforce.com/2006/04/metadata">\n${types.join('\n')}\n    <version>${apiVersion || '62.0'}</version>\n</Package>\n`;
}

module.exports = {
  isSalesforceSource, analyzerAvailable, analyze, formatViolations,
  stagedFiles, changedFiles, mergeBase, componentOf, inventory, delta, packageXml, TYPES,
};
