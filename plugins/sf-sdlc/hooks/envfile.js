'use strict';
// The project's .env file: credentials a person fills in their editor (never in the chat) for the
// connections the sf CLI cannot provide — Jira and Confluence API tokens and a GitHub token — plus the
// Salesforce login address, user name and alias, and optional hosted MCP address overrides.
// .env.sample is the same list with no values, written for the team to commit.
// Node.js standard library only.
//
// Rules: values are never printed, logged or returned to Claude. `status` reports only whether each
// key has a value. The file is git-ignored by `sf-sdlc init` and Claude's Read tool is denied on it
// through permissions.deny in .claude/settings.json.

const fs = require('fs');
const path = require('path');

// The sections of .env, in file order. Each names the keys the kit reads, the connection they enable
// (`group`), and the comment written above them. `required` keys must all be set for the group to count
// as configured; a group with no required keys only overrides defaults.
const SECTIONS = [
  {
    group: 'salesforce', label: 'Salesforce sign-in (login address, user name, alias)',
    required: ['SF_LOGIN_URL'], optional: ['SF_USERNAME', 'SF_ORG_ALIAS'],
    comment: `# Salesforce org for this project. These are NOT passwords and NOT a login: they tell setup where to
# open the browser sign-in (sf org login web) and which signed-in org belongs to this project.
# The password is typed into the Salesforce page only, never here and never in the chat.
#   SF_LOGIN_URL  https://login.salesforce.com (production / Developer Edition),
#                 https://test.salesforce.com (sandbox), or your My Domain, e.g. https://acme--uat.sandbox.my.salesforce.com
#   SF_USERNAME   the Salesforce user name you sign in with, e.g. jane.doe@acme.com.uat
#   SF_ORG_ALIAS  the short name for the org in the sf CLI, e.g. dev or uat`,
  },
  {
    group: 'mcp', label: 'Salesforce hosted MCP addresses (overrides only)',
    required: [], optional: ['SF_SDLC_MCP_HOST', 'SF_MCP_METADATA_EXPERTS_URL', 'SF_MCP_METADATA_GROUNDING_URL', 'SF_MCP_HEADLESS_360_URL', 'SF_MCP_DATA360_URL', 'SF_MCP_SOBJECT_READS_URL', 'SF_MCP_SOBJECT_ALL_URL'],
    comment: `# Salesforce hosted MCP servers (Metadata Experts, Metadata Grounding, SObject, Headless 360, Data 360).
# Leave ALL of these empty: the kit already knows the addresses and signs in with your sf CLI login, so
# no connected app, client ID or token is needed. Set one only when Salesforce gives you a different
# address (a pilot or a new API version). Every value must be an https://….salesforce.com address.
#   SF_SDLC_MCP_HOST                 host for every server (default api.salesforce.com)
#   SF_MCP_<SERVER>_URL              full address of one server, e.g.
#                                    https://api.salesforce.com/platform/mcp/v1-beta.2/platform/metadata-experts
# Turn servers on or off with: sf-sdlc mcp enable|disable <name>`,
  },
  {
    group: 'jira', label: 'Jira (token-based MCP server)',
    required: ['JIRA_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN'], optional: [],
    comment: `# Jira and Confluence (Atlassian Cloud). Create an API token at
# https://id.atlassian.com/manage-profile/security/api-tokens
# Leave these empty to sign in through the browser instead (the "atlassian" MCP server).
#   JIRA_URL       e.g. https://acme.atlassian.net
#   JIRA_USERNAME  your Atlassian e-mail address`,
  },
  {
    group: 'confluence', label: 'Confluence (token-based MCP server)',
    required: ['CONFLUENCE_URL', 'CONFLUENCE_USERNAME', 'CONFLUENCE_API_TOKEN'], optional: [],
    comment: `#   CONFLUENCE_URL e.g. https://acme.atlassian.net/wiki (same token as Jira)
# Optional: READ_ONLY_MODE=true (no create/update tools); pin the server version with
# ATLASSIAN_MCP_PACKAGE=mcp-atlassian==<version> (uv) or ATLASSIAN_MCP_IMAGE=<image:tag> (Docker).`,
  },
  {
    group: 'github', label: 'GitHub (signs the gh CLI in once)',
    required: ['GITHUB_TOKEN'], optional: [],
    comment: `# GitHub personal access token. Used once by \`sf-sdlc env gh-login\` to sign the gh CLI in; after
# that the gh CLI keeps its own login and you may delete the value. Or run \`gh auth login\` instead.`,
  },
];

const GROUPS = Object.fromEntries(SECTIONS.map((x) => [x.group, { label: x.label, required: x.required, optional: x.optional }]));
const ALL_KEYS = SECTIONS.flatMap((x) => [...x.required, ...x.optional]);

const BROWSER_NOTE = `# Browser testing (Playwright MCP, server "sf-browser") needs nothing here. The first time Claude
# opens the browser you sign in to Salesforce yourself in that window; the session is kept in
# .sf-sdlc/browser-profile/ (git-ignored, Claude is denied reading it) so later sessions stay signed in,
# also after a restart, until Salesforce's own session timeout.
# Sign out everywhere with: sf-sdlc browser reset`;

const HEADER = `# sf-sdlc credentials. This file is git-ignored and Claude is denied read access to it.
# Fill the values here, in your editor. Never paste them into the chat.
# Check what is set (names only, never values) with: sf-sdlc env status
# Addresses and user names can be written for you: sf-sdlc env set SF_LOGIN_URL=… SF_USERNAME=…`;

