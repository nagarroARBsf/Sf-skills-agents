'use strict';
// Read-only org discovery for the sdlc-discovery-design-agent: a fixed set of metadata queries run
// through the sf CLI and saved as a dated snapshot, a deterministic summary with findings, and an
// org-to-org comparison for merges and harmonization. The agent reasons over these files; it does not
// re-query the org from memory. Node.js standard library only.
//
// Nothing here changes an org. Queries read metadata and aggregate counts only: no record fields, no
// user names or e-mail addresses, no session or token output (so `sf org display` is never called).

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

// name: file name in the snapshot; tooling: Tooling API; domain: summary grouping.
const QUERIES = [
  { name: 'organization', domain: 'org', soql: 'SELECT Id, Name, OrganizationType, IsSandbox, InstanceName, NamespacePrefix, LanguageLocaleKey, DefaultLocaleSidKey, TimeZoneSidKey, DefaultAccountAccess, DefaultContactAccess, DefaultOpportunityAccess, DefaultCaseAccess, DefaultLeadAccess, CreatedDate FROM Organization' },
  { name: 'objects', domain: 'data-model', tooling: true, soql: 'SELECT DurableId, QualifiedApiName, Label, NamespacePrefix, InternalSharingModel, ExternalSharingModel, DeploymentStatus FROM EntityDefinition WHERE IsCustomizable = true' },
  { name: 'customFields', domain: 'data-model', tooling: true, soql: 'SELECT DeveloperName, TableEnumOrId, NamespacePrefix, CreatedDate, LastModifiedDate FROM CustomField' },
  { name: 'recordTypes', domain: 'data-model', soql: 'SELECT SobjectType, DeveloperName, Name, IsActive, NamespacePrefix FROM RecordType' },
  { name: 'validationRules', domain: 'automation', tooling: true, soql: 'SELECT ValidationName, EntityDefinition.QualifiedApiName, Active, NamespacePrefix FROM ValidationRule' },
  { name: 'flows', domain: 'automation', soql: 'SELECT ApiName, Label, ProcessType, TriggerType, TriggerObjectOrEventLabel, IsActive, IsOutOfDate, NamespacePrefix, LastModifiedDate FROM FlowDefinitionView' },
  { name: 'workflowRules', domain: 'automation', tooling: true, soql: 'SELECT Name, TableEnumOrId, NamespacePrefix FROM WorkflowRule' },
  { name: 'apexTriggers', domain: 'code', tooling: true, soql: 'SELECT Name, TableEnumOrId, NamespacePrefix, ApiVersion, Status, UsageIsBulk, UsageBeforeInsert, UsageAfterInsert, UsageBeforeUpdate, UsageAfterUpdate, UsageBeforeDelete, UsageAfterDelete, UsageAfterUndelete FROM ApexTrigger' },
  { name: 'apexClasses', domain: 'code', tooling: true, soql: 'SELECT Name, NamespacePrefix, ApiVersion, Status, IsValid, LengthWithoutComments FROM ApexClass' },
  { name: 'lwc', domain: 'code', tooling: true, soql: 'SELECT DeveloperName, NamespacePrefix, ApiVersion FROM LightningComponentBundle' },
  { name: 'aura', domain: 'code', tooling: true, soql: 'SELECT DeveloperName, NamespacePrefix, ApiVersion FROM AuraDefinitionBundle' },
  { name: 'profiles', domain: 'security', soql: 'SELECT Name, UserType, UserLicense.Name FROM Profile' },
  { name: 'permissionSets', domain: 'security', soql: 'SELECT Name, Label, NamespacePrefix, Type, IsCustom FROM PermissionSet WHERE IsOwnedByProfile = false' },
  { name: 'permissionSetGroups', domain: 'security', soql: 'SELECT DeveloperName, MasterLabel, Status, NamespacePrefix FROM PermissionSetGroup' },
  { name: 'roles', domain: 'security', soql: 'SELECT Id, DeveloperName, Name, ParentRoleId FROM UserRole' },
  { name: 'queues', domain: 'security', soql: "SELECT DeveloperName, Name FROM Group WHERE Type = 'Queue'" },
  { name: 'userLicenses', domain: 'licences', soql: 'SELECT Name, Status, TotalLicenses, UsedLicenses FROM UserLicense' },
  { name: 'permissionSetLicenses', domain: 'licences', soql: 'SELECT DeveloperName, MasterLabel, Status, TotalLicenses, UsedLicenses FROM PermissionSetLicense' },
  { name: 'activeUsersByLicence', domain: 'licences', soql: 'SELECT Profile.UserLicense.Name licence, COUNT(Id) users FROM User WHERE IsActive = true GROUP BY Profile.UserLicense.Name' },
  { name: 'packages', domain: 'packages', tooling: true, soql: 'SELECT SubscriberPackage.Name, SubscriberPackage.NamespacePrefix, SubscriberPackageVersion.MajorVersion, SubscriberPackageVersion.MinorVersion, SubscriberPackageVersion.PatchVersion FROM InstalledSubscriberPackage' },
  { name: 'namedCredentials', domain: 'integration', soql: 'SELECT DeveloperName, MasterLabel, NamespacePrefix FROM NamedCredential' },
  { name: 'remoteSites', domain: 'integration', tooling: true, soql: 'SELECT SiteName, EndpointUrl, IsActive FROM RemoteSiteSetting' },
  { name: 'connectedApps', domain: 'integration', soql: 'SELECT Name FROM ConnectedApplication' },
  { name: 'networks', domain: 'experience', soql: 'SELECT Name, Status, UrlPathPrefix FROM Network' },
  { name: 'reports', domain: 'adoption', soql: 'SELECT COUNT(Id) total FROM Report' },
  { name: 'reportsNotRunInAYear', domain: 'adoption', soql: 'SELECT COUNT(Id) total FROM Report WHERE LastRunDate = null OR LastRunDate < LAST_N_DAYS:365' },
  { name: 'dashboards', domain: 'adoption', soql: 'SELECT COUNT(Id) total FROM Dashboard' },
  { name: 'setupAuditTrail', domain: 'adoption', soql: 'SELECT Action, Section, CreatedDate FROM SetupAuditTrail WHERE CreatedDate = LAST_N_DAYS:180 ORDER BY CreatedDate DESC LIMIT 2000' },
];
// sf commands that are not SOQL. args are appended with `-o <org>`.
const COMMANDS = [
  { name: 'limits', domain: 'limits', args: ['org', 'list', 'limits'] },
  { name: 'recordCounts', domain: 'limits', args: ['org', 'list', 'sobject', 'record-counts'] },
];

