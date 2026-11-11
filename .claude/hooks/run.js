#!/usr/bin/env node
'use strict';
// Hook dispatcher: `node run.js <hook>` with the hook's JSON input on stdin.
//
//   session-start   SessionStart              project facts (and, as a plugin, the project instructions)
//   pre-bash        PreToolUse  Bash          org guard, commit gate, branch guard
//   pre-write       PreToolUse  Write|Edit    secret and protected-path guard
//   pre-mcp         PreToolUse  mcp__…sf-*    hosted MCP guard: tools that change the org always ask
//   post-write      PostToolUse Write|Edit    fast Salesforce source checks, as feedback
//   post-bash       PostToolUse Bash          audit log
//   bash-failure    PostToolUseFailure Bash   audit log and failure triage
//   stop            Stop                      evidence gate (only when hooks.strictEvidence is true)
//
// Modes (hooks.mode in .claude/sf-sdlc.json): off | observe | enforce. The org guard and the secret
// guard always enforce. A guard that crashes asks the person instead of silently allowing.

const fs = require('fs');
const os = require('os');
const path = require('path');
const lib = require('./lib');
const ops = require('./ops');
const checks = require('./checks');
const mcp = require('./mcp');

const SAFETY_HOOKS = new Set(['pre-bash', 'pre-write', 'pre-mcp']);

function readInput() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}
function emit(obj) { process.stdout.write(JSON.stringify(obj)); }
function preDecision(decision, reason, context) {
  const o = { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason };
  if (context) o.additionalContext = context;
  emit({ hookSpecificOutput: o });
}
function context(event, text) { emit({ hookSpecificOutput: { hookEventName: event, additionalContext: text } }); }

// ------------------------------------------------------------------ org guard

// Topics that change an org or its data. Value: short label used in messages.
const GUARDED = [
  ['project deploy start', 'deploy'], ['project deploy quick', 'quick deploy'], ['project deploy validate', 'validation'],
  ['project deploy resume', 'deploy'], ['project deploy pipeline', 'pipeline deploy'], ['project delete source', 'metadata deletion'],
  ['force source deploy', 'deploy'], ['force mdapi deploy', 'deploy'],
  ['org delete', 'org deletion'], ['data delete', 'data deletion'], ['data update', 'data update'], ['data upsert', 'data upsert'],
  ['data import', 'data import'], ['data create', 'data creation'], ['data resume', 'data job'], ['apex run', 'anonymous Apex'],
  ['package install', 'package install'], ['package uninstall', 'package uninstall'], ['org assign', 'permission assignment'],
  ['agent publish', 'agent publish'], ['agent activate', 'agent activation'], ['agent deactivate', 'agent deactivation'],
];
function guardedLabel(topic) {
  if (/^apex run test\b/.test(topic)) return null;
  const hit = GUARDED.find(([t]) => topic === t || topic.startsWith(t + ' '));
  return hit ? hit[1] : null;
}

// Decision for one sf invocation: { decision: 'allow'|'ask'|'deny', reason }.
function orgGuard(inv, cfg, root, lookup) {
  const label = guardedLabel(inv.topic);
  if (!label) return { decision: 'allow' };
  const target = lib.flagValue(inv.words, ['-o', '--target-org', '-u', '--targetusername', '--target-dev-hub']) || lib.defaultOrg(root, inv.env);
  const org = lib.classifyOrg(target, cfg, root, lookup);
  const name = target || '(no target org)';
  const testLevel = lib.flagValue(inv.words, ['-l', '--test-level']);
  const dryRun = inv.words.includes('--dry-run');
  const isDeployStart = /^(project deploy start|force source deploy|force mdapi deploy|project deploy pipeline)/.test(inv.topic);

  if (org.kind === 'production') {
    if (testLevel === 'NoTestRun') {
      return { decision: 'deny', org, reason: `Blocked: ${label} to production org "${name}" with --test-level NoTestRun. Production deployments must run tests (deploy.testLevel.production is ${cfg.deploy.testLevel.production}).` };
    }
    if (isDeployStart && !dryRun && !cfg.deploy.allowDirectProductionDeploy) {
      return { decision: 'deny', org, reason: `Blocked: direct deploy to production org "${name}". Validate first with \`sf project deploy validate\`, have the result reviewed, then release it with \`sf project deploy quick --job-id <id>\`. (Set deploy.allowDirectProductionDeploy to true in .claude/sf-sdlc.json to change this policy.)` };
    }
    return { decision: 'ask', org, reason: `PRODUCTION: ${label} against "${name}" (${org.reason}). Confirm only if you named this org and intend this change.` };
  }
  if (org.kind === 'unknown') {
    return { decision: 'ask', org, reason: `Cannot tell whether "${name}" is production (${org.reason}). ${label} needs your confirmation. List production aliases in orgs.production in .claude/sf-sdlc.json.` };
  }
  if (/^org delete sandbox/.test(inv.topic) || /^package uninstall/.test(inv.topic)) {
    return { decision: 'ask', org, reason: `${label} on ${org.kind} org "${name}" cannot be undone.` };
  }
  return { decision: 'allow', org };
}

