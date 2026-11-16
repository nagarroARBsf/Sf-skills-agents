'use strict';
// Browser testing through the Playwright MCP server (server name "sf-browser"), started by
// bin/sf-browser-mcp. Node.js standard library only.
//
// The browser keeps one persistent profile per project in .sf-sdlc/browser-profile/: the person signs
// in to Salesforce once in the browser window, and the cookies stay there for the next Claude session,
// also after a restart of the laptop (prepareProfile), until Salesforce's own session timeout.
// That folder holds live session cookies, so it is git-ignored (.sf-sdlc/ ignores itself), denied to
// Claude's Read tool and protected by the secret guard (checks.isProtectedPath).
//
// The guard (`navigateGuard`) asks before the browser opens a page of a production-class Salesforce
// org, and of any Salesforce org it cannot classify.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

// Pinned, so every machine runs the same server. Bump deliberately (check `--help` for flag changes).
const PACKAGE = '@playwright/mcp@0.0.84';
const PROFILE_DIR = path.join('.sf-sdlc', 'browser-profile');
const OUTPUT_DIR = path.join('.sf-sdlc', 'browser-output');
// URL parameters whose values are replaced with <redacted> in what the server returns to Claude:
// Salesforce session IDs (frontdoor sid) and OAuth codes and tokens.
const REDACT = ['sid', 'oauth_token', 'access_token', 'refresh_token', 'code', 'otp', 'id_token'];

function profileDir(root) { return path.join(root, PROFILE_DIR); }

// Linux has no Google Chrome unless someone installed it; Chrome for Testing ("chromium") installs
// without administrator rights, so it is the fallback there.
function chromeMissing(has = lib.has, platform = process.platform, exists = fs.existsSync) {
  if (platform !== 'linux') return false;
  return !['google-chrome', 'google-chrome-stable', 'chrome'].some((c) => has(c)) && !exists('/opt/google/chrome/chrome');
}

// What to start: { cmd, args, browser } or { reason } when the server should serve no tools.
function plan(root, cfg, { has = lib.has, platform = process.platform, exists = fs.existsSync } = {}) {
  const b = cfg.browser || {};
  if (b.enabled === false) return { reason: 'browser.enabled is false in .claude/sf-sdlc.json' };
  if (!has('npx')) return { reason: 'npx was not found (it comes with Node.js 18+); install Node.js and restart Claude Code' };
  let browser = lib.BROWSERS.includes(b.browser) ? b.browser : 'chrome';
  let note = '';
  if (browser === 'chrome' && chromeMissing(has, platform, exists)) { browser = 'chromium'; note = 'Google Chrome not found; using Chrome for Testing (chromium)'; }
  const args = ['-y', PACKAGE,
    '--browser', browser,
    '--user-data-dir', profileDir(root),
    '--output-dir', path.join(root, OUTPUT_DIR),
    '--redact-url-params', REDACT.join(','),
  ];
  if (b.headless) args.push('--headless');
  return { cmd: 'npx', args, browser, note };
}

// Keep the Salesforce sign-in across restarts. Salesforce's session cookie (sid) has no expiry date,
// so a browser drops it when it closes — unless the profile restores the last session. Chromium
// (chrome, msedge, chromium): session.restore_on_startup = 1 ("continue where you left off") in
// Default/Preferences, and the last exit marked clean so no "restore pages?" prompt appears after
// Claude Code or the laptop stopped the browser abruptly. Firefox: browser.startup.page = 3 in user.js.
// Merges into what the browser wrote; never replaces its file. Run by setup and on every start.
const CHROMIUM = ['chrome', 'msedge', 'chromium'];

function prepareProfile(root, browserName) {
  const dir = profileDir(root);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  if (CHROMIUM.includes(browserName)) {
    const file = path.join(dir, 'Default', 'Preferences');
    let prefs = {};
    if (fs.existsSync(file)) {
      try { prefs = JSON.parse(fs.readFileSync(file, 'utf8')) || {}; } catch { return { result: 'left alone (Preferences is not valid JSON)' }; }
    }
    const before = JSON.stringify(prefs);
    prefs.session = { ...(prefs.session || {}), restore_on_startup: 1 };
    prefs.profile = { ...(prefs.profile || {}), exit_type: 'Normal', exited_cleanly: true };
    if (JSON.stringify(prefs) === before) return { result: 'kept' };
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    fs.writeFileSync(file, JSON.stringify(prefs), { mode: 0o600 });
    return { result: 'set' };
  }
  if (browserName === 'firefox') {
    const file = path.join(dir, 'user.js');
    const line = 'user_pref("browser.startup.page", 3);';
    const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
    if (cur.includes(line)) return { result: 'kept' };
    fs.writeFileSync(file, cur + (cur && !cur.endsWith('\n') ? '\n' : '') + line + '\n', { mode: 0o600 });
    return { result: 'set' };
  }
  return { result: 'not supported for this browser (sign in again after each restart)' };
}

