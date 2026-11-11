'use strict';
// Shared library for the sf-sdlc hooks and CLI. Node.js standard library only: this has to run
// on a bare checkout, with no npm install.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const KIT_ROOT = path.resolve(__dirname, '..'); // .claude/ in a project, or the plugin root
const IS_PLUGIN = fs.existsSync(path.join(KIT_ROOT, '.claude-plugin', 'plugin.json'));

const DEFAULTS = {
  project: { name: '', code: '', client: '' },
  salesforce: { apiVersion: 'auto', packageDirectories: 'auto', namespacePrefix: '', componentPrefix: '' },
  orgs: { dev: '', qa: '', uat: '', devHub: '', production: [] },
  git: {
    mainBranch: 'main',
    integrationBranch: 'develop',
    protectedBranches: ['main', 'master', 'release/*'],
    branchPattern: 'feature/{ticket}-{slug}',
    commitPattern: '{ticket}: {summary}',
    pullRequestBase: 'develop',
  },
  jira: {
    enabled: false, site: '', projectKey: '',
    issueTypes: { epic: 'Epic', story: 'Story', bug: 'Bug', task: 'Task' },
    fields: { storyPoints: '', epicLink: '', acceptanceCriteria: '' },
    labels: ['salesforce'],
    transitions: { inProgress: 'In Progress', inReview: 'In Review', readyForQa: 'Ready for QA', done: 'Done' },
  },
  quality: {
    coverageTarget: 85, orgCoverageMinimum: 75,
    analyzerSeverityThreshold: 2, analyzerRuleSelector: 'Recommended', bulkTestSize: 200,
  },
  deploy: {
    pipeline: ['dev', 'qa', 'uat', 'production'],
    testLevel: { dev: 'NoTestRun', qa: 'RunLocalTests', uat: 'RunLocalTests', production: 'RunLocalTests' },
    validateBeforeDeploy: true, allowDirectProductionDeploy: false, useDelta: true, waitMinutes: 60,
  },
  paths: { docs: 'docs/sdlc', specs: 'specs' },
  mcp: { servers: ['metadata-experts', 'metadata-grounding'], org: '' },
  hooks: { mode: 'observe', auditLog: true, strictEvidence: false },
};

function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }

function merge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over || {})) {
    out[k] = isObject(v) && isObject(base[k]) ? merge(base[k], v) : v;
  }
  return out;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function projectDir(cwd) {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  let dir = path.resolve(cwd || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(dir, 'sfdx-project.json')) || fs.existsSync(path.join(dir, '.git')) ||
        fs.existsSync(path.join(dir, '.claude', 'sf-sdlc.json'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return path.resolve(cwd || process.cwd());
    dir = up;
  }
}

function configPaths(root) {
  return {
    shared: path.join(root, '.claude', 'sf-sdlc.json'),
    local: path.join(root, '.claude', 'sf-sdlc.local.json'),
  };
}

function loadConfig(root) {
  const p = configPaths(root);
  const shared = readJson(p.shared);
  const local = readJson(p.local);
  const cfg = merge(merge(DEFAULTS, shared || {}), local || {});
  cfg._exists = Boolean(shared);
  cfg._invalid = fs.existsSync(p.shared) && !shared;
  return cfg;
}

const TEST_LEVELS = ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg', 'RunRelevantTests'];

function validateConfig(cfg) {
  const errors = [];
  const warnings = [];
  if (cfg._invalid) errors.push('.claude/sf-sdlc.json is not valid JSON');
  if (!cfg._exists) warnings.push('.claude/sf-sdlc.json not found; defaults are in use. Run `sf-sdlc init`.');
  if (!Array.isArray(cfg.orgs.production)) errors.push('orgs.production must be an array of org aliases');
  else if (!cfg.orgs.production.length) warnings.push('orgs.production is empty; production is then recognised only by org type');
  if (!['off', 'observe', 'enforce'].includes(cfg.hooks.mode)) errors.push('hooks.mode must be off, observe or enforce');
  for (const [role, level] of Object.entries(cfg.deploy.testLevel || {})) {
    if (!TEST_LEVELS.includes(level)) errors.push(`deploy.testLevel.${role}: unknown test level "${level}"`);
  }
  if (cfg.deploy.testLevel.production === 'NoTestRun') errors.push('deploy.testLevel.production must not be NoTestRun');
  const cov = cfg.quality.coverageTarget;
  if (typeof cov !== 'number' || cov < 75 || cov > 100) errors.push('quality.coverageTarget must be a number from 75 to 100');
  const sev = cfg.quality.analyzerSeverityThreshold;
  if (![1, 2, 3, 4, 5].includes(sev)) errors.push('quality.analyzerSeverityThreshold must be 1 to 5');
  if (cfg.jira.enabled && !cfg.jira.projectKey) errors.push('jira.enabled is true but jira.projectKey is empty');
  if (!cfg.project.code) warnings.push('project.code is empty; document references and epic prefixes will lack it');
  const known = Object.keys(require('./mcp').HOSTED_SERVERS); // lazy: mcp.js requires this file
  if (!Array.isArray(cfg.mcp.servers)) errors.push('mcp.servers must be an array of hosted MCP server names');
  else for (const n of cfg.mcp.servers) if (!known.includes(n)) errors.push(`mcp.servers: unknown server "${n}" (known: ${known.join(', ')})`);
  if (typeof cfg.mcp.org !== 'string') errors.push('mcp.org must be an org role or alias (a string)');
  for (const role of cfg.deploy.pipeline || []) {
    if (role !== 'production' && !cfg.orgs[role]) warnings.push(`orgs.${role} has no alias but "${role}" is in deploy.pipeline`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

function hookMode(cfg) {
  const env = process.env.SF_SDLC_HOOK_MODE || process.env.CLAUDE_PLUGIN_OPTION_HOOK_MODE;
  if (['off', 'observe', 'enforce'].includes(env)) return env;
  return cfg.hooks.mode;
}

// ------------------------------------------------------------------ processes

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8', cwd: opts.cwd, timeout: opts.timeout || 120000,
    maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32',
    env: { ...process.env, SF_AUTOUPDATE_DISABLE: 'true', SF_SKIP_NEW_VERSION_CHECK: 'true', ...(opts.env || {}) },
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

function has(cmd) {
  const r = run(process.platform === 'win32' ? 'where' : 'which', [cmd], { timeout: 10000 });
  return r.status === 0;
}

function sfJson(args, opts) {
  const r = run('sf', [...args, '--json'], opts);
  const i = r.stdout.indexOf('{');
  let json = null;
  if (i >= 0) { try { json = JSON.parse(r.stdout.slice(i)); } catch { /* not JSON */ } }
  return { ...r, json };
}

function git(args, cwd) {
  const r = run('git', args, { cwd, timeout: 30000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

// ------------------------------------------------------------------ state

function stateDir(root) {
  const dir = path.join(root, '.sf-sdlc');
  fs.mkdirSync(dir, { recursive: true });
  // Local state (audit log, org cache, job tracking) must never be committed: the folder ignores itself.
  const ignore = path.join(dir, '.gitignore');
  if (!fs.existsSync(ignore)) { try { fs.writeFileSync(ignore, '*\n'); } catch { /* read-only checkout */ } }
  return dir;
}

function appendJsonl(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(obj) + '\n');
}

// ------------------------------------------------------------------ shell command parsing

// Split a shell command line into simple commands, each a list of words. Quotes are honoured;
// substitutions and redirections are not interpreted (the guards read flags, they do not execute).
function splitCommands(line) {
  const cmds = [];
  let words = [];
  let cur = '';
  let quote = null;
  let started = false;
  const pushWord = () => { if (started) { words.push(cur); } cur = ''; started = false; };
  const pushCmd = () => { pushWord(); if (words.length) cmds.push(words); words = []; };
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < line.length) cur += line[++i];
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; started = true; continue; }
    if (c === '\\' && i + 1 < line.length) { cur += line[++i]; started = true; continue; }
    if (c === ';' || c === '\n' || c === '|' || c === '&' || c === '(' || c === ')') { pushCmd(); continue; }
    if (/\s/.test(c)) { pushWord(); continue; }
    cur += c; started = true;
  }
  pushCmd();
  return cmds;
}

// Words of a simple command with leading VAR=value assignments and wrappers removed.
function stripPrefix(words) {
  const env = {};
  let i = 0;
  for (; i < words.length; i++) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(words[i]);
    if (m) { env[m[1]] = m[2]; continue; }
    if (['sudo', 'command', 'env', 'time', 'npx', 'exec'].includes(words[i])) continue;
    break;
  }
  return { env, words: words.slice(i) };
}

function flagValue(words, names) {
  for (let i = 0; i < words.length; i++) {
    for (const n of names) {
      if (words[i] === n) return words[i + 1];
      if (words[i].startsWith(n + '=')) return words[i].slice(n.length + 1);
    }
  }
  return undefined;
}

// Every `sf`/`sfdx` invocation in a command line: { topic: 'project deploy start', words, env }.
function sfInvocations(line) {
  const out = [];
  for (const raw of splitCommands(line)) {
    const { env, words } = stripPrefix(raw);
    const bin = path.basename(words[0] || '');
    if (bin !== 'sf' && bin !== 'sfdx') continue;
    const topic = [];
    for (const w of words.slice(1)) { if (w.startsWith('-')) break; topic.push(w); }
    out.push({ topic: topic.join(' ').replace(/:/g, ' '), words: words.slice(1), env });
  }
  return out;
}

function gitInvocations(line) {
  const out = [];
  for (const raw of splitCommands(line)) {
    const { words } = stripPrefix(raw);
    if (path.basename(words[0] || '') !== 'git') continue;
    const rest = [];
    for (let i = 1; i < words.length; i++) {
      if (['-C', '-c', '--git-dir', '--work-tree'].includes(words[i])) { i++; continue; }
      rest.push(words[i]);
    }
    const sub = rest.find((w) => !w.startsWith('-'));
    out.push({ sub, words: rest });
  }
  return out;
}

// ------------------------------------------------------------------ org classification

function defaultOrg(root, env = {}) {
  if (env.SF_TARGET_ORG) return env.SF_TARGET_ORG;
  if (process.env.SF_TARGET_ORG) return process.env.SF_TARGET_ORG;
  for (const file of [path.join(root, '.sf', 'config.json'), path.join(os.homedir(), '.sf', 'config.json')]) {
    const j = readJson(file);
    if (j && j['target-org']) return j['target-org'];
  }
  return undefined;
}

let orgListCache = null;
function orgList(root) {
  if (orgListCache) return orgListCache;
  const cache = path.join(stateDir(root), 'org-list.cache.json');
  const cached = readJson(cache);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return (orgListCache = cached.orgs);
  const r = sfJson(['org', 'list', '--skip-connection-status'], { timeout: Number(process.env.SF_SDLC_ORGLIST_TIMEOUT) || 60000 });
  if (!r.json || r.json.status !== 0) return null;
  const orgs = [];
  for (const [group, list] of Object.entries(r.json.result || {})) {
    for (const o of Array.isArray(list) ? list : []) {
      orgs.push({
        group, alias: o.alias, username: o.username, instanceUrl: o.instanceUrl,
        isSandbox: o.isSandbox, isScratch: o.isScratch || group === 'scratchOrgs', isDevHub: o.isDevHub,
      });
    }
  }
  try { fs.writeFileSync(cache, JSON.stringify({ at: Date.now(), orgs })); } catch { /* cache is optional */ }
  return (orgListCache = orgs);
}

function classifyByFacts(o) {
  const url = (o.instanceUrl || '').toLowerCase();
  if (o.isScratch || url.includes('.scratch.')) return 'scratch';
  if (o.isSandbox || url.includes('.sandbox.') || /\/\/[^/]*--[^/]*\.my\.salesforce\.com/.test(url) || url.includes('//test.') || /cs\d+\./.test(url)) return 'sandbox';
  if (url.includes('.develop.') || url.includes('-dev-ed.') || url.includes('.trailblaze.')) return 'developer';
  if (url) return 'production';
  return 'unknown';
}

// kind: production | sandbox | scratch | developer | unknown. `lookup` is injectable for tests.
function classifyOrg(target, cfg, root, lookup = orgList) {
  if (!target) return { target, kind: 'unknown', reason: 'no target org given and no default org set' };
  const prod = (cfg.orgs.production || []).map(String);
  if (prod.includes(target)) return { target, kind: 'production', reason: 'listed in orgs.production' };
  const orgs = lookup(root);
  if (!orgs) return { target, kind: 'unknown', reason: 'could not read the org list from the sf CLI' };
  const o = orgs.find((x) => {
    const aliases = String(x.alias || '').split(',').map((s) => s.trim());
    return aliases.includes(target) || x.username === target;
  });
  if (!o) return { target, kind: 'unknown', reason: 'org is not authenticated in the sf CLI' };
  if (prod.includes(o.username)) return { target, kind: 'production', reason: 'username listed in orgs.production', username: o.username };
  const kind = classifyByFacts(o);
  return { target, kind, reason: `org type from sf org list (${o.instanceUrl || 'no instance URL'})`, username: o.username };
}

function resolveOrg(roleOrAlias, cfg) {
  if (!roleOrAlias) return undefined;
  if (roleOrAlias === 'production') return (cfg.orgs.production || [])[0];
  return cfg.orgs[roleOrAlias] && typeof cfg.orgs[roleOrAlias] === 'string' ? cfg.orgs[roleOrAlias] : roleOrAlias;
}

// ------------------------------------------------------------------ project facts

function sfdxProject(root) { return readJson(path.join(root, 'sfdx-project.json')); }

function packageDirs(root, cfg) {
  const conf = cfg && cfg.salesforce.packageDirectories;
  if (Array.isArray(conf) && conf.length) return conf;
  const p = sfdxProject(root);
  const dirs = ((p && p.packageDirectories) || []).map((d) => d.path).filter(Boolean);
  return dirs.length ? dirs : (fs.existsSync(path.join(root, 'force-app')) ? ['force-app'] : []);
}

function apiVersion(root, cfg) {
  const conf = cfg && cfg.salesforce.apiVersion;
  if (conf && conf !== 'auto') return String(conf);
  const p = sfdxProject(root);
  return p && p.sourceApiVersion ? String(p.sourceApiVersion) : undefined;
}

function walk(dir, visit, depth = 0) {
  if (depth > 12) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '.sf' || e.name === '.sfdx') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (visit(full, e, true) !== false) walk(full, visit, depth + 1); } else visit(full, e, false);
  }
}

function hashDir(dir) {
  const h = crypto.createHash('sha256');
  const files = [];
  walk(dir, (full, e, isDir) => { if (!isDir) files.push(full); });
  for (const f of files.sort()) {
    h.update(path.relative(dir, f).split(path.sep).join('/'));
    h.update('\0');
    h.update(fs.readFileSync(f));
  }
  return h.digest('hex').slice(0, 16);
}

module.exports = {
  KIT_ROOT, IS_PLUGIN, DEFAULTS, TEST_LEVELS,
  merge, readJson, projectDir, configPaths, loadConfig, validateConfig, hookMode,
  run, has, sfJson, git, stateDir, appendJsonl,
  splitCommands, stripPrefix, flagValue, sfInvocations, gitInvocations,
  defaultOrg, orgList, classifyByFacts, classifyOrg, resolveOrg,
  sfdxProject, packageDirs, apiVersion, walk, hashDir,
};