// `sf-sdlc deploy validate|quick --org <role>` runs sf itself, so it is guarded as the sf command it becomes.
function kitInvocations(line, cfg) {
  const out = [];
  for (const raw of lib.splitCommands(line)) {
    const { env, words } = lib.stripPrefix(raw);
    const i = words.findIndex((w) => path.basename(w) === 'sf-sdlc');
    if (i < 0 || i > 1) continue;
    const [area, sub] = words.slice(i + 1).filter((w) => !w.startsWith('-'));
    if (area !== 'deploy' || !['validate', 'quick', 'preview'].includes(sub) || words.includes('--print')) continue;
    const target = lib.resolveOrg(lib.flagValue(words, ['--org']), cfg);
    const w = target ? ['-o', target] : [];
    if (sub === 'preview') w.push('--dry-run');
    out.push({ topic: `project deploy ${sub === 'preview' ? 'start' : sub}`, words: w, env });
  }
  return out;
}

// ------------------------------------------------------------------ branch guard

function branchMatches(branch, patterns) {
  return (patterns || []).some((p) => new RegExp('^' + p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(branch));
}

function branchGuard(inv, cfg, root, currentBranch) {
  if (inv.sub !== 'push') return { decision: 'allow' };
  const args = inv.words.slice(inv.words.indexOf('push') + 1);
  const force = args.some((a) => a === '-f' || a === '--force' || a.startsWith('--force-with-lease') || a === '--mirror');
  const positional = args.filter((a) => !a.startsWith('-'));
  const refs = positional.slice(1).map((r) => r.replace(/^\+/, '').split(':').pop().replace(/^refs\/heads\//, ''));
  const plusForce = positional.slice(1).some((r) => r.startsWith('+'));
  if (!refs.length) refs.push(currentBranch === undefined ? lib.git(['rev-parse', '--abbrev-ref', 'HEAD'], root) || '' : currentBranch);
  if (args.includes('--all') || args.includes('--mirror')) refs.push(...(cfg.git.protectedBranches || []).filter((p) => !p.includes('*')));
  const hit = refs.find((r) => r && branchMatches(r, cfg.git.protectedBranches));
  if (!hit) return { decision: 'allow' };
  if (force || plusForce) return { decision: 'deny', hard: true, reason: `Blocked: force-push to protected branch "${hit}". Protected branches (git.protectedBranches) are never rewritten.` };
  return { decision: 'deny', reason: `Blocked: direct push to protected branch "${hit}". Push a ${cfg.git.branchPattern} branch and open a pull request against ${cfg.git.pullRequestBase}.` };
}

// ------------------------------------------------------------------ commit gate

function commitGate(inv, cfg, root) {
  if (inv.sub !== 'commit') return { decision: 'allow' };
  const all = inv.words.some((w) => w === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(w));
  const files = ops.stagedFiles(root, all);
  if (!files || !files.length) return { decision: 'allow' };

  const secrets = [];
  for (const f of files) {
    let text;
    try { const st = fs.statSync(path.join(root, f)); if (st.size > 2 * 1024 * 1024) continue; text = fs.readFileSync(path.join(root, f), 'utf8'); } catch { continue; }
    const hits = checks.findSecrets(text);
    if (hits.length) secrets.push(`${f}: ${hits.join(', ')}`);
    else if (checks.isProtectedPath(f)) secrets.push(`${f}: credential file`);
  }
  if (secrets.length) {
    return { decision: 'deny', hard: true, reason: `Blocked: the commit contains credentials.\n${secrets.map((s) => '  ' + s).join('\n')}\nRemove them from the files and the index (git restore --staged), and rotate anything already exposed.` };
  }

  if (process.env.SF_SDLC_ANALYZER_DISABLE === '1') return { decision: 'allow' };
  const targets = files.filter(ops.isSalesforceSource).filter((f) => fs.existsSync(path.join(root, f)));
  if (!targets.length) return { decision: 'allow' };
  const res = ops.analyze(root, cfg, targets);
  if (!res.ran) return { decision: 'allow', note: `sf-sdlc: Code Analyzer scan skipped — ${res.reason}` };
  if (res.passed) return { decision: 'allow' };
  return {
    decision: 'deny',
    reason: `Salesforce Code Analyzer found ${res.blocking.length} violation(s) at severity ${res.threshold} or worse in the files being committed:\n${ops.formatViolations(res.blocking, 30)}\nFix them, re-stage and commit again. Full report: \`sf-sdlc analyze --staged\`.`,
  };
}

// ------------------------------------------------------------------ handlers

function preBash(input, root, cfg, mode) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!/\b(sf|sfdx|git|sf-sdlc)\b/.test(command)) return;
  const results = [];
  if (process.env.SF_SDLC_DISABLE_ORG_GUARD !== '1') {
    for (const inv of [...lib.sfInvocations(command), ...kitInvocations(command, cfg)]) results.push(orgGuard(inv, cfg, root));
  }
  if (mode !== 'off') {
    for (const inv of lib.gitInvocations(command)) {
      results.push(branchGuard(inv, cfg, root));
      results.push(commitGate(inv, cfg, root));
    }
  }
  const notes = results.filter((r) => r.note).map((r) => r.note);
  // In observe mode advisory denials are reported, not enforced. Hard denials always hold.
  const advisory = [];
  const effective = results.map((r) => {
    if (r.decision === 'deny' && !r.hard && !r.org && mode === 'observe') { advisory.push(r.reason); return { decision: 'allow' }; }
    return r;
  });
  const deny = effective.find((r) => r.decision === 'deny');
  const ask = effective.find((r) => r.decision === 'ask');
  const extra = [...notes, ...advisory.map((a) => `sf-sdlc (observe mode — this would be blocked when hooks.mode is "enforce"):\n${a}`)].join('\n\n');
  if (deny) return preDecision('deny', deny.reason, extra || undefined);
  if (ask) return preDecision('ask', ask.reason, extra || undefined);
  if (extra) emit({ systemMessage: extra, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: extra } });
}

