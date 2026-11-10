'use strict';
// Fast, offline source checks used by the write hooks and by `sf-sdlc check`.
// They are heuristics that catch the common Salesforce mistakes within milliseconds; the
// authoritative scan is the official Salesforce Code Analyzer (`sf-sdlc analyze`).

const path = require('path');

// Replace comments (and optionally string contents) with spaces, keeping line numbers intact.
function mask(src, { strings = false, lineComment = '//' } = {}) {
  let out = '';
  let i = 0;
  const n = src.length;
  const blank = (s) => s.replace(/[^\n]/g, ' ');
  while (i < n) {
    const two = src.substr(i, 2);
    if (two === '/*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      out += blank(src.slice(i, stop)); i = stop; continue;
    }
    if (lineComment && two === lineComment) {
      const end = src.indexOf('\n', i);
      const stop = end < 0 ? n : end;
      out += blank(src.slice(i, stop)); i = stop; continue;
    }
    if (src[i] === "'") {
      let j = i + 1;
      while (j < n && src[j] !== "'" && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      const body = src.slice(i + 1, Math.min(j, n));
      out += "'" + (strings ? blank(body) : body) + (j < n && src[j] === "'" ? "'" : '');
      i = Math.min(j + 1, n); continue;
    }
    out += src[i]; i++;
  }
  return out;
}

const finding = (rule, severity, line, message) => ({ rule, severity, line, message });

const ID_LITERAL = /'(?:00[0-9A-Za-z]|01[0-9A-Za-z]|a[0-9][0-9A-Za-z])[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?'/;
const DML = /^\s*(insert|update|delete|upsert|undelete|merge)\s+[^;=(]+;/i;
const DML_DB = /\bDatabase\s*\.\s*(insert|update|delete|upsert|undelete|merge|convertLead|executeBatch)\s*\(/i;
const SOQL = /\[\s*(SELECT|FIND)\b/i;
const SOQL_DYNAMIC = /\bDatabase\s*\.\s*(query|queryWithBinds|countQuery|getQueryLocator)\s*\(|\bSearch\s*\.\s*query\s*\(/i;
const LOOP_HEAD = /\b(for|while)\s*\(|\bdo\s*\{/;

function checkApex(src, file) {
  const out = [];
  const code = mask(src, { strings: false });   // comments removed, strings kept
  const bare = mask(src, { strings: true });    // comments and string contents removed
  const lines = bare.split('\n');
  const withStrings = code.split('\n');
  const isTest = /@isTest\b/i.test(bare);
  const isTrigger = file.endsWith('.trigger');

  // Sharing model on the outer class.
  if (!isTrigger) {
    const decl = /^[^\n{;]*\bclass\s+\w+[^{]*\{/m.exec(bare);
    if (decl && !isTest && !/\b(with|without|inherited)\s+sharing\b/i.test(decl[0]) &&
        !/\b(extends\s+Exception|interface)\b/i.test(decl[0])) {
      out.push(finding('apex-sharing', 'major', bare.slice(0, decl.index).split('\n').length,
        'Class declares no sharing model. Use `with sharing` (or `inherited sharing`); `without sharing` needs a recorded reason.'));
    }
  }

  // SOQL and DML inside loops: track which open braces belong to a loop.
  const stack = [];
  let pendingLoop = false;
  let loopDepth = 0;
  let parenDepth = 0;
  lines.forEach((line, idx) => {
    const ln = idx + 1;
    const head = LOOP_HEAD.test(line);
    const inLoop = loopDepth > 0;
    // A query in a `for (X x : [SELECT ...])` header is a SOQL for-loop, which is fine.
    const queryInHeader = head && /\bfor\s*\([^)]*:\s*\[\s*SELECT/i.test(line);
    if (inLoop && !queryInHeader && (SOQL.test(line) || SOQL_DYNAMIC.test(line))) {
      out.push(finding('apex-soql-in-loop', 'blocker', ln, 'SOQL inside a loop. Query once before the loop and index the results in a Map.'));
    }
    if (inLoop && (DML.test(line) || DML_DB.test(line))) {
      out.push(finding('apex-dml-in-loop', 'blocker', ln, 'DML inside a loop. Collect records in a List and run one DML statement after the loop.'));
    }
    if (head) pendingLoop = true;
    for (const ch of line) {
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
      else if (ch === '{') {
        stack.push(pendingLoop);
        if (pendingLoop) loopDepth++;
        pendingLoop = false;
      } else if (ch === '}') {
        if (stack.pop()) loopDepth--;
      } else if (ch === ';' && parenDepth === 0 && pendingLoop) {
        pendingLoop = false; // single-statement loop body without braces
      }
    }
    // Single-statement loop body on the same line as the header: `for (...) insert x;`
    const lm = /\b(for|while)\s*\(/.exec(line);
    if (lm) {
      let depth = 0;
      let j = lm.index + lm[0].length - 1;
      for (; j < line.length; j++) {
        if (line[j] === '(') depth++;
        else if (line[j] === ')' && --depth === 0) break;
      }
      const tail = line.slice(j + 1).trimStart();
      if (tail && !tail.startsWith('{')) {
        if (DML.test(tail) || DML_DB.test(tail)) out.push(finding('apex-dml-in-loop', 'blocker', ln, 'DML inside a loop. Collect records and run one DML statement after the loop.'));
        if (SOQL.test(tail) || SOQL_DYNAMIC.test(tail)) out.push(finding('apex-soql-in-loop', 'blocker', ln, 'SOQL inside a loop. Query once before the loop and index the results in a Map.'));
      }
    }

    const raw = withStrings[idx] || '';
    if (/SeeAllData\s*=\s*true/i.test(line)) out.push(finding('apex-seealldata', 'major', ln, '`SeeAllData=true` makes the test depend on org data. Create test data instead.'));
    if (ID_LITERAL.test(raw)) out.push(finding('apex-hardcoded-id', 'major', ln, 'Hard-coded record ID. IDs differ between orgs; query by DeveloperName or use Custom Metadata.'));
    if (/'https?:\/\/[^']*\.(salesforce|force|site)\.com/i.test(raw)) out.push(finding('apex-hardcoded-url', 'major', ln, 'Hard-coded Salesforce URL. Use `URL.getOrgDomainUrl()` or a Named Credential.'));
    if (/\bDatabase\s*\.\s*(query|countQuery|getQueryLocator)\s*\([^)]*\+/.test(raw) || /'\s*(SELECT|WHERE|AND|OR)\b[^']*'\s*\+\s*(?!')\w/i.test(raw)) {
      if (!/escapeSingleQuotes/.test(raw)) out.push(finding('apex-soql-injection', 'major', ln, 'Dynamic SOQL built by concatenation. Use bind variables (`Database.queryWithBinds`) or `String.escapeSingleQuotes`.'));
    }
    if (/\bwithout\s+sharing\b/i.test(line)) out.push(finding('apex-without-sharing', 'minor', ln, '`without sharing` bypasses record access. Record the reason in a comment and in the plan.'));
  });

  if (isTest && !/\b(Assert\s*\.\s*\w+|System\s*\.\s*assert\w*)\s*\(/.test(bare)) {
    out.push(finding('apex-test-no-assert', 'major', 1, 'Test class has no assertions. A test that cannot fail verifies nothing.'));
  }
  if (isTrigger) {
    const body = bare.slice(bare.indexOf('{') + 1);
    if (body.split('\n').filter((l) => l.trim()).length > 12) out.push(finding('apex-trigger-logic', 'minor', 1, 'Logic in the trigger body. Keep one trigger per object and delegate to a handler class.'));
  }
  return out;
}

function checkJs(src) {
  const out = [];
  mask(src, { strings: true }).split('\n').forEach((line, i) => {
    if (/\.innerHTML\s*=/.test(line)) out.push(finding('lwc-innerhtml', 'major', i + 1, '`innerHTML` assignment bypasses Lightning Web Security sanitising and risks XSS. Use template bindings.'));
    if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(line)) out.push(finding('lwc-eval', 'blocker', i + 1, '`eval`/`new Function` is blocked by Lightning Web Security.'));
    if (/\bconsole\.(log|debug)\s*\(/.test(line)) out.push(finding('lwc-console', 'note', i + 1, 'Leftover console logging.'));
    if (/\bdocument\.querySelector(All)?\s*\(/.test(line)) out.push(finding('lwc-document-query', 'minor', i + 1, 'Query within the component with `this.template.querySelector`, not `document`.'));
  });
  return out;
}

function checkMeta(src, file, ctx = {}) {
  const out = [];
  const m = /<apiVersion>([\d.]+)<\/apiVersion>/.exec(src);
  if (m && ctx.apiVersion && parseFloat(m[1]) < parseFloat(ctx.apiVersion)) {
    out.push(finding('meta-api-version', 'minor', src.slice(0, m.index).split('\n').length,
      `apiVersion ${m[1]} is older than the project's sourceApiVersion ${ctx.apiVersion}.`));
  }
  if (file.endsWith('.field-meta.xml') && !/<description>/.test(src)) out.push(finding('meta-field-description', 'note', 1, 'Custom field has no description.'));
  if (file.endsWith('.profile-meta.xml')) out.push(finding('meta-profile', 'minor', 1, 'Grant access through permission sets, not profiles.'));
  if (file.endsWith('.flow-meta.xml')) {
    if (!/<description>/.test(src)) out.push(finding('flow-description', 'note', 1, 'Flow has no description.'));
    if (/<loops>/.test(src) && /<(recordCreates|recordUpdates|recordDeletes|recordLookups)>/.test(src)) {
      out.push(finding('flow-dml-in-loop-risk', 'minor', 1, 'Flow has a loop and data elements. Confirm no Get/Create/Update/Delete element sits inside the loop path.'));
    }
    if (/<processType>AutoLaunchedFlow<\/processType>/.test(src) && /<recordTriggerType>/.test(src) && !/<faultConnector>/.test(src) &&
        /<(recordCreates|recordUpdates|recordDeletes|actionCalls)>/.test(src)) {
      out.push(finding('flow-fault-path', 'minor', 1, 'Record-triggered flow has data or action elements without a fault path.'));
    }
  }
  if (ID_LITERAL.test(src.replace(/"/g, "'")) || />(?:00[0-9A-Za-z]|01[0-9A-Za-z])[0-9A-Za-z]{12}(?:[0-9A-Za-z]{3})?</.test(src)) {
    out.push(finding('meta-hardcoded-id', 'major', 1, 'Hard-coded record ID in metadata. It will not exist in another org.'));
  }
  return out;
}

function checkFile(file, src, ctx = {}) {
  const base = path.basename(file);
  const norm = file.split(path.sep).join('/');
  if (/\.(cls|trigger)$/.test(base)) return checkApex(src, base);
  if (/-meta\.xml$/.test(base)) return checkMeta(src, base, ctx);
  if (/\.js$/.test(base) && /\/(lwc|aura)\//.test(norm) && !/__tests__/.test(norm)) return checkJs(src);
  return [];
}

// ------------------------------------------------------------------ secrets

const SECRET_PATTERNS = [
  ['salesforce-auth-url', /force:\/\/[A-Za-z0-9._-]+:[^@\s]*:[^@\s]+@[A-Za-z0-9.-]+/],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
  ['salesforce-access-token', /\b00D[0-9A-Za-z]{12,15}![A-Za-z0-9_.]{40,}/],
  ['github-token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['atlassian-token', /\bATATT3x[A-Za-z0-9_\-=]{40,}/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
];
const SECRET_HINT = /\b(password|passwd|secret|api[_-]?key|client[_-]?secret|access[_-]?token|security[_-]?token)\b\s*[:=]\s*['"][^'"\s${}<>]{12,}['"]/i;

function findSecrets(text) {
  const hits = [];
  for (const [name, re] of SECRET_PATTERNS) if (re.test(text)) hits.push(name);
  return hits;
}

const PROTECTED_PATH = /(^|\/)(\.sf|\.sfdx)\/|(^|\/)(server\.key|[^/]+\.pem|[^/]*\.jwt\.key|sfdx-auth-url[^/]*|authurl[^/]*)$/i;

function isProtectedPath(file) {
  return PROTECTED_PATH.test(String(file).split(path.sep).join('/'));
}

module.exports = { mask, checkApex, checkJs, checkMeta, checkFile, findSecrets, SECRET_HINT, isProtectedPath };
