'use strict';
// Salesforce Hosted MCP Servers, reached through the Salesforce CLI login. Node.js standard library
// only. Used by bin/sf-mcp-proxy (the stdio bridge Claude Code starts), `sf-sdlc mcp` and the hooks.
//
// Authentication: `sf api request rest /ide/auth` asks the org for a short-lived JWT using the
// connection the sf CLI already holds, so no client ID, secret or token is ever stored or printed.
// The JWT identifies the org, so the same host serves production, sandboxes and scratch orgs.

const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const MCP_API_VERSION = 'v1-beta.2';
const DEFAULT_HOST = 'api.salesforce.com';

// name -> route under /platform/mcp/<version>/, and whether a tool can change the org.
const HOSTED_SERVERS = {
  'metadata-experts': { route: 'platform/metadata-experts', writes: false, summary: 'metadata type schemas and generation guidance' },
  'metadata-grounding': { route: 'platform/metadata-grounding', writes: false, summary: 'find existing org metadata by meaning (needs Data 360 and Salesforce Catalog)' },
  'headless-360': { route: 'platform/headless-360', writes: true, summary: 'live Setup state and org REST/Connect operations' },
  'data360': { route: 'data/data360', writes: true, summary: 'Data 360 recipes and operations' },
  'sobject-reads': { route: 'platform/sobject-reads', writes: false, summary: 'read records and object schema: describe, SOQL query, search (read-only)' },
  'sobject-all': { route: 'platform/sobject-all', writes: true, summary: 'read, create, update and delete records' },
};

// Tools that may change the org. Claude Code tool names are mcp__<server>__<tool>, where <server> is
// sf-<name> in a project .mcp.json or plugin_sf-sdlc_sf-<name> for the plugin.
// '*' means every tool on that server asks unless its name is plainly a read (READ_TOOL_NAME).
const WRITE_TOOLS = { 'headless-360': ['dispatch'], 'data360': ['execute'], 'sobject-all': '*' };
const READ_TOOL_NAME = /^(get|list|describe|query|search|find|read|soql|sosl)(?![a-z])/;
// What to show a person: the servers setup turns on by default, and where to switch them on.
const SETUP_PATH = '/lightning/setup/SetupOneHome/home';

function serverUrl(name, env = process.env) {
  const s = HOSTED_SERVERS[name];
  if (!s) throw new Error(`unknown hosted MCP server "${name}"`);
  const host = env.SF_SDLC_MCP_HOST || DEFAULT_HOST;
  if (!/^[a-z0-9.-]+\.salesforce\.com$/i.test(host)) throw new Error(`SF_SDLC_MCP_HOST must be a salesforce.com host, got "${host}"`);
  return `https://${host}/platform/mcp/${MCP_API_VERSION}/${s.route}`;
}

function enabledServers(cfg) {
  const list = (cfg.mcp && Array.isArray(cfg.mcp.servers)) ? cfg.mcp.servers : [];
  return list.filter((n) => HOSTED_SERVERS[n]);
}

// Org the servers sign in to: SF_TARGET_ORG, then mcp.org (a role or alias), then the default org.
function mcpOrg(root, cfg, env = process.env) {
  if (env.SF_TARGET_ORG || env.SFDX_TARGET_ORG) return env.SF_TARGET_ORG || env.SFDX_TARGET_ORG;
  const conf = cfg.mcp && cfg.mcp.org;
  if (conf) return lib.resolveOrg(conf, cfg);
  return lib.defaultOrg(root);
}

// Parse a JSON-RPC reply body that is either JSON or a text/event-stream.
function parseRpcBody(contentType, text) {
  const ct = String(contentType || '').toLowerCase();
  const out = [];
  if (ct.includes('text/event-stream')) {
    for (const event of String(text).split(/\r?\n\r?\n/)) {
      const data = event.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
      if (!data) continue;
      try { out.push(JSON.parse(data)); } catch { /* keep-alive or comment */ }
    }
    return out;
  }
  if (!String(text).trim()) return out;
  const j = JSON.parse(text);
  return Array.isArray(j) ? j : [j];
}

// ok | inactive (not turned on in Setup) | auth | unreachable
function classifyStatus(status, body) {
  if (status === 404 && /not active|not found|server definition/i.test(body || '')) return 'inactive';
  if (status === 401 || status === 403) return 'auth';
  if ((status >= 200 && status < 300) || status === 202) return 'ok';
  return 'unreachable';
}

// Which hosted server and tool an MCP tool name refers to, or null when it is not one of ours.
function parseToolName(toolName) {
  const m = /^mcp__(?:plugin_[^_]+(?:_[^_]+)*?_)?sf-([a-z0-9-]+)__(.+)$/.exec(String(toolName || ''));
  if (!m || !HOSTED_SERVERS[m[1]]) return null;
  const w = WRITE_TOOLS[m[1]];
  return { server: m[1], tool: m[2], writes: w === '*' ? !READ_TOOL_NAME.test(m[2]) : (w || []).includes(m[2]) };
}