function preWrite(input, root) {
  const ti = input.tool_input || {};
  const file = ti.file_path || '';
  const rel = path.relative(root, file) || file;
  if (checks.isProtectedPath(rel)) {
    return preDecision('deny', `Blocked: "${rel}" holds Salesforce CLI credentials or key material. It must not be written by an agent or committed.`);
  }
  const text = [ti.content, ti.new_string, ...((ti.edits || []).map((e) => e.new_string))].filter(Boolean).join('\n');
  const hits = checks.findSecrets(text);
  if (hits.length) {
    return preDecision('deny', `Blocked: the content written to "${rel}" contains a credential (${hits.join(', ')}). Keep secrets out of source: use a Named Credential, an environment variable or the CLI's own auth store.`);
  }
  if (checks.SECRET_HINT.test(text) && !/(__tests__|Test\.cls|\.md)$/.test(rel)) {
    return context('PreToolUse', `sf-sdlc: "${rel}" appears to assign a literal password, token or key. If it is a real secret, move it to a Named Credential or protected Custom Metadata before continuing.`);
  }
}

function postWrite(input, root, cfg, mode) {
  if (mode === 'off') return;
  const file = (input.tool_input && input.tool_input.file_path) || '';
  let src;
  try { if (fs.statSync(file).size > 1024 * 1024) return; src = fs.readFileSync(file, 'utf8'); } catch { return; }
  const found = checks.checkFile(file, src, { apiVersion: lib.apiVersion(root, cfg) });
  if (!found.length) return;
  const rel = path.relative(root, file);
  const order = { blocker: 0, major: 1, minor: 2, note: 3 };
  found.sort((a, b) => order[a.severity] - order[b.severity] || a.line - b.line);
  const lines = found.slice(0, 20).map((f) => `  ${f.severity.toUpperCase()} ${rel}:${f.line} [${f.rule}] ${f.message}`);
  context('PostToolUse', `sf-sdlc source check on ${rel} (${found.length} finding${found.length > 1 ? 's' : ''}; heuristic — verify, then fix what is real):\n${lines.join('\n')}`);
}