const defaultRun = (args) => lib.sfJson(args, { timeout: Number(process.env.SF_SDLC_DISCOVER_TIMEOUT) || 300000 });

function strip(v) {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (k !== 'attributes') o[k] = strip(x);
    return o;
  }
  return v;
}

function errorText(r) {
  const msg = (r.json && (r.json.message || r.json.name)) || r.stderr || (r.error && r.error.message) || `exit ${r.status}`;
  return String(msg).replace(/\s+/g, ' ').slice(0, 300);
}

function safeName(s) { return String(s).replace(/[^\w.-]+/g, '_'); }
function today(d = new Date()) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }

function snapshotDir(root, cfg, alias, date) {
  return path.join(root, cfg.paths.docs, '00-discovery', 'snapshots', `${safeName(alias)}-${date || today()}`);
}

// Runs every query against `target`, writes one JSON file per query and manifest.json. A failing query
// (missing permission, object not in this edition) is recorded and skipped: it is a finding, not a crash.
function snapshot(root, cfg, target, opts = {}) {
  if (!target) throw new Error('no org given: pass --org <role|alias>, or set discovery.orgs or a default org');
  const run = opts.run || defaultRun;
  const org = lib.classifyOrg(target, cfg, root, opts.lookup);
  const dir = opts.output ? path.resolve(root, opts.output) : snapshotDir(root, cfg, target, opts.date);
  fs.mkdirSync(dir, { recursive: true });
  const results = [];
  const write = (name, data) => fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(data, null, 2) + '\n');
  for (const q of QUERIES) {
    const args = ['data', 'query', '--query', q.soql, '-o', target];
    if (q.tooling) args.push('--use-tooling-api');
    const r = run(args);
    if (r.json && r.json.status === 0) {
      const records = strip((r.json.result && r.json.result.records) || []);
      write(q.name, { query: q.soql, tooling: Boolean(q.tooling), totalSize: r.json.result.totalSize, records });
      results.push({ name: q.name, domain: q.domain, ok: true, count: records.length });
    } else results.push({ name: q.name, domain: q.domain, ok: false, error: errorText(r) });
  }
  for (const c of COMMANDS) {
    const r = run([...c.args, '-o', target]);
    if (r.json && r.json.status === 0) {
      const records = strip(r.json.result || []);
      write(c.name, { command: `sf ${c.args.join(' ')}`, records });
      results.push({ name: c.name, domain: c.domain, ok: true, count: Array.isArray(records) ? records.length : 1 });
    } else results.push({ name: c.name, domain: c.domain, ok: false, error: errorText(r) });
  }
  const orgFile = readSnap(dir, 'organization');
  const orgRec = orgFile[0] || {};
  const manifest = {
    snapshot: path.basename(dir), alias: target, orgId: orgRec.Id || null, orgName: orgRec.Name || null,
    orgKind: org.kind, orgKindReason: org.reason, takenAt: (opts.now || new Date()).toISOString(),
    readOnly: true, queries: results,
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return { dir: path.relative(root, dir) || '.', manifest };
}

