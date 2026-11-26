// Hooks in action: click an event in the hook rail to see a worked example of that hook: the JSON
// Claude Code sends it on stdin, the JSON it prints back, and what happens next. The examples follow
// the real handlers in .claude/hooks/run.js; ids, paths and org names are made up.
(function () {
  var box = document.getElementById('hookDetail');
  var demo = document.getElementById('hookDemo');
  if (!box || !demo) return;

  function j(o) { return JSON.stringify(o, null, 2); }
  var base = { session_id: '4f1c2a9e-…', transcript_path: '~/.claude/projects/acme-salesforce/4f1c2a9e.jsonl', cwd: '/work/acme-salesforce' };
  function input(extra) { var o = {}; Object.keys(base).forEach(function (k) { o[k] = base[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }

  var EX = {
    SessionStart: [{
      label: 'startup', handler: 'session-start',
      when: 'A session opens, resumes or is cleared. The hook reads the project and gives Claude its facts before the first prompt.',
      in: j(input({ hook_event_name: 'SessionStart', source: 'startup' })),
      out: j({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: '## sf-sdlc project facts\n- Salesforce DX project: package directories force-app; sourceApiVersion 62.0.\n- SDLC config loaded: project code ACME; coverage target 85%; pipeline dev → qa → uat → prod; production aliases acme-prod.\n- Default target org: acme-dev (sandbox).\n- Git branch: feature/US-04-02-revenue-chart (work item US-04-02).\n- Project skills installed in .claude/skills: 38. Hook mode: enforce.' } }),
      effect: ['ctx', 'CONTEXT', 'Claude starts the session knowing which org is production, the branch and the work item.']
    }],
    PreToolUse: [{
      label: 'Bash · sf deploy', handler: 'pre-bash',
      when: 'Before every shell command. pre-bash looks at each sf, git and sf-sdlc command: org guard, branch guard and commit gate.',
      in: j(input({ hook_event_name: 'PreToolUse', permission_mode: 'default', tool_name: 'Bash', tool_input: { command: 'sf project deploy start -o acme-prod -x manifest/package.xml', description: 'Deploy the account changes to production' }, tool_use_id: 'toolu_01Hk…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Blocked: direct deploy to production org "acme-prod". Validate first with `sf project deploy validate`, have the result reviewed, then release it with `sf project deploy quick --job-id <id>`. (Set deploy.allowDirectProductionDeploy to true in .claude/sf-sdlc.json to change this policy.)' } }),
      effect: ['deny', 'DENY', 'The command never runs. Claude reads the reason and offers to validate first.']
    }, {
      label: 'Bash · git push', handler: 'pre-bash',
      when: 'Before every shell command. The branch guard stops pushes to protected branches (git.protectedBranches).',
      in: j(input({ hook_event_name: 'PreToolUse', permission_mode: 'default', tool_name: 'Bash', tool_input: { command: 'git push origin main', description: 'Push the change' }, tool_use_id: 'toolu_01Gp…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Blocked: direct push to protected branch "main". Push a feature/{ticket}-{slug} branch and open a pull request against develop.' } }),
      effect: ['deny', 'DENY', 'Nothing is pushed. Claude pushes a feature branch and opens a pull request instead.']
    }, {
      label: 'Write · secret', handler: 'pre-write',
      when: 'Before a file is written or edited. The secret guard enforces in every hook mode.',
      in: j(input({ hook_event_name: 'PreToolUse', permission_mode: 'default', tool_name: 'Write', tool_input: { file_path: '/work/acme-salesforce/force-app/main/default/classes/IntegrationService.cls', content: 'public with sharing class IntegrationService {\n  static final String TOKEN = \'00D5g000004XyZq!AQ4AQ…\';\n  …\n}' }, tool_use_id: 'toolu_01Wr…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'Blocked: the content written to "force-app/main/default/classes/IntegrationService.cls" contains a credential (salesforce-access-token). Keep secrets out of source: use a Named Credential, an environment variable or the CLI\'s own auth store.' } }),
      effect: ['deny', 'DENY', 'The file is not written. Claude switches to a Named Credential.']
    }, {
      label: 'MCP · org write', handler: 'pre-mcp',
      when: 'Before a Salesforce Hosted MCP or browser tool. Tools that can change the org always ask, naming the org and its class.',
      in: j(input({ hook_event_name: 'PreToolUse', permission_mode: 'default', tool_name: 'mcp__plugin_sf-sdlc_sf-headless-360__dispatch', tool_input: { method: 'PATCH', path: '/services/data/v62.0/sobjects/Case/500Hn00001XyZ1AAJ', body: { Status: 'Closed' } }, tool_use_id: 'toolu_01Mc…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: 'sf-headless-360 dispatch can change org acme-uat (sandbox). Check the method, URL and body before approving; read the current state first and re-read after.' } }),
      effect: ['ask', 'ASK', 'Claude Code asks you. The change runs only after your yes.']
    }],
    PostToolUse: [{
      label: 'Edit · source check', handler: 'post-write',
      when: 'After Claude writes or edits a Salesforce source file. Fast checks for SOQL/DML in loops, sharing, hard-coded IDs, SeeAllData, LWC innerHTML and more.',
      in: j(input({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: '/work/acme-salesforce/force-app/main/default/classes/AccountService.cls', old_string: '…', new_string: 'for (Account a : accounts) {\n  List<Contact> cs = [SELECT Id FROM Contact WHERE AccountId = :a.Id WITH USER_MODE];\n  …' }, tool_response: { filePath: '…/AccountService.cls', success: true }, tool_use_id: 'toolu_01Ed…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: 'sf-sdlc source check on force-app/main/default/classes/AccountService.cls (1 finding; heuristic — verify, then fix what is real):\n  BLOCKER force-app/main/default/classes/AccountService.cls:42 [apex-soql-in-loop] SOQL inside a loop. Query once before the loop and index the results in a Map.' } }),
      effect: ['ctx', 'FEEDBACK', 'Claude reads the finding straight away and fixes the loop in its next edit.']
    }, {
      label: 'Bash · audit log', handler: 'post-bash',
      when: 'After a shell command that touches an org. The hook prints nothing; it appends a row to the audit log .sf-sdlc/audit.jsonl.',
      in: j(input({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'sf project deploy validate -o acme-uat -l RunLocalTests' }, tool_response: { stdout: 'Status: Succeeded | Job ID: 0AfHn00000AbCdE…', exit_code: 0 }, tool_use_id: 'toolu_01Bs…' })),
      out: '(no output)\n\nAppended to .sf-sdlc/audit.jsonl:\n' + j({ at: '2026-11-19T09:42:07.512Z', user: 'priya', gitUser: 'priya@example.com', session: '4f1c2a9e-…', action: 'deploy validation', topic: 'project deploy validate', targetOrg: 'acme-uat', orgKind: 'sandbox', outcome: 'ok', command: 'sf project deploy validate -o acme-uat -l RunLocalTests', branch: 'feature/US-04-02-revenue-chart' }),
      effect: ['allow', 'LOGGED', 'Every org-affecting command is attributed to a person, a session and a branch.']
    }],
    PostToolUseFailure: [{
      label: 'Bash · deploy fails', handler: 'bash-failure',
      when: 'When an sf command fails. The hook writes an audit entry and gives Claude the likely cause.',
      in: j(input({ hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', tool_input: { command: 'sf project deploy validate -o acme-qa -l RunLocalTests' }, error: 'Error (1): Average test coverage across all Apex Classes and Triggers is 71%, at least 75% test coverage is required.', tool_use_id: 'toolu_01Fa…' })),
      out: j({ hookSpecificOutput: { hookEventName: 'PostToolUseFailure', additionalContext: 'sf-sdlc failure triage (likely cause, verify against the full error):\n- Coverage below the required threshold. Run `sf-sdlc test run` to see per-class coverage and add tests for the classes below target.' } }),
      effect: ['ctx', 'TRIAGE', 'Claude starts from the likely cause instead of guessing, and the failure is in the audit log.']
    }],
    Stop: [{
      label: 'evidence gate', handler: 'stop',
      when: 'When Claude finishes a turn. With hooks.strictEvidence on, a ticked task in tasks.md needs evidence: the command and its result.',
      in: j(input({ hook_event_name: 'Stop', stop_hook_active: false })),
      out: j({ decision: 'block', reason: 'Ticked tasks without evidence (hooks.strictEvidence): T004. Append a one-line note to each (files touched and the check or test result), or untick it.' }),
      effect: ['ask', 'BLOCK', 'Claude does not stop yet: it adds the evidence or unticks the task. With no problem the hook prints nothing.']
    }]
  };

  var title = box.querySelector('[data-hd-title]');
  var handler = box.querySelector('[data-hd-handler]');
  var when = box.querySelector('[data-hd-when]');
  var tabs = box.querySelector('[data-hd-tabs]');
  var inEl = box.querySelector('[data-hd-in]');
  var outEl = box.querySelector('[data-hd-out]');
  var effect = box.querySelector('[data-hd-effect]');
  var picks = demo.querySelectorAll('[data-hk-pick]');

  function variant(ev, k) {
    var v = EX[ev][k];
    tabs.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-selected', String(i === k)); });
    handler.textContent = v.handler;
    when.textContent = v.when;
    inEl.textContent = v.in;
    outEl.textContent = v.out;
    effect.innerHTML = '';
    var b = document.createElement('b'); b.className = v.effect[0]; b.textContent = v.effect[1];
    effect.appendChild(b); effect.appendChild(document.createTextNode(v.effect[2]));
  }
  function show(ev, k, reveal) {
    if (!EX[ev]) return;
    picks.forEach(function (p) { p.setAttribute('aria-pressed', String(p.dataset.hkPick === ev)); });
    title.textContent = ev;
    tabs.innerHTML = '';
    tabs.hidden = EX[ev].length < 2;
    EX[ev].forEach(function (v, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = v.label;
      b.addEventListener('click', function () { variant(ev, i); });
      tabs.appendChild(b);
    });
    variant(ev, k || 0);
    if (reveal) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (window.sfTrack) window.sfTrack('hook_example', { event: ev });
  }
  picks.forEach(function (p) {
    p.addEventListener('click', function () { show(p.dataset.hkPick, 0, true); });
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(p.dataset.hkPick, 0, true); } });
  });
  show('PreToolUse', 0, false);
})();