const SAMPLE_MARK = '# sf-sdlc .env.sample';
const SAMPLE_HEADER = `${SAMPLE_MARK} — the list of settings the kit reads, with no values. Safe to commit.
# Copy it to .env (sf-sdlc env init does this) and fill .env in your editor. Never put values in this file.
# Generated by sf-sdlc init; edits are replaced on the next init.`;

const body = () => SECTIONS.map((x) => `${x.comment}\n${[...x.required, ...x.optional].map((k) => `${k}=`).join('\n')}`).join('\n\n') + `\n\n${BROWSER_NOTE}\n`;
const TEMPLATE = `${HEADER}\n\n${body()}`;
const SAMPLE = `${SAMPLE_HEADER}\n\n${body()}`;

function envPath(root) { return path.join(root, '.env'); }

// Parse KEY=VALUE lines. Supports `export KEY=...`, quotes and trailing comments on unquoted values.
function parse(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2];
    const q = /^(["'])(.*)\1$/.exec(v);
    if (q) v = q[2];
    else v = v.replace(/\s+#.*$/, '').trim();
    out[m[1]] = v;
  }
  return out;
}

function read(root) {
  try { return parse(fs.readFileSync(envPath(root), 'utf8')); } catch { return null; }
}

function isIgnored(root) {
  try {
    const gi = fs.readFileSync(path.join(root, '.gitignore'), 'utf8').split(/\r?\n/).map((s) => s.trim());
    return gi.includes('.env') || gi.includes('/.env') || gi.includes('.env*') || gi.includes('*.env');
  } catch { return false; }
}

// Names and presence only — never values.
function status(root) {
  const vals = read(root);
  const groups = {};
  for (const [name, g] of Object.entries(GROUPS)) {
    const keys = {};
    for (const k of [...g.required, ...g.optional]) keys[k] = Boolean(vals && vals[k]);
    const set = g.required.filter((k) => keys[k]).length;
    const state = !g.required.length ? (Object.values(keys).some(Boolean) ? 'configured' : 'default')
      : set === g.required.length ? 'configured' : set ? 'partial' : 'empty';
    groups[name] = { label: g.label, state, keys };
  }
  return { file: '.env', exists: vals !== null, gitignored: isIgnored(root), groups };
}

// Create .env from the template, or append the kit's keys that are missing, each section with its
// comment. Never changes a value.
function ensure(root) {
  const file = envPath(root);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, TEMPLATE, { mode: 0o600 });
    return { result: 'created' };
  }
  const have = read(root) || {};
  const missing = ALL_KEYS.filter((k) => !(k in have));
  if (!missing.length) return { result: 'kept' };
  const add = SECTIONS.map((x) => ({ x, keys: [...x.required, ...x.optional].filter((k) => missing.includes(k)) }))
    .filter((e) => e.keys.length)
    .map((e) => `${e.x.comment}\n${e.keys.map((k) => `${k}=`).join('\n')}`).join('\n\n');
  const cur = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, cur + (cur.endsWith('\n') ? '' : '\n') + '\n# Added by sf-sdlc (fill in your editor; see sf-sdlc env status)\n' + add + '\n');
  return { result: 'appended', added: missing };
}

// .env.sample: the committed list of keys with no values, so teammates know what to fill. Written when
// missing, refreshed when it is still the kit's file, left alone when the team wrote its own.
function ensureSample(root) {
  const file = path.join(root, '.env.sample');
  if (!fs.existsSync(file)) { fs.writeFileSync(file, SAMPLE); return { result: 'created' }; }
  const cur = fs.readFileSync(file, 'utf8');
  if (cur === SAMPLE) return { result: 'kept' };
  if (!cur.startsWith(SAMPLE_MARK)) return { result: 'exists, not managed by sf-sdlc' };
  fs.writeFileSync(file, SAMPLE);
  return { result: 'updated' };
}

// Environment for a child process: the current environment plus the named .env keys that have values.
function childEnv(root, keys, base = process.env) {
  const vals = read(root) || {};
  const env = { ...base };
  for (const k of keys) if (vals[k]) env[k] = vals[k];
  return env;
}

// Keys Claude may write for the person: addresses and user names only. Tokens, passwords and keys are
// never accepted here — the person types those into .env in their editor.
const PLAIN_KEYS = ['SF_LOGIN_URL', 'SF_USERNAME', 'SF_ORG_ALIAS', 'JIRA_URL', 'JIRA_USERNAME', 'CONFLUENCE_URL', 'CONFLUENCE_USERNAME', 'READ_ONLY_MODE'];

function setPlain(root, key, value) {
  if (!PLAIN_KEYS.includes(key)) throw new Error(`"${key}" cannot be set from the command line: only ${PLAIN_KEYS.join(', ')}. Type secrets (tokens, passwords) into .env in your editor.`);
  const v = String(value).trim();
  if (!v || /[\r\n]/.test(v)) throw new Error(`${key} needs a one-line value`);
  ensure(root);
  const file = envPath(root);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const i = lines.findIndex((l) => new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`).test(l));
  if (i >= 0) lines[i] = `${key}=${v}`;
  else lines.push(`${key}=${v}`, '');
  fs.writeFileSync(file, lines.join('\n'));
  return { key, result: 'set' };
}

module.exports = {
  PLAIN_KEYS, setPlain, SECTIONS, GROUPS, ALL_KEYS, TEMPLATE, SAMPLE, ensureSample, parse, read, status, ensure, childEnv, isIgnored, envPath };