function readSnap(dir, name) {
  const j = lib.readJson(path.join(dir, `${name}.json`));
  return j && Array.isArray(j.records) ? j.records : [];
}

function countBy(list, fn) {
  const o = {};
  for (const x of list) { const k = fn(x); if (k != null) o[k] = (o[k] || 0) + 1; }
  return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
}

// Object API name for an Id or name found in TableEnumOrId (custom objects are given by Id).
function objectResolver(objects) {
  const byId = new Map(objects.map((o) => [o.DurableId, o.QualifiedApiName]));
  return (v) => byId.get(v) || v;
}

const RETIRED_PROCESS_TYPES = new Set(['Workflow', 'CustomEvent', 'InvocableProcess']); // Process Builder

// Deterministic summary of one snapshot plus findings the agent must look at. Findings are leads with
// evidence, not conclusions.
function summarize(dir) {
  const manifest = lib.readJson(path.join(dir, 'manifest.json'));
  if (!manifest) throw new Error(`${dir} is not a discovery snapshot (no manifest.json)`);
  const g = (n) => readSnap(dir, n);
  const objects = g('objects');
  const objName = objectResolver(objects);
  const unmanaged = (r) => !r.NamespacePrefix;
  const custom = objects.filter((o) => /__c$/.test(o.QualifiedApiName));
  const triggers = g('apexTriggers');
  const flows = g('flows');
  const activeFlows = flows.filter((f) => f.IsActive);
  const classes = g('apexClasses');
  const fields = g('customFields');
  const limits = g('limits');
  const counts = g('recordCounts');
  const findings = [];
  const add = (domain, severity, text, evidence) => findings.push({ domain, severity, text, evidence });

  const triggersPerObject = countBy(triggers.filter((t) => t.Status === 'Active'), (t) => objName(t.TableEnumOrId));
  for (const [o, n] of Object.entries(triggersPerObject)) if (n > 1) add('automation', 'high', `${n} active triggers on ${o} (no single trigger per object; execution order is not guaranteed)`, 'apexTriggers.json');
  const nonBulk = triggers.filter((t) => t.Status === 'Active' && t.UsageIsBulk === false && unmanaged(t));
  if (nonBulk.length) add('code', 'high', `${nonBulk.length} active trigger(s) not marked bulk-safe: ${nonBulk.map((t) => t.Name).slice(0, 10).join(', ')}`, 'apexTriggers.json (UsageIsBulk = false)');
  const pb = activeFlows.filter((f) => RETIRED_PROCESS_TYPES.has(f.ProcessType));
  if (pb.length) add('automation', 'medium', `${pb.length} active Process Builder process(es); Salesforce has retired Process Builder, migrate to Flow`, 'flows.json (ProcessType Workflow)');
  const wf = g('workflowRules');
  if (wf.length) add('automation', 'medium', `${wf.length} Workflow Rule(s) present; Workflow Rules are retired, migrate to Flow (check which are active in Setup)`, 'workflowRules.json');
  const outOfDate = activeFlows.filter((f) => f.IsOutOfDate);
  if (outOfDate.length) add('automation', 'low', `${outOfDate.length} active flow(s) run an older version than the latest`, 'flows.json (IsOutOfDate)');
  const recordFlowsPerObject = countBy(activeFlows.filter((f) => f.ProcessType === 'AutoLaunchedFlow' && f.TriggerType && /Record/i.test(f.TriggerType)), (f) => f.TriggerObjectOrEventLabel);
  for (const [o, n] of Object.entries(recordFlowsPerObject)) {
    const t = triggersPerObject[o] || 0;
    if (n >= 5 || (n && t)) add('automation', 'medium', `${o}: ${n} record-triggered flow(s)${t ? ` and ${t} trigger(s)` : ''}; check order and conflicting field updates`, 'flows.json, apexTriggers.json');
  }
  const oldApi = classes.filter((c) => unmanaged(c) && Number(c.ApiVersion) < 50);
  if (oldApi.length) add('code', 'low', `${oldApi.length} Apex class(es) on API version below 50.0`, 'apexClasses.json');
  const invalid = classes.filter((c) => unmanaged(c) && c.IsValid === false);
  if (invalid.length) add('code', 'medium', `${invalid.length} Apex class(es) marked invalid (need recompilation or are broken)`, 'apexClasses.json (IsValid = false)');
  const fieldsPerObject = countBy(fields, (f) => objName(f.TableEnumOrId));
  for (const [o, n] of Object.entries(fieldsPerObject)) if (n >= 300) add('data-model', 'medium', `${o} has ${n} custom fields; check the edition limit and field usage`, 'customFields.json');
  const publicObjects = objects.filter((o) => /^(ReadWrite|ReadWriteTransfer|FullAccess)$/.test(o.InternalSharingModel || '') && /__c$/.test(o.QualifiedApiName) && unmanaged(o));
  if (publicObjects.length) add('security', 'medium', `${publicObjects.length} custom object(s) with Public Read/Write internal sharing: ${publicObjects.map((o) => o.QualifiedApiName).slice(0, 10).join(', ')}`, 'objects.json (InternalSharingModel)');
  const profiles = g('profiles');
  const psgs = g('permissionSetGroups');
  if (profiles.length > 30 && psgs.length < 5) add('security', 'medium', `${profiles.length} profiles and ${psgs.length} permission set group(s); access is profile-centric, plan the move to permission set groups`, 'profiles.json, permissionSetGroups.json');
  for (const l of Array.isArray(limits) ? limits : []) {
    if (l && l.max > 0 && l.max - l.remaining >= 0.8 * l.max) add('limits', 'high', `${l.name}: ${l.max - l.remaining} of ${l.max} used`, 'limits.json');
  }
  const reports = (g('reports')[0] || {}).total;
  const stale = (g('reportsNotRunInAYear')[0] || {}).total;
  if (reports && stale / reports >= 0.5) add('adoption', 'low', `${stale} of ${reports} reports not run in a year`, 'reportsNotRunInAYear.json');
  const failed = manifest.queries.filter((q) => !q.ok);
  for (const q of failed) add('evidence', 'info', `query "${q.name}" could not run: ${q.error}`, 'manifest.json');

  const roles = g('roles');
  const parent = new Map(roles.map((r) => [r.Id, r.ParentRoleId]));
  let depth = 0;
  for (const r of roles) { let d = 1; let p = r.ParentRoleId; while (p && d < 50) { d++; p = parent.get(p); } depth = Math.max(depth, d); }

  const summary = {
    snapshot: manifest.snapshot, alias: manifest.alias, orgId: manifest.orgId, orgName: manifest.orgName,
    orgKind: manifest.orgKind, takenAt: manifest.takenAt,
    queries: { ok: manifest.queries.filter((q) => q.ok).length, failed: failed.length },
    dataModel: {
      customObjects: custom.length, customObjectsUnmanaged: custom.filter(unmanaged).length,
      customMetadataTypes: objects.filter((o) => /__mdt$/.test(o.QualifiedApiName)).length,
      platformEvents: objects.filter((o) => /__e$/.test(o.QualifiedApiName)).length,
      customFields: fields.length, recordTypes: g('recordTypes').length,
    },
    automation: {
      activeFlowsByType: countBy(activeFlows, (f) => f.ProcessType), inactiveFlows: flows.length - activeFlows.length,
      activeProcessBuilder: pb.length, workflowRules: wf.length,
      activeValidationRules: g('validationRules').filter((v) => v.Active).length,
    },
    code: {
      apexClasses: classes.filter(unmanaged).length, apexTriggers: triggers.filter(unmanaged).length,
      lwc: g('lwc').filter(unmanaged).length, aura: g('aura').filter(unmanaged).length,
    },
    security: {
      profiles: profiles.length, permissionSets: g('permissionSets').filter((p) => p.IsCustom).length,
      permissionSetGroups: psgs.length, roles: roles.length, roleDepth: depth, queues: g('queues').length,
      orgWideDefaults: Object.fromEntries(Object.entries(g('organization')[0] || {}).filter(([k]) => /^Default\w+Access$/.test(k))),
    },
    integration: { namedCredentials: g('namedCredentials').length, remoteSites: g('remoteSites').length, connectedApps: g('connectedApps').length },
    packages: g('packages').map((p) => p.SubscriberPackage || {}).filter((p) => p.Name || p.NamespacePrefix)
      .map((p) => `${p.Name || p.NamespacePrefix} (${p.NamespacePrefix || 'no namespace'})`),
    licences: g('userLicenses').filter((l) => l.TotalLicenses > 0).map((l) => ({ name: l.Name, used: l.UsedLicenses, total: l.TotalLicenses })),
    experienceSites: g('networks').length,
    adoption: {
      reports, reportsNotRunInAYear: stale, dashboards: (g('dashboards')[0] || {}).total,
      setupChangesLast180DaysBySection: Object.fromEntries(Object.entries(countBy(g('setupAuditTrail'), (a) => a.Section)).slice(0, 10)),
    },
    largestObjects: (Array.isArray(counts) ? counts : []).filter((c) => c && c.count > 0).sort((a, b) => b.count - a.count).slice(0, 15),
    findings,
  };
  return summary;
}