function mintJwt(org, root) {
  if (!org) throw new Error('no target org: set mcp.org in .claude/sf-sdlc.json or run `sf config set target-org <alias>`');
  const r = lib.run('sf', ['api', 'request', 'rest', '/ide/auth', '--method', 'POST', '--body', '{}', '--target-org', org],
    { cwd: root, timeout: 90000 });
  let j = null;
  const i = r.stdout.indexOf('{');
  if (i >= 0) { try { j = JSON.parse(r.stdout.slice(i)); } catch { j = null; } }
  const jwt = j && (j.jwt || (j.result && j.result.jwt));
  if (typeof jwt === 'string' && jwt.length) return jwt;
  // Never echo stdout: on success it carries the JWT. stderr names the CLI problem (login expired, …).
  const why = (r.stderr || '').replace(/\s+/g, ' ').trim().slice(0, 300) || (j && (j.message || j.error)) || `exit ${r.status}`;
  throw new Error(`could not get a JWT for org "${org}" from the sf CLI: ${why}. Check \`sf org display --target-org ${org}\` works, or log in again with \`sf org login web --alias ${org}\`.`);
}

function healthFile(root) { return path.join(lib.stateDir(root), 'mcp-health.json'); }

function recordHealth(root, name, entry) {
  try {
    const file = healthFile(root);
    const all = lib.readJson(file) || {};
    all[name] = { ...entry, checkedAt: new Date().toISOString() };
    fs.writeFileSync(file, JSON.stringify(all, null, 2));
  } catch { /* health is advisory */ }
}

function readHealth(root) { return lib.readJson(path.join(root, '.sf-sdlc', 'mcp-health.json')) || {}; }

async function rpc(url, jwt, body, sessionId) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${jwt}` };
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  const res = await fetch(url, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, sessionId: res.headers.get('mcp-session-id'), contentType: res.headers.get('content-type'), text };
}

// Connect, initialize and list tools. Never returns or prints the JWT.
async function probe(name, root, cfg, org) {
  const result = { name, org, state: 'unreachable', tools: [], detail: '' };
  let jwt;
  try { jwt = mintJwt(org, root); } catch (e) { result.state = 'auth'; result.detail = e.message; return result; }
  try {
    const url = serverUrl(name);
    const init = await rpc(url, jwt, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'sf-sdlc', version: '1' } } });
    result.state = classifyStatus(init.status, init.text);
    if (result.state !== 'ok') { result.detail = `HTTP ${init.status}: ${init.text.slice(0, 200)}`; return result; }
    const msgs = parseRpcBody(init.contentType, init.text);
    const info = (msgs[0] && msgs[0].result && msgs[0].result.serverInfo) || {};
    result.detail = `${info.name || name} ${info.version || ''}`.trim();
    await rpc(url, jwt, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId);
    const list = await rpc(url, jwt, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, init.sessionId);
    const lm = parseRpcBody(list.contentType, list.text);
    result.tools = ((lm[0] && lm[0].result && lm[0].result.tools) || []).map((t) => t.name);
  } catch (e) {
    result.state = 'unreachable';
    result.detail = String(e && e.message || e).slice(0, 300);
  } finally {
    recordHealth(root, name, { state: result.state, detail: result.detail, org, tools: result.tools.length });
  }
  return result;
}

// Reply to one JSON-RPC line as a server with no tools: Claude Code then shows an empty, named server
// with the reason, instead of a startup error. Used by bin/sf-mcp-proxy and bin/sf-atlassian-mcp.
function noToolsReply(line, label, reason, send = (m) => process.stdout.write(JSON.stringify(m) + '\n')) {
  let m;
  try { m = JSON.parse(line); } catch { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); return; }
  if (!m || m.id === undefined || m.id === null) return;
  if (m.method === 'initialize') send({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: (m.params && m.params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: `${label} (inactive)`, version: '1.0.0' }, instructions: `Inactive: ${reason}` } });
  else if (m.method === 'tools/list') send({ jsonrpc: '2.0', id: m.id, result: { tools: [] } });
  else if (m.method === 'ping') send({ jsonrpc: '2.0', id: m.id, result: {} });
  else send({ jsonrpc: '2.0', id: m.id, error: { code: -32601, message: `${label} is inactive: ${reason}` } });
}

function serveNoTools(label, reason, log) {
  log(`${reason} — serving no tools`);
  require('readline').createInterface({ input: process.stdin }).on('line', (line) => { if (line.trim()) noToolsReply(line, label, reason); });
}

module.exports = {
  MCP_API_VERSION, HOSTED_SERVERS, WRITE_TOOLS, SETUP_PATH,
  serverUrl, enabledServers, mcpOrg, parseRpcBody, classifyStatus, parseToolName,
  mintJwt, rpc, probe, recordHealth, readHealth, noToolsReply, serveNoTools,
};