function auditEntry(input, root, cfg, outcome) {
  if (!cfg.hooks.auditLog || process.env.CLAUDE_PLUGIN_OPTION_AUDIT_LOG === 'false') return [];
  const command = (input.tool_input && input.tool_input.command) || '';
  const rows = [];
  for (const inv of lib.sfInvocations(command)) {
    const label = guardedLabel(inv.topic) || (/^(apex run test|project retrieve start)/.test(inv.topic) ? inv.topic : null);
    if (!label) continue;
    const target = lib.flagValue(inv.words, ['-o', '--target-org', '-u', '--targetusername']) || lib.defaultOrg(root, inv.env);
    const org = lib.classifyOrg(target, cfg, root);
    rows.push({
      at: new Date().toISOString(), user: os.userInfo().username, gitUser: lib.git(['config', 'user.email'], root) || undefined,
      session: input.session_id, agent: input.agent_type, action: label, topic: inv.topic,
      targetOrg: target || null, orgKind: org.kind, outcome,
      command: 'sf ' + inv.words.join(' '), branch: lib.git(['rev-parse', '--abbrev-ref', 'HEAD'], root) || undefined,
    });
  }
  for (const row of rows) lib.appendJsonl(path.join(lib.stateDir(root), 'audit.jsonl'), row);
  return rows;
}

const TRIAGE = [
  [/UNABLE_TO_LOCK_ROW/i, 'Row lock contention. Another transaction holds the record; re-run, and in tests avoid shared parent records across parallel test classes.'],
  [/no (CustomObject|CustomField|ApexClass|[A-Z]\w+) named ([\w.]+) found|In field: \w+ - no \w+ named/i, 'A referenced component is missing from the deployment and the target org. Add it to the manifest or deploy its dependency first.'],
  [/code coverage|Average test coverage across all Apex Classes and Triggers is \d+%/i, 'Coverage below the required threshold. Run `sf-sdlc test run` to see per-class coverage and add tests for the classes below target.'],
  [/FIELD_INTEGRITY_EXCEPTION|INVALID_CROSS_REFERENCE_KEY/i, 'A referenced record, record type, user or field does not exist in the target org. Check environment-specific references (record types, queues, users).'],
  [/Too many SOQL queries: 101|Too many DML statements: 151|Apex CPU time limit exceeded|Apex heap size too large/i, 'Governor limit hit. Look for SOQL or DML inside loops and for unbulkified trigger or flow logic on the object.'],
  [/duplicate value found|DUPLICATE_DEVELOPER_NAME|already exists/i, 'A component with that name already exists in the org. Retrieve it first, or rename.'],
  [/INSUFFICIENT_ACCESS|insufficient access rights|not have access/i, 'The deploying user lacks a permission (for example Modify Metadata, or access to an object or field named in the error).'],
  [/No authorization information found|expired access\/refresh token|INVALID_SESSION_ID/i, 'The CLI is not authorised for this org. Run `sf org login web --alias <alias>`.'],
  [/No default environment found|NoDefaultEnvError/i, 'No target org. Pass --target-org, or set a default with `sf config set target-org <alias>`.'],
  [/Not available for deploy for this organization|is not supported in this organization|This feature is not enabled/i, 'The target org lacks a feature or licence the metadata needs. Enable it, or remove the component from this deployment.'],
  [/API version|unsupported.*version/i, 'API version mismatch between the metadata and the org. Check sourceApiVersion in sfdx-project.json against the org release.'],
  [/dependent class is invalid and needs recompilation|Dependent class is invalid/i, 'A dependent Apex class fails to compile in the org. Deploy the dependency in the same transaction or fix its compile error.'],
  [/code-analyzer.*not a sf command|is not a sf command/i, 'A required CLI plugin is missing. Run `sf-sdlc doctor` for the install command.'],
];