// Whether the profile is set to keep the sign-in across restarts.
function keepsSignIn(root, browserName) {
  try {
    if (CHROMIUM.includes(browserName)) return JSON.parse(fs.readFileSync(path.join(profileDir(root), 'Default', 'Preferences'), 'utf8')).session.restore_on_startup === 1;
    if (browserName === 'firefox') return fs.readFileSync(path.join(profileDir(root), 'user.js'), 'utf8').includes('"browser.startup.page", 3');
  } catch { /* not prepared yet */ }
  return false;
}

// Chromium marks a profile in use with a SingletonLock symlink to "<host>-<pid>". Another Claude
// session can then not open the same profile until that browser closes.
function profileInUse(root) {
  try {
    const target = fs.readlinkSync(path.join(profileDir(root), 'SingletonLock'));
    const pid = Number(String(target).split('-').pop());
    if (!pid) return { inUse: true, pid: null };
    try { process.kill(pid, 0); return { inUse: true, pid }; } catch (e) { return { inUse: e.code === 'EPERM', pid }; }
  } catch { return { inUse: false }; }
}

function status(root, cfg) {
  const p = plan(root, cfg);
  const dir = profileDir(root);
  const exists = fs.existsSync(dir);
  return {
    enabled: (cfg.browser || {}).enabled !== false,
    ready: Boolean(p.cmd), reason: p.reason || null,
    browser: p.browser || (cfg.browser || {}).browser, headless: Boolean((cfg.browser || {}).headless),
    package: PACKAGE, profile: PROFILE_DIR.split(path.sep).join('/'), profileExists: exists,
    keepsSignIn: p.browser ? keepsSignIn(root, p.browser) : false,
    ...(exists ? profileInUse(root) : { inUse: false }),
    note: p.note || null,
  };
}

// Sign out everywhere: delete the profile. Refuses while a browser is using it.
function reset(root) {
  const dir = profileDir(root);
  if (!fs.existsSync(dir)) return { result: 'nothing to reset' };
  const u = profileInUse(root);
  if (u.inUse) throw new Error(`the browser profile is in use${u.pid ? ` (process ${u.pid})` : ''}; close the browser (or end the other Claude session) first`);
  fs.rmSync(dir, { recursive: true, force: true });
  return { result: 'removed' };
}

// ------------------------------------------------------------------ navigation guard

const LOGIN_HOSTS = new Set(['login.salesforce.com', 'test.salesforce.com', 'welcome.salesforce.com']);
const SF_HOST = /(^|\.)(salesforce|force|salesforce-setup|cloudforce|visualforce|site|salesforce-sites)\.com$/i;

// Which browser tool a Claude Code tool name refers to, or null when it is not the kit's browser.
function parseToolName(toolName) {
  const m = /^mcp__(?:plugin_[^_]+(?:_[^_]+)*?_)?sf-browser__(.+)$/.exec(String(toolName || ''));
  return m ? { tool: m[1] } : null;
}

// My Domain key of a Salesforce host: "acme--uat" for acme--uat.sandbox.my.salesforce.com,
// acme--uat.sandbox.lightning.force.com and acme--uat--c.sandbox.vf.force.com alike.
function domainKey(host) {
  const parts = String(host || '').toLowerCase().split('.')[0].split('--');
  if (parts.length >= 3) return parts.slice(0, 2).join('--'); // sandbox Visualforce / content domain
  if (parts.length === 2 && ['c', 'vf'].includes(parts[1])) return parts[0]; // production Visualforce
  return parts.join('--');
}

function hostOf(url) { try { return new URL(url).hostname.toLowerCase(); } catch { return ''; } }

function navigateGuard(toolName, toolInput, cfg, root, lookup = lib.orgList) {
  const t = parseToolName(toolName);
  if (!t || t.tool !== 'browser_navigate') return { decision: 'allow' };
  const url = String((toolInput && toolInput.url) || '');
  const host = hostOf(url);
  if (!host || !SF_HOST.test(host) || LOGIN_HOSTS.has(host)) return { decision: 'allow' };
  const orgs = lookup(root) || null;
  const key = domainKey(host);
  const o = orgs && orgs.find((x) => {
    const h = hostOf(x.instanceUrl);
    return h && (h === host || domainKey(h) === key);
  });
  const prod = (cfg.orgs.production || []).map(String);
  let kind = 'unknown';
  let who = host;
  if (o) {
    const aliases = String(o.alias || '').split(',').map((s) => s.trim()).filter(Boolean);
    who = aliases[0] || o.username || host;
    kind = aliases.some((a) => prod.includes(a)) || prod.includes(o.username) ? 'production' : lib.classifyByFacts(o);
  }
  if (kind === 'sandbox' || kind === 'scratch' || kind === 'developer') return { decision: 'allow' };
  return {
    decision: 'ask',
    reason: `The browser is about to open ${host} (${kind === 'unknown' ? (orgs ? 'not an org signed in to the sf CLI' : 'the sf CLI org list could not be read') + ', treated as production' : `org ${who}, ${kind}`}). UI tests run only in sandbox, scratch or developer orgs. Approve only if you named this org and this exact action.`,
  };
}

module.exports = { PACKAGE, PROFILE_DIR, OUTPUT_DIR, REDACT, CHROMIUM, profileDir, chromeMissing, plan, prepareProfile, keepsSignIn, profileInUse, status, reset, parseToolName, domainKey, navigateGuard };
