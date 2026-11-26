// "In action" tab: agent usage replay and relay, hooks player, browser-testing replay, Langfuse replay.
// Every demo pauses when off screen and starts paused (showing its final frame) for reduced motion.
(function () {
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A looping, pausable sequence. step(i) shows step i; returns the delay before the next step.
  function player(root, count, step, toggleSel) {
    var i = 0, timer = null, paused = reduced, visible = false;
    var btn = root.querySelector(toggleSel);
    function label() { if (btn) { btn.textContent = paused ? 'Play' : 'Pause'; btn.setAttribute('aria-pressed', String(paused)); } }
    function tick() { clearTimeout(timer); var d = step(i); i = (i + 1) % count; if (!paused && visible) timer = setTimeout(tick, d); }
    function run() { clearTimeout(timer); if (!paused && visible) timer = setTimeout(tick, 400); }
    if (btn) btn.addEventListener('click', function () { paused = !paused; label(); run(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; run(); }, { threshold: .25 }).observe(root);
    } else { visible = true; run(); }
    label();
    return {
      jump: function (n) { i = n; clearTimeout(timer); tick(); },
      get paused() { return paused; }
    };
  }

  // ---------------------------------------------------------------- agents relay
  var relay = document.getElementById('agentRelay');
  if (relay) {
    var STEPS = [
      ['discovery', 'The org already exists, so the discovery agent snapshots it read-only and checks the discovery pack against it: 3 statements contradicted, fit-gap item FG-007 "case routing is configuration, not code".'],
      ['mapshift', 'MapShift reads both orgs\' case metadata and maps each source subject onto a target Case Reason: MAP-012, with 4 mappings left for the business to decide.'],
    ['brd', 'The BRD agent reads the workshop transcripts in its own context and writes BR-04, "Sales sees account revenue at a glance".'],
      ['architect', 'The solution architect agent reads the codebase and designs LLD-US-04-02: an LWC on the Account page, an Apex controller, a permission set.'],
      ['plan', 'The planner built into your coding agent (plan mode) writes the spec, the 12-section plan and test-first tasks in the kit\'s format. No code yet.'],
      ['dev', 'The built-in developer, your coding agent itself, builds each task tests first under the project rules and ticks it off with evidence.'],
      ['review', 'The code reviewer agent, which never saw the build, runs Code Analyzer and reviews the change against the Salesforce coding rules, read-only: verdict in review.md.'],
      ['deploy', 'A person starts the deployment: Claude validates against UAT, quick-deploys, and records DEP-005 with a rollback plan.'],
      ['qa', 'The QA agent runs Apex, Jest and browser tests in UAT: TR report with screenshots, and DEF records for anything that fails.'],
      ['release', 'A person starts the release: Claude checks the evidence and drafts REL-1.4.0 notes for a go/no-go.']
    ];
    var steps = relay.querySelectorAll('.relay-step');
    var cards = document.querySelectorAll('#agents .agent-card');
    var pill = relay.querySelector('[data-relay-pill]');
    var text = relay.querySelector('[data-relay-text]');
    var approveTimer;
    function show(n) {
      steps.forEach(function (s, k) { s.classList.toggle('on', k === n); s.classList.toggle('done', k < n); });
      cards.forEach(function (c) { c.classList.toggle('on', (c.dataset.agent || '').split(' ').indexOf(STEPS[n][0]) >= 0); });
      text.textContent = STEPS[n][1];
      pill.textContent = 'Draft written'; pill.classList.remove('ok');
      clearTimeout(approveTimer);
      approveTimer = setTimeout(function () { pill.textContent = n === STEPS.length - 1 ? 'Go/no-go: a person decides' : 'Approved by a person → next stage'; pill.classList.add('ok'); }, 2300);
    }
    var rp = player(relay, STEPS.length, function (n) { show(n); return 3600; }, '[data-relay-toggle]');
    if (reduced) show(STEPS.length - 1);
    steps.forEach(function (s, k) { s.style.cursor = 'pointer'; s.addEventListener('click', function () { rp.jump(k); }); });
  }

  // ---------------------------------------------------------------- hooks player
  var hookDemo = document.getElementById('hookDemo');
  if (hookDemo) {
    // Steps: [kind, a, b, c]. kind: user|tool|say|out|deny|ask|feed|ctx (terminal line), ev (hook event), run|skip (tool box).
    var SCN = {
      start: [
        ['ev', 'SessionStart', 'ctx', 'CONTEXT'],
        ['ctx', '## sf-sdlc project facts\n- Salesforce DX project: force-app; sourceApiVersion 62.0\n- SDLC config loaded: coverage target 85%; pipeline dev → qa → uat → prod\n- Default target org: acme-dev (sandbox)\n- Git branch: feature/US-04-02 (work item US-04-02)\n- Hook mode: enforce'],
        ['say', 'Every session starts knowing the project, which org is which, and the branch.']
      ],
      prod: [
        ['user', 'Deploy the account changes to production'],
        ['tool', 'Bash  sf project deploy start -o acme-prod -x manifest/package.xml'],
        ['ev', 'PreToolUse', 'deny', 'DENY', 'pre-bash'],
        ['skip'],
        ['deny', 'Blocked: direct deploy to production org "acme-prod". Validate first with `sf project deploy validate`, have the result reviewed, then release it with `sf project deploy quick --job-id <id>`.'],
        ['say', 'Production needs a validation first. Shall I validate against acme-prod with RunLocalTests?']
      ],
      secret: [
        ['user', 'Call the reporting org\'s REST API from IntegrationService'],
        ['tool', 'Write  force-app/main/default/classes/IntegrationService.cls'],
        ['ev', 'PreToolUse', 'deny', 'DENY', 'pre-write'],
        ['skip'],
        ['deny', 'Blocked: the content written to "…/IntegrationService.cls" contains a credential (salesforce-access-token). Keep secrets out of source: use a Named Credential, an environment variable or the CLI\'s own auth store.'],
        ['say', 'I\'ll call it through a Named Credential (callout:ReportingOrg) instead.']
      ],
      soql: [
        ['user', 'Update contacts when an account\'s region changes'],
        ['tool', 'Edit  force-app/main/default/classes/AccountService.cls'],
        ['ev', 'PreToolUse', 'allow', 'ALLOW', 'pre-write'],
        ['run'],
        ['ev', 'PostToolUse', 'feed', 'FEEDBACK', 'post-write'],
        ['feed', 'sf-sdlc source check on AccountService.cls (1 finding):\n  BLOCKER AccountService.cls:42 [apex-soql-in-loop] SOQL inside a loop. Query once before the loop and index the results in a Map.'],
        ['say', 'Fixed: one query before the loop, contacts indexed in a Map by AccountId.'],
        ['ev', 'Stop', 'allow', 'OK'],
        ['out', 'stop · evidence gate passed · turn sent to Langfuse']
      ],
      push: [
        ['user', 'Push this to main'],
        ['tool', 'Bash  git push origin main'],
        ['ev', 'PreToolUse', 'deny', 'DENY', 'pre-bash'],
        ['skip'],
        ['deny', 'Blocked: direct push to protected branch "main". Push a feature/{ticket}-{slug} branch and open a pull request against develop.'],
        ['say', 'Pushing feature/US-04-02-revenue-chart and opening a pull request instead.']
      ],
      mcp: [
        ['user', 'Close the three duplicate cases in UAT'],
        ['tool', 'sf-headless-360 · dispatch  PATCH /sobjects/Case ×3'],
        ['ev', 'PreToolUse', 'ask', 'ASK', 'pre-mcp'],
        ['ask', 'sf-headless-360 dispatch can change org acme-uat (sandbox). Check the method, URL and body before approving; read the current state first and re-read after.'],
        ['out', 'You: Yes'],
        ['run'],
        ['out', '3 records updated · re-read: Status = Closed']
      ],
      fail: [
        ['user', 'Validate the release against QA'],
        ['tool', 'Bash  sf project deploy validate -o acme-qa -l RunLocalTests'],
        ['ev', 'PreToolUse', 'allow', 'ALLOW', 'pre-bash'],
        ['run'],
        ['out', 'Error: Average test coverage across all Apex Classes and Triggers is 71%, at least 75% test coverage is required.'],
        ['ev', 'PostToolUseFailure', 'feed', 'TRIAGE'],
        ['feed', 'sf-sdlc failure triage (likely cause):\n- Coverage below the required threshold. Run `sf-sdlc test run` to see per-class coverage and add tests for the classes below target.\n(audit entry written to .sf-sdlc/audit.jsonl)'],
        ['say', 'Two classes are below target. I\'ll add tests for them, then validate again.']
      ]
    };
    var ORDER = ['start', 'prod', 'secret', 'soql', 'push', 'mcp', 'fail'];
    var log = hookDemo.querySelector('[data-hk-log]');
    var evs = hookDemo.querySelectorAll('.hk-ev');
    var toolBox = hookDemo.querySelector('.hk-tool');
    var chips = hookDemo.querySelectorAll('[data-scn]');
    var cur = 0, pos = 0;

    function reset(key) {
      log.innerHTML = '';
      evs.forEach(function (e) { e.className = 'hk-ev'; var v = e.querySelector('.hk-v'); v.className = 'hk-v'; v.textContent = ''; });
      hookDemo.querySelectorAll('[data-ev-handler]').forEach(function (c, k) { c.textContent = k === 0 ? 'pre-bash · pre-write · pre-mcp' : 'post-write · post-bash'; });
      toolBox.className = 'hk-tool'; toolBox.textContent = 'the tool runs';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.scn === key)); });
    }
    function apply(s) {
      var k = s[0];
      if (k === 'ev') {
        evs.forEach(function (e) { if (e.classList.contains('on')) { e.classList.remove('on'); e.classList.add('hit'); } });
        var el = hookDemo.querySelector('.hk-ev[data-ev="' + s[1] + '"]');
        el.classList.add('on');
        var v = el.querySelector('.hk-v'); v.className = 'hk-v ' + s[2]; v.textContent = s[3];
        if (s[4]) el.querySelector('code').textContent = s[4];
      } else if (k === 'run' || k === 'skip') {
        toolBox.className = 'hk-tool ' + (k === 'run' ? 'on' : 'skip');
        toolBox.textContent = k === 'run' ? 'the tool runs' : 'the tool never runs';
      } else {
        var d = document.createElement('div');
        d.className = 'hk-line ' + k; d.textContent = s[1];
        log.appendChild(d);
        requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('in'); }); });
        while (log.children.length > 9) log.removeChild(log.firstChild);
      }
    }
    function finish() { evs.forEach(function (e) { if (!e.classList.contains('on') && !e.classList.contains('hit')) e.classList.add('dim'); }); }
    // A flat list of (scenario, step) pairs so the generic player can loop through every scenario.
    var FLAT = [];
    ORDER.forEach(function (key, si) { FLAT.push([si, -1]); SCN[key].forEach(function (_, k) { FLAT.push([si, k]); }); FLAT.push([si, 'end']); });
    function stepAt(n) {
      var f = FLAT[n], key = ORDER[f[0]];
      cur = f[0];
      if (f[1] === -1) { reset(key); return 500; }
      if (f[1] === 'end') { finish(); return 3600; }
      apply(SCN[key][f[1]]);
      return SCN[key][f[1]][0] === 'ev' ? 900 : 1300;
    }
    var hp = player(hookDemo, FLAT.length, stepAt, '[data-hook-toggle]');
    function showAll(key) { reset(key); SCN[key].forEach(apply); finish(); hookDemo.querySelectorAll('.hk-line').forEach(function (l) { l.classList.add('in'); }); }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var si = ORDER.indexOf(c.dataset.scn);
        if (hp.paused) { showAll(c.dataset.scn); return; }
        hp.jump(FLAT.findIndex(function (f) { return f[0] === si; }));
      });
    });
    showAll(reduced ? 'prod' : 'start');
  }

  // ---------------------------------------------------------------- VS Code replays (agents, browser testing)
  // scenes: [{ cls, cap, ms, prompt? }]. Chat messages carry data-at="<scene>" and show from that scene on;
  // elements with data-type-at/data-text are typed out in that scene; `prompt` is typed into the chat box.
  function replay(root, scenes) {
    var screen = root.querySelector('.screen');
    var msgs = root.querySelectorAll('.cc-msg[data-at]');
    var typed = root.querySelectorAll('[data-type-at]');
    var input = root.querySelector('[data-cc-typing]');
    var cap = root.querySelector('[data-demo-cap]');
    var timers = [];
    function typeInto(el, text, done) {
      var k = 0; el.textContent = '';
      var caret = document.createElement('span'); caret.className = 'tcaret';
      var id = setInterval(function () {
        el.textContent = text.slice(0, ++k); el.appendChild(caret);
        if (k >= text.length) { clearInterval(id); caret.remove(); if (done) done(); }
      }, 45);
      timers.push(id);
    }
    function scene(n, still) {
      timers.forEach(clearInterval); timers = [];
      var sc = scenes[n];
      screen.className = 'screen ' + sc.cls;
      cap.innerHTML = sc.cap;
      msgs.forEach(function (m) { m.classList.toggle('in', +m.dataset.at <= n); });
      typed.forEach(function (el) {
        var at = +el.dataset.typeAt;
        if (at === n && !still) typeInto(el, el.dataset.text); else el.textContent = at <= n ? el.dataset.text : '';
      });
      input.textContent = '';
      if (sc.prompt && !still) typeInto(input, sc.prompt);
      return sc.ms;
    }
    player(root, scenes.length, function (n) { return scene(n); }, '[data-demo-toggle]');
    scene(reduced ? (scenes.finalIndex || scenes.length - 1) : 0, reduced);
  }

  var ad = document.getElementById('agentDemo');
  if (ad) replay(ad, [
    { cls: '', prompt: '/sf-sdlc:brd docs/sdlc/00-inputs/', ms: 3000, cap: 'The workshop transcript and emails are in <code>docs/sdlc/00-inputs/</code>. You start the BRD stage with one command.' },
    { cls: '', ms: 2600, cap: '<b>1.</b> Claude hands the work to the <b>sdlc-brd-agent</b>: one of the kit\'s six agents, with its own context for the long transcripts, only file tools, and the BRD method skill.' },
    { cls: '', ms: 2200, cap: '<b>2.</b> It reads every input: transcripts, notes, emails.' },
    { cls: 's-brd s-pane2', ms: 3000, cap: '<b>3.</b> It writes a draft BRD with traceable IDs (<code>BR-04</code> → <code>FR-04.2</code>), citing the transcript line behind each requirement, and lists open questions.' },
    { cls: 's-brd s-pane2', ms: 3000, cap: '<b>4.</b> Then it stops. Nothing moves on until a person has reviewed the draft.' },
    { cls: 's-brd s-pane2 s-approve', ms: 3200, cap: '<b>5.</b> You review it and fill in the approval record yourself. Agents never approve their own work.' },
    { cls: 's-brd s-pane2 s-approve', prompt: '/sf-sdlc:stories', ms: 2400, cap: '<b>6.</b> When you are ready, you start the next stage.' },
    { cls: 's-brd s-pane2 s-approve', ms: 2800, cap: '<b>7.</b> Stories run in the <b>main conversation</b>, guided by the <b>sdlc-jira-story-generate</b> skill: Claude checks that the BRD is approved, reads it, and follows your team\'s Jira process template.' },
    { cls: 's-brd s-backlog s-pane2 s-approve', ms: 5000, cap: '<b>8.</b> It writes the backlog and a Jira import file as a draft. Every stage works the same way, in an agent or in your conversation: one command, one draft, one approval.' }
  ]);

  var bd = document.getElementById('browserDemo');
  if (bd) {
    var bscenes = [
      { cls: '', prompt: '/sf-sdlc:ui-test TC-US-04-02-007 uat', ms: 2800, cap: 'You ask Claude Code, in VS Code, to run a UI test case from the test design.' },
      { cls: '', ms: 2600, cap: '<b>1.</b> The <b>QA agent</b> picks the case up and asks the kit for the sandbox address (sandbox orgs only, never a session link).' },
      { cls: '', ms: 1800, cap: '<b>2.</b> It calls <code>browser_navigate</code>. The <code>pre-mcp</code> hook checks the org is a sandbox before the browser may open it.' },
      { cls: 's-browser s-loading', ms: 1900, cap: '<b>3.</b> Playwright opens Chrome on the Account record page, signed in from the kept browser profile.' },
      { cls: 's-browser s-loading s-loaded s-chart s-broken', ms: 2400, cap: '<b>4.</b> The <code>accountRevenueChart</code> Lightning Web Component renders, but something is off.' },
      { cls: 's-browser s-loaded s-chart s-broken s-bad s-shot', ms: 4200, cap: '<b>5.</b> The agent takes a screenshot and checks it against the expected result: the chart spills out of its card and the month labels sit off their bars. The case fails and <code>DEF-012</code> is logged with the screenshot.' },
      { cls: 's-pane2', ms: 4200, cap: '<b>6.</b> You ask for the fix. Claude, in the <b>main conversation</b>, finds the cause in <code>accountRevenueChart.css</code>: a fixed 120% width and a stray left padding on the axis.' },
      { cls: 's-pane2', ms: 2800, cap: '<b>7.</b> It deploys just that component to the UAT sandbox. The <code>pre-bash</code> hook allows it because UAT is not production.' },
      { cls: 's-pane2 s-browser s-loaded s-chart s-good', ms: 3000, cap: '<b>8.</b> The re-test opens the same page again: the chart now fits its card and every label sits under its bar.' },
      { cls: 's-pane2 s-browser s-loaded s-chart s-good s-shot', ms: 2400, cap: '<b>9.</b> A new screenshot. The defect closes only when a passing run is cited: <code>DEF-012</code> → Fixed.' },
      { cls: 's-pane2', ms: 4200, cap: '<b>10.</b> Both screenshots, before and after, stay in the test-run evidence.' }
    ];
    bscenes.finalIndex = 9;
    replay(bd, bscenes);
  }

  // ---------------------------------------------------------------- Langfuse replay
  var lf = document.getElementById('langfuseDemo');
  if (lf) {
    // Timeline rows: [type, name, left %, width %, label]. Total turn: 5m 48s.
    var ROWS = [
      ['gen', 'Claude Response', 1, 2.5, '10.69s  $0.0959'], ['tool', 'Tool: Bash', 4, 11, '41.28s · sf-sdlc deploy validate'],
      ['gen', 'Claude Response', 15.5, 1.2, '2.81s  $0.0752'], ['tool', 'Tool: Bash', 17, 3, '10.03s'],
      ['gen', 'Claude Response', 20.5, 4.6, '16.22s  $0.1092'], ['tool', 'Tool: Bash', 25.5, 1, '308ms'],
      ['gen', 'Claude Response', 27, 3.2, '10.96s  $0.1075'], ['tool', 'Tool: Bash', 31, 14, '50.90s · deploy quick'],
      ['gen', 'Claude Response', 46, 1.2, '3.77s  $0.0744'], ['tool', 'Tool: Bash', 48, 8, '27.31s'],
      ['gen', 'Claude Response', 57, 3.2, '11.22s  $0.0969'], ['tool', 'Tool: Bash', 61, 23, '1m 20s · test run'],
      ['gen', 'Claude Response', 85, 1, '2.96s  $0.0752'], ['tool', 'Tool: Bash', 87, 1.6, '4.84s'],
      ['gen', 'Claude Response', 89.5, 2, '6.50s  $0.0832'], ['tool', 'Tool: Bash', 92, 4, '13.77s · write DEP-005'],
      ['gen', 'Claude Response', 97, 1, '923ms  $0.0746']
    ];
    var COLORS = { gen: 'c-gen', tool: 'c-tool' };
    var holder = lf.querySelector('[data-lf-rows]');
    function row(cls, name, l, w, label, icon) {
      var r = document.createElement('div');
      r.className = 'lf-row ' + cls;
      var right = l + w > 70;
      r.innerHTML = '<span class="nm"><i class="' + icon + '"></i></span><span class="bar" style="--l:' + l + '%;--w:' + w + '%"><i class="' + icon + '"></i><em' + (right && cls !== 'root' ? ' class="lft"' : '') + '></em></span>';
      r.querySelector('.nm').appendChild(document.createTextNode(name));
      r.querySelector('em').textContent = label;
      holder.appendChild(r);
      return r;
    }
    var rows = [row('root', '↔ Claude Code - Turn 3', 0, 99, '5m 48s  $0.856', 'c-root')];
    ROWS.forEach(function (d) { rows.push(row('', d[1], d[2], d[3], d[4], COLORS[d[0]])); });

    var views = lf.querySelectorAll('[data-lf-view]');
    var lchips = lf.querySelectorAll('[data-lf]');
    var navs = lf.querySelectorAll('[data-lf-nav]');
    var lcap = lf.querySelector('[data-lf-cap]');
    var CAPS = {
      timeline: 'Each turn is a trace. The timeline shows every model response (pink) and tool call (orange) with its duration and cost, here a validate-and-deploy to UAT.',
      graph: 'The graph view shows how the turn moved between Claude and its tools: ten responses, nine Bash calls.',
      dash: 'Dashboards add it up across sessions and people: traces, observations, total cost, cost by model and by environment.'
    };
    var rowTimers = [];
    function count(el) {
      var to = parseFloat(el.dataset.count), pre = el.dataset.prefix || '', dec = String(el.dataset.count).indexOf('.') > -1 ? 2 : 0, t0 = performance.now();
      (function f(t) { var p = Math.min(1, (t - t0) / 1100); el.textContent = pre + (to * (1 - Math.pow(1 - p, 3))).toFixed(dec); if (p < 1) requestAnimationFrame(f); })(t0);
    }
    function view(name) {
      views.forEach(function (v) { v.classList.toggle('on', v.dataset.lfView === name); });
      lchips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.lf === name)); });
      navs.forEach(function (n) { n.classList.toggle('on', (n.dataset.lfNav === 'dash') === (name === 'dash')); });
      lcap.textContent = CAPS[name];
      rowTimers.forEach(clearTimeout); rowTimers = [];
      if (name === 'timeline') {
        rows.forEach(function (r, k) {
          if (reduced) { r.classList.add('in'); return; }
          r.classList.remove('in');
          rowTimers.push(setTimeout(function () { r.classList.add('in'); }, 150 + k * 260));
        });
      }
      if (name === 'dash') lf.querySelectorAll('[data-count]').forEach(function (el) {
        if (reduced) el.textContent = (el.dataset.prefix || '') + el.dataset.count; else count(el);
      });
    }
    var NAMES = ['timeline', 'graph', 'dash'];
    var DUR = [7600, 4600, 5600];
    var lp = player(lf, 3, function (n) { view(NAMES[n]); return DUR[n]; }, '[data-lf-toggle]');
    lchips.forEach(function (c) { c.addEventListener('click', function () { if (lp.paused) view(c.dataset.lf); else lp.jump(NAMES.indexOf(c.dataset.lf)); }); });
    view('timeline');
  }
})();
