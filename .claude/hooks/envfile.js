'use strict';
// The project's .env file: credentials a person fills in their editor (never in the chat) for the
// connections the sf CLI cannot provide — Jira and Confluence API tokens and a GitHub token.
// Node.js standard library only.
//
// Rules: values are never printed, logged or returned to Claude. `status` reports only whether each
// key has a value. The file is git-ignored by `sf-sdlc init` and Claude's Read tool is denied on it
// through permissions.deny in .claude/settings.json.

const fs = require('fs');
const path = require('path');

// Keys the kit understands, grouped by the connection they enable. `required` keys must all be set
// for the group to count as configured.
const GROUPS = {
  jira: { label: 'Jira (token-based MCP server)', required: ['JIRA_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN'], optional: [] },
  confluence: { label: 'Confluence (token-based MCP server)', required: ['CONFLUENCE_URL', 'CONFLUENCE_USERNAME', 'CONFLUENCE_API_TOKEN'], optional: [] },
  github: { label: 'GitHub (signs the gh CLI in once)', required: ['GITHUB_TOKEN'], optional: [] },
};

const TEMPLATE = `# sf-sdlc credentials. This file is git-ignored and Claude is denied read access to it.
# Fill the values here, in your editor. Never paste them into the chat.
# Check what is set (names only, never values) with: sf-sdlc env status

# Jira and Confluence (Atlassian Cloud). Create an API token at
# https://id.atlassian.com/manage-profile/security/api-tokens
# Leave these empty to sign in through the browser instead (the "atlassian" MCP server).
JIRA_URL=
JIRA_USERNAME=
JIRA_API_TOKEN=
CONFLUENCE_URL=
CONFLUENCE_USERNAME=
CONFLUENCE_API_TOKEN=
# Optional: READ_ONLY_MODE=true (no create/update tools); pin the server version with
# ATLASSIAN_MCP_PACKAGE=mcp-atlassian==<version> (uv) or ATLASSIAN_MCP_IMAGE=<image:tag> (Docker).

# GitHub personal access token. Used once by \`sf-sdlc env gh-login\` to sign the gh CLI in; after
# that the gh CLI keeps its own login and you may delete the value. Or run \`gh auth login\` instead.
GITHUB_TOKEN=
`;

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
    groups[name] = { label: g.label, state: set === g.required.length ? 'configured' : set ? 'partial' : 'empty', keys };
  }
  return { file: '.env', exists: vals !== null, gitignored: isIgnored(root), groups };
}

// Create .env from the template, or append the kit's keys that are missing. Never changes a value.
function ensure(root) {
  const file = envPath(root);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, TEMPLATE, { mode: 0o600 });
    return { result: 'created' };
  }
  const have = read(root) || {};
  const all = Object.values(GROUPS).flatMap((g) => [...g.required, ...g.optional]);
  const missing = all.filter((k) => !(k in have));
  if (!missing.length) return { result: 'kept' };
  const cur = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, cur + (cur.endsWith('\n') ? '' : '\n') + '\n# Added by sf-sdlc (fill in your editor; see sf-sdlc env status)\n' + missing.map((k) => `${k}=`).join('\n') + '\n');
  return { result: 'appended', added: missing };
}

// Environment for a child process: the current environment plus the named .env keys that have values.
function childEnv(root, keys, base = process.env) {
  const vals = read(root) || {};
  const env = { ...base };
  for (const k of keys) if (vals[k]) env[k] = vals[k];
  return env;
}

module.exports = { GROUPS, TEMPLATE, parse, read, status, ensure, childEnv, isIgnored, envPath };