// Keyed component lists for comparison. key: stable across orgs; diff: fields that must match.
const COMPARE = {
  objects: { file: 'objects', key: (r) => r.QualifiedApiName, diff: ['InternalSharingModel', 'ExternalSharingModel'] },
  customFields: { file: 'customFields', key: (r, obj) => `${obj(r.TableEnumOrId)}.${r.NamespacePrefix ? r.NamespacePrefix + '__' : ''}${r.DeveloperName}__c` },
  recordTypes: { file: 'recordTypes', key: (r) => `${r.SobjectType}.${r.DeveloperName}`, diff: ['IsActive'] },
  validationRules: { file: 'validationRules', key: (r) => `${(r.EntityDefinition || {}).QualifiedApiName}.${r.ValidationName}`, diff: ['Active'] },
  flows: { file: 'flows', key: (r) => r.ApiName, diff: ['ProcessType', 'TriggerType', 'TriggerObjectOrEventLabel', 'IsActive'] },
  workflowRules: { file: 'workflowRules', key: (r, obj) => `${obj(r.TableEnumOrId)}.${r.Name}` },
  apexTriggers: { file: 'apexTriggers', key: (r) => r.Name, diff: ['TableEnumOrId', 'Status'] },
  apexClasses: { file: 'apexClasses', key: (r) => r.Name, diff: ['Status'] },
  lwc: { file: 'lwc', key: (r) => r.DeveloperName },
  aura: { file: 'aura', key: (r) => r.DeveloperName },
  profiles: { file: 'profiles', key: (r) => r.Name, diff: ['UserType'] },
  permissionSets: { file: 'permissionSets', key: (r) => r.Name, filter: (r) => r.IsCustom },
  permissionSetGroups: { file: 'permissionSetGroups', key: (r) => r.DeveloperName },
  roles: { file: 'roles', key: (r) => r.DeveloperName },
  queues: { file: 'queues', key: (r) => r.DeveloperName },
  packages: { file: 'packages', key: (r) => (r.SubscriberPackage || {}).NamespacePrefix || (r.SubscriberPackage || {}).Name, diff: ['version'], map: (r) => ({ ...r, version: r.SubscriberPackageVersion ? `${r.SubscriberPackageVersion.MajorVersion}.${r.SubscriberPackageVersion.MinorVersion}.${r.SubscriberPackageVersion.PatchVersion}` : '' }) },
  namedCredentials: { file: 'namedCredentials', key: (r) => r.DeveloperName },
  remoteSites: { file: 'remoteSites', key: (r) => r.SiteName, diff: ['EndpointUrl', 'IsActive'] },
  connectedApps: { file: 'connectedApps', key: (r) => r.Name },
};