function bashFailure(input, root, cfg) {
  const command = (input.tool_input && input.tool_input.command) || '';
  if (!/\b(sf|sfdx)\b/.test(command)) return;
  auditEntry(input, root, cfg, 'failed');
  const text = JSON.stringify(input).slice(0, 200000);
  const hints = TRIAGE.filter(([re]) => re.test(text)).map(([, hint]) => '- ' + hint);
  if (hints.length) context('PostToolUseFailure', `sf-sdlc failure triage (likely cause, verify against the full error):\n${hints.slice(0, 4).join('\n')}`);
}

function sessionStart(input, root, cfg, mode) {
  process.env.SF_SDLC_ORGLIST_TIMEOUT = '20000'; // never hold up session start on a slow CLI
  const out = [];
  if (lib.IS_PLUGIN) {
    const file = path.join(lib.KIT_ROOT, 'context', 'project-instructions.md');
    if (fs.existsSync(file)) {
      out.push(fs.readFileSync(file, 'utf8').replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, lib.KIT_ROOT).replace(/^<!-- Generated from .*\n/m, '').trim());
    }
  }
  const facts = [];
  const proj = lib.sfdxProject(root);
  if (proj) facts.push(`Salesforce DX project: package directories ${lib.packageDirs(root, cfg).join(', ') || '(none)'}; sourceApiVersion ${lib.apiVersion(root, cfg) || 'not set'}.`);
  else facts.push('No sfdx-project.json in this folder: this is not (yet) a Salesforce DX project. Document stages (BRD, stories, architecture, test design) still work.');
  const v = lib.validateConfig(cfg);
  if (!cfg._exists) facts.push('SDLC config .claude/sf-sdlc.json is missing; defaults are in use. The setup command (sdlc-setup) creates it.');
  else if (!v.ok) facts.push(`SDLC config .claude/sf-sdlc.json has errors: ${v.errors.join('; ')}.`);
  else facts.push(`SDLC config loaded: project code ${cfg.project.code || '(unset)'}; coverage target ${cfg.quality.coverageTarget}%; pipeline ${cfg.deploy.pipeline.join(' → ')}; production aliases ${cfg.orgs.production.join(', ') || '(none listed)'}.`);
  const target = lib.defaultOrg(root);
  if (target && lib.has('sf')) {
    const org = lib.classifyOrg(target, cfg, root);
    facts.push(`Default target org: ${target} (${org.kind}).${org.kind === 'production' ? ' Changes to it need explicit confirmation.' : ''}`);
  } else if (proj) facts.push(lib.has('sf') ? 'No default target org is set.' : 'The sf CLI is not on PATH; org commands will fail until it is installed.');
  const branch = lib.git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
  if (branch) {
    const ticket = /([A-Z][A-Z0-9]+-\d+|US-\d+-\d+)/.exec(branch);
    facts.push(`Git branch: ${branch}${ticket ? ` (work item ${ticket[1]})` : ''}${branchMatches(branch, cfg.git.protectedBranches) ? ' — protected; work on a feature branch.' : '.'}`);
  }
  const docs = path.join(root, cfg.paths.docs);
  const have = (p) => fs.existsSync(path.join(docs, p));
  const stages = [['BRD', '01-brd/BRD.md'], ['backlog', '02-backlog/backlog.md'], ['HLD', '03-architecture/HLD.md'], ['test strategy', '04-qa/test-strategy.md']].filter(([, p]) => have(p)).map(([n]) => n);
  let specs = 0;
  try { specs = fs.readdirSync(path.join(root, cfg.paths.specs), { withFileTypes: true }).filter((e) => e.isDirectory()).length; } catch { /* none */ }
  if (stages.length || specs) facts.push(`SDLC artifacts present: ${stages.join(', ') || 'none'}; ${specs} feature spec folder(s).`);
  let skills = 0;
  try { skills = fs.readdirSync(path.join(root, '.claude', 'skills'), { withFileTypes: true }).filter((e) => e.isDirectory()).length; } catch { /* none */ }
  facts.push(`Project skills installed in .claude/skills: ${skills}. Hook mode: ${mode}.`);
  out.push('## sf-sdlc project facts\n' + facts.map((f) => '- ' + f).join('\n'));
  process.stdout.write(out.join('\n\n') + '\n');
}

// ------------------------------------------------------------------ hosted MCP guard

// Headless 360 `dispatch` and Data 360 `execute` can change the org. They always ask, in every hook
// mode and even when the tool is allow-listed, naming the org and how it is classified.
function mcpGuard(toolName, cfg, root, lookup) {
  const t = mcp.parseToolName(toolName);
  if (!t || !t.writes) return { decision: 'allow' };
  const target = mcp.mcpOrg(root, cfg);
  const org = lib.classifyOrg(target, cfg, root, lookup);
  const risky = org.kind === 'production' || org.kind === 'unknown';
  return {
    decision: 'ask',
    reason: `sf-${t.server} ${t.tool} can change org ${target || '(none)'} (${org.kind}${org.kind === 'unknown' ? ', treated as production' : ''}).${risky ? ' This is a production-class org: confirm only if you named this org and this exact request.' : ''} Check the method, URL and body before approving; read the current state first and re-read after.`,
  };
}

function preMcp(input, root, cfg) {
  const d = mcpGuard(input.tool_name, cfg, root);
  if (d.decision !== 'allow') preDecision(d.decision, d.reason);
}

function stop(input, root, cfg) {
  if (!cfg.hooks.strictEvidence || input.stop_hook_active) return;
  const changed = (lib.git(['status', '--porcelain', '--', cfg.paths.specs], root) || '').split('\n')
    .map((l) => l.slice(3).trim()).filter((f) => /tasks\.md$/.test(f));
  const bad = [];
  for (const f of changed) {
    let src;
    try { src = fs.readFileSync(path.join(root, f), 'utf8'); } catch { continue; }
    src.split('\n').forEach((line, i) => {
      if (/^\s*[-*]\s*\[[xX]\]/.test(line) && !/(—|--|Evidence:|\bPASS\b|\bpassed\b)/i.test(line.replace(/^\s*[-*]\s*\[[xX]\]\s*T?\d*\s*/, ''))) bad.push(`${f}:${i + 1}`);
    });
  }
  if (bad.length) emit({ decision: 'block', reason: `Ticked tasks without evidence (hooks.strictEvidence): ${bad.slice(0, 10).join(', ')}. Append a one-line note to each (files touched and the check or test result), or untick it.` });
}

const HANDLERS = {
  'session-start': sessionStart, 'pre-bash': preBash, 'pre-write': preWrite, 'pre-mcp': preMcp, 'post-write': postWrite,
  'post-bash': (input, root, cfg) => { auditEntry(input, root, cfg, 'ok'); }, 'bash-failure': bashFailure, stop,
};

function main() {
  const name = process.argv[2];
  const handler = HANDLERS[name];
  if (!handler) { process.stderr.write(`sf-sdlc: unknown hook "${name}"\n`); process.exit(0); }
  const input = readInput();
  try {
    const root = lib.projectDir(input.cwd);
    const cfg = lib.loadConfig(root);
    handler(input, root, cfg, lib.hookMode(cfg));
  } catch (err) {
    if (SAFETY_HOOKS.has(name)) {
      const cmd = (input.tool_input && (input.tool_input.command || input.tool_input.file_path)) || '';
      if (name === 'pre-write' || name === 'pre-mcp' || /\b(sf|sfdx)\b[^|;&]*\b(deploy|delete|data|apex run|package)\b|\bgit\s+push\b/.test(cmd)) {
        return preDecision('ask', `The sf-sdlc safety guard failed to run (${err.message}). Confirm this action manually.`);
      }
    }
    process.stderr.write(`sf-sdlc hook ${name} error: ${err.message}\n`);
  }
}

if (require.main === module) main();

module.exports = { mcpGuard, orgGuard, kitInvocations, branchGuard, branchMatches, commitGate, guardedLabel, TRIAGE };