function keyed(dir, spec) {
  const obj = objectResolver(readSnap(dir, 'objects'));
  const m = new Map();
  for (let r of readSnap(dir, spec.file)) {
    if (spec.filter && !spec.filter(r)) continue;
    if (spec.map) r = spec.map(r);
    m.set(spec.key(r, obj), r);
  }
  return m;
}

// Org-to-org comparison: per component type, what exists only in A, only in B, in both and the same,
// and in both but different. Pairs with the org-comparison template, which adds the decision column.
function compare(dirA, dirB) {
  const ma = lib.readJson(path.join(dirA, 'manifest.json'));
  const mb = lib.readJson(path.join(dirB, 'manifest.json'));
  if (!ma || !mb) throw new Error('both arguments must be discovery snapshot folders (with manifest.json)');
  const types = {};
  for (const [type, spec] of Object.entries(COMPARE)) {
    const a = keyed(dirA, spec);
    const b = keyed(dirB, spec);
    const onlyA = [...a.keys()].filter((k) => !b.has(k)).sort();
    const onlyB = [...b.keys()].filter((k) => !a.has(k)).sort();
    const differs = [];
    let same = 0;
    for (const k of [...a.keys()].filter((x) => b.has(x)).sort()) {
      const d = {};
      for (const f of spec.diff || []) if (String(a.get(k)[f]) !== String(b.get(k)[f])) d[f] = [a.get(k)[f], b.get(k)[f]];
      if (Object.keys(d).length) differs.push({ key: k, fields: d }); else same++;
    }
    types[type] = { onlyA, onlyB, same, differs };
  }
  const oa = readSnap(dirA, 'organization')[0] || {};
  const ob = readSnap(dirB, 'organization')[0] || {};
  const orgWideDefaults = {};
  for (const k of Object.keys({ ...oa, ...ob }).filter((x) => /^Default\w+Access$/.test(x))) {
    if (oa[k] !== ob[k]) orgWideDefaults[k] = [oa[k], ob[k]];
  }
  const side = (m) => ({ snapshot: m.snapshot, alias: m.alias, orgId: m.orgId, orgName: m.orgName, orgKind: m.orgKind, takenAt: m.takenAt });
  return { a: side(ma), b: side(mb), orgWideDefaults, types };
}

module.exports = { QUERIES, COMMANDS, COMPARE, snapshot, snapshotDir, summarize, compare, strip };
