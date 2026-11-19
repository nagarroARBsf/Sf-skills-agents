'use strict';
// Unit tests for the sf-sdlc hooks and CLI library. Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const KIT = path.join(__dirname, '..', '.claude');
const lib = require(path.join(KIT, 'hooks', 'lib.js'));
const ops = require(path.join(KIT, 'hooks', 'ops.js'));
const checks = require(path.join(KIT, 'hooks', 'checks.js'));
const hooks = require(path.join(KIT, 'hooks', 'run.js'));
const mcp = require(path.join(KIT, 'hooks', 'mcp.js'));
const browser = require(path.join(KIT, 'hooks', 'browser.js'));
const envfile = require(path.join(KIT, 'hooks', 'envfile.js'));

const cfg = (over = {}) => lib.merge(lib.DEFAULTS, over);
const ORGS = [
  { alias: 'prod', username: 'admin@acme.com', instanceUrl: 'https://acme.my.salesforce.com', isSandbox: false },
  { alias: 'uat', username: 'admin@acme.com.uat', instanceUrl: 'https://acme--uat.sandbox.my.salesforce.com', isSandbox: true },
  { alias: 'scratch1', username: 'test-abc@example.com', instanceUrl: 'https://x.scratch.my.salesforce.com', isScratch: true },
  { alias: 'devEd', username: 'me@dev.org', instanceUrl: 'https://me-dev-ed.develop.my.salesforce.com' },
];
const lookup = () => ORGS;
const guard = (command, c = cfg()) => lib.sfInvocations(command).map((inv) => hooks.orgGuard(inv, c, os.tmpdir(), lookup));

test('command parsing finds sf invocations in compound commands', () => {
  const inv = lib.sfInvocations('cd app && SF_TARGET_ORG=uat sf project deploy start --source-dir "force app" | tee out.log; echo done');
  assert.strictEqual(inv.length, 1);
  assert.strictEqual(inv[0].topic, 'project deploy start');
  assert.strictEqual(inv[0].env.SF_TARGET_ORG, 'uat');
  assert.strictEqual(lib.flagValue(inv[0].words, ['--source-dir']), 'force app');
  assert.strictEqual(lib.sfInvocations('sfdx force:source:deploy -u prod')[0].topic, 'force source deploy');
  assert.deepStrictEqual(lib.sfInvocations('echo "sf project deploy start -o prod"'), []);
});

test('org classification', () => {
  assert.strictEqual(lib.classifyOrg('prod', cfg(), '.', lookup).kind, 'production');
  assert.strictEqual(lib.classifyOrg('uat', cfg(), '.', lookup).kind, 'sandbox');
  assert.strictEqual(lib.classifyOrg('scratch1', cfg(), '.', lookup).kind, 'scratch');
  assert.strictEqual(lib.classifyOrg('devEd', cfg(), '.', lookup).kind, 'developer');
  assert.strictEqual(lib.classifyOrg('nope', cfg(), '.', lookup).kind, 'unknown');
  assert.strictEqual(lib.classifyOrg(undefined, cfg(), '.', lookup).kind, 'unknown');
  // A config entry wins over what the org looks like, and works when the CLI cannot list orgs.
  assert.strictEqual(lib.classifyOrg('uat', cfg({ orgs: { production: ['uat'] } }), '.', () => null).kind, 'production');
  assert.strictEqual(lib.classifyOrg('uat', cfg(), '.', () => null).kind, 'unknown');
});

test('org guard: production', () => {
  assert.strictEqual(guard('sf project deploy start -o prod --source-dir force-app')[0].decision, 'deny');
  assert.strictEqual(guard('sf project deploy start -o prod --dry-run')[0].decision, 'ask');
  assert.strictEqual(guard('sf project deploy validate -o prod -l RunLocalTests')[0].decision, 'ask');
  assert.strictEqual(guard('sf project deploy quick --job-id 0Af -o prod')[0].decision, 'ask');
  assert.strictEqual(guard('sf project deploy validate --target-org=prod --test-level NoTestRun')[0].decision, 'deny');
  assert.strictEqual(guard('sf data delete bulk -o prod -s Account -f x.csv')[0].decision, 'ask');
  assert.strictEqual(guard('sf apex run -o prod -f script.apex')[0].decision, 'ask');
  const allow = cfg({ deploy: { allowDirectProductionDeploy: true } });
  assert.strictEqual(guard('sf project deploy start -o prod', allow)[0].decision, 'ask');
  assert.strictEqual(guard('sf project deploy start -o prod -l NoTestRun', allow)[0].decision, 'deny');
});

test('org guard: non-production, unknown and read-only', () => {
  assert.strictEqual(guard('sf project deploy start -o uat')[0].decision, 'allow');
  assert.strictEqual(guard('sf project deploy start -o scratch1 -l NoTestRun')[0].decision, 'allow');
  assert.strictEqual(guard('sf project deploy start -o mystery')[0].decision, 'ask');
  assert.strictEqual(guard('sf org delete sandbox -o uat')[0].decision, 'ask');
  assert.strictEqual(guard('sf org delete scratch -o scratch1 --no-prompt')[0].decision, 'allow');
  for (const c of ['sf org list', 'sf apex run test -o prod', 'sf project retrieve start -o prod', 'sf data query -o prod -q "SELECT Id FROM Account"', 'sf project deploy report --job-id 0Af']) {
    assert.strictEqual(guard(c)[0].decision, 'allow', c);
  }
});

test('org guard covers sf-sdlc deploy commands', () => {
  const c = cfg({ orgs: { uat: 'uat', production: ['prod'] } });
  const run = (line) => hooks.kitInvocations(line, c).map((inv) => hooks.orgGuard(inv, c, os.tmpdir(), lookup));
  assert.strictEqual(run('node .claude/bin/sf-sdlc deploy quick --org production --confirmed-production')[0].decision, 'ask');
  assert.strictEqual(run('sf-sdlc deploy validate --org uat')[0].decision, 'allow');
  assert.deepStrictEqual(run('sf-sdlc deploy validate --org production --print'), []);
  assert.deepStrictEqual(run('sf-sdlc doctor'), []);
});

test('branch guard', () => {
  const g = (line, branch = 'feature/ABC-1-x') => lib.gitInvocations(line).map((inv) => hooks.branchGuard(inv, cfg(), '.', branch));
  assert.strictEqual(g('git push origin feature/ABC-1-x')[0].decision, 'allow');
  assert.strictEqual(g('git push')[0].decision, 'allow');
  assert.strictEqual(g('git push', 'main')[0].decision, 'deny');
  assert.strictEqual(g('git push origin HEAD:main')[0].decision, 'deny');
  assert.strictEqual(g('git push origin release/1.2')[0].decision, 'deny');
  const force = g('git -C repo push --force origin main')[0];
  assert.strictEqual(force.decision, 'deny');
  assert.strictEqual(force.hard, true);
  assert.strictEqual(g('git push --force-with-lease origin feature/ABC-1-x')[0].decision, 'allow');
  assert.strictEqual(g('git commit -m "push to main"')[0].decision, 'allow');
});

test('apex checks', () => {
  const rules = (src, f = 'A.cls') => checks.checkFile(f, src).map((x) => x.rule);
  const bad = `public class A {
    public static void run(List<Account> accs) {
        for (Account a : accs) {
            List<Contact> cs = [SELECT Id FROM Contact WHERE AccountId = :a.Id];
            update cs;
        }
        Id x = '001000000000001AAA';
    }
}`;
  assert.deepStrictEqual(rules(bad).sort(), ['apex-dml-in-loop', 'apex-hardcoded-id', 'apex-sharing', 'apex-soql-in-loop']);
  const good = `public with sharing class A {
    // for (x) { insert y; } in a comment is ignored
    public static void run(List<Account> accs) {
        Map<Id, List<Contact>> byAcc = new Map<Id, List<Contact>>();
        for (Contact c : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accs]) {
            if (!byAcc.containsKey(c.AccountId)) { byAcc.put(c.AccountId, new List<Contact>()); }
            byAcc.get(c.AccountId).add(c);
        }
        String s = 'insert this; for (all) { update }';
        update accs;
    }
}`;
  assert.deepStrictEqual(rules(good), []);
  assert.ok(rules('@isTest\nprivate class ATest {\n  @isTest(SeeAllData=true)\n  static void t() { A.run(null); }\n}', 'ATest.cls').includes('apex-seealldata'));
  assert.ok(rules('@isTest\nprivate class ATest {\n  @isTest static void t() { A.run(null); }\n}', 'ATest.cls').includes('apex-test-no-assert'));
  assert.deepStrictEqual(rules('public class MyException extends Exception {}'), []);
  assert.deepStrictEqual(rules('trigger T on Account (before insert) {\n  AccountHandler.run();\n}', 'T.trigger'), []);
  assert.ok(rules('public with sharing class A { void f(List<Account> l) { for (Account a : l) insert a; } }').includes('apex-dml-in-loop'));
});

test('metadata and LWC checks', () => {
  const r = (f, src, ctx) => checks.checkFile(f, src, ctx).map((x) => x.rule);
  assert.ok(r('A.cls-meta.xml', '<ApexClass><apiVersion>52.0</apiVersion></ApexClass>', { apiVersion: '62.0' }).includes('meta-api-version'));
  assert.deepStrictEqual(r('A.cls-meta.xml', '<ApexClass><apiVersion>62.0</apiVersion></ApexClass>', { apiVersion: '62.0' }), []);
  assert.ok(r('Admin.profile-meta.xml', '<Profile/>').includes('meta-profile'));
  assert.ok(r('force-app/main/default/lwc/x/x.js', 'this.el.innerHTML = v;').includes('lwc-innerhtml'));
  assert.deepStrictEqual(r('src/other.js', 'el.innerHTML = v;'), []);
});

test('secret detection', () => {
  // Fake fixtures, assembled at runtime so this file does not itself trip the secret guard or push protection.
  const fakeAuthUrl = 'url = force:' + '//PlatformCLI::5Aep861abcDEFtoken' + '@acme.my.salesforce.com';
  const fakeKey = '-----BEGIN ' + 'PRIVATE KEY-----\nabc';
  assert.deepStrictEqual(checks.findSecrets(fakeAuthUrl), ['salesforce-auth-url']);
  assert.deepStrictEqual(checks.findSecrets(fakeKey), ['private-key']);
  assert.deepStrictEqual(checks.findSecrets('String endpoint = "callout:My_Named_Credential/path";'), []);
  assert.ok(checks.isProtectedPath('.sfdx/user.json'));
  assert.ok(checks.isProtectedPath('config/server.key'));
  assert.ok(!checks.isProtectedPath('force-app/main/default/classes/Key.cls'));
});

test('component mapping and package.xml', () => {
  const c = (f) => ops.componentOf(f, ['force-app']);
  assert.deepStrictEqual(c('force-app/main/default/classes/Foo.cls-meta.xml'), { type: 'ApexClass', apiName: 'Foo' });
  assert.deepStrictEqual(c('force-app/main/default/lwc/myCmp/myCmp.html'), { type: 'LightningComponentBundle', apiName: 'myCmp' });
  assert.deepStrictEqual(c('force-app/main/default/objects/Inv__c/fields/Total__c.field-meta.xml'), { type: 'CustomField', apiName: 'Inv__c.Total__c' });
  assert.deepStrictEqual(c('force-app/main/default/objects/Inv__c/Inv__c.object-meta.xml'), { type: 'CustomObject', apiName: 'Inv__c' });
  assert.deepStrictEqual(c('force-app/main/default/flows/My_Flow.flow-meta.xml'), { type: 'Flow', apiName: 'My_Flow' });
  assert.strictEqual(c('README.md'), null);
  const xml = ops.packageXml([{ type: 'ApexClass', apiName: 'B' }, { type: 'ApexClass', apiName: 'A' }], '62.0');
  assert.match(xml, /<members>A<\/members>\n\s+<members>B<\/members>\n\s+<name>ApexClass<\/name>/);
  assert.match(xml, /<version>62.0<\/version>/);
});

test('config validation', () => {
  const v = (over) => lib.validateConfig({ ...cfg(over), _exists: true });
  assert.ok(v({ orgs: { production: ['prod'] }, project: { code: 'X' } }).ok);
  assert.ok(!v({ deploy: { testLevel: { production: 'NoTestRun' } } }).ok);
  assert.ok(!v({ hooks: { mode: 'loud' } }).ok);
  assert.ok(!v({ quality: { coverageTarget: 50 } }).ok);
  assert.ok(!v({ jira: { enabled: true, projectKey: '' } }).ok);
  assert.ok(v({ mcp: { servers: ['metadata-grounding', 'headless-360', 'data360'] } }).ok);
  assert.ok(v({ mcp: { servers: ['metadata-grounding', 'sobject-all', 'sobject-reads'] } }).ok);
  assert.ok(!v({ mcp: { servers: ['metadata-grounding', 'sobject-everything'] } }).ok);
  assert.ok(!v({ mcp: { servers: 'metadata-grounding' } }).ok);
});

test('catalog and detection rules are consistent', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'skills.json'), 'utf8'));
  const names = new Set(catalog.skills.map((s) => s.name));
  const rules = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules;
  const missing = rules.flatMap((r) => r.skills).filter((s) => !names.has(s));
  assert.deepStrictEqual([...new Set(missing)], [], 'detection rules name skills that are not in the catalog');
  for (const s of catalog.skills) assert.ok(fs.existsSync(path.join(KIT, s.location, s.name, 'SKILL.md')), s.name);
  // Always-loaded skills are the SDLC process skills plus the kit's own setup skill.
  assert.deepStrictEqual(catalog.skills.filter((s) => s.location === 'skills' && !s.name.startsWith('sdlc-') && s.name !== 'sf-sdlc-setup').map((s) => s.name), []);
});

test('agents and commands reference things that exist', () => {
  const skills = new Set(fs.readdirSync(path.join(KIT, 'skills')));
  const workflows = fs.readdirSync(path.join(KIT, 'workflows')).map((f) => f.replace(/\.js$/, ''));
  const agents = fs.readdirSync(path.join(KIT, 'agents')).map((f) => f.replace(/\.md$/, ''));
  for (const a of agents) {
    const text = fs.readFileSync(path.join(KIT, 'agents', a + '.md'), 'utf8');
    assert.match(text, new RegExp(`^name: ${a}$`, 'm'));
    const m = /^skills:\s*(.+)$/m.exec(text);
    for (const s of (m ? m[1].split(',') : []).map((x) => x.trim())) assert.ok(skills.has(s), `${a} preloads missing skill ${s}`);
  }
  for (const f of fs.readdirSync(path.join(KIT, 'commands'))) {
    const text = fs.readFileSync(path.join(KIT, 'commands', f), 'utf8');
    const m = /Use the \*\*([\w-]+)\*\* subagent/.exec(text);
    if (m) assert.ok(agents.includes(m[1]), `${f} routes to missing agent ${m[1]}`);
    for (const s of text.match(/`(sf-)?sdlc-[a-z-]+`/g) || []) {
      const n = s.replace(/`/g, '');
      assert.ok(skills.has(n) || agents.includes(n) || workflows.includes(n), `${f} names unknown skill, agent or workflow ${n}`);
    }
  }
});

test('kit 3.0: four agents (BRD, architect, code review, QA); the other stages are skills run in the main conversation', () => {
  const agents = fs.readdirSync(path.join(KIT, 'agents')).map((f) => f.replace(/\.md$/, '')).sort();
  assert.deepStrictEqual(agents, ['sdlc-brd-agent', 'sdlc-code-review-agent', 'sdlc-qa-test-agent', 'sdlc-solution-architect-agent']);
  const removed = lib.OBSOLETE_KIT_FILES.filter((f) => f.startsWith('agents/')).map((f) => path.basename(f, '.md'));
  assert.ok(removed.length === 6 && !removed.includes('sdlc-code-review-agent'));
  const scan = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'skill-library' ? [] : scan(path.join(dir, e.name))) : /\.(md|js|json)$/.test(e.name) ? [path.join(dir, e.name)] : []));
  for (const f of scan(KIT)) {
    if (f.endsWith(path.join('hooks', 'lib.js'))) continue; // the obsolete-file list names them on purpose
    const text = fs.readFileSync(f, 'utf8');
    for (const r of [...removed, 'sdlc-project-setup']) assert.ok(!text.includes(r), `${path.relative(KIT, f)} still mentions ${r}`);
  }
  for (const c of ['sdd-plan', 'sdd-implement', 'sdlc-deploy', 'sdlc-release', 'sdlc-stories', 'sdlc-skills', 'sdlc-setup']) {
    const body = fs.readFileSync(path.join(KIT, 'commands', c + '.md'), 'utf8').split(/^---\s*$/m)[2];
    assert.doesNotMatch(body, /subagent to/, `${c} runs in the main conversation`);
  }
  for (const c of ['sdlc-deploy', 'sdlc-release']) assert.match(fs.readFileSync(path.join(KIT, 'commands', c + '.md'), 'utf8'), /^disable-model-invocation: true$/m, `${c} is started by a person only`);
  const qa = fs.readFileSync(path.join(KIT, 'agents', 'sdlc-qa-test-agent.md'), 'utf8');
  assert.match(qa, /^skills:.*\bsdlc-ui-testing\b/m, 'the QA agent preloads the UI testing skill');
  assert.match(fs.readFileSync(path.join(KIT, 'commands', 'sdlc-ui-test.md'), 'utf8'), /Use the \*\*sdlc-qa-test-agent\*\* subagent/);
  // The reviewer is independent and read-only: its own context, no file-writing tools, Code Analyzer run.
  const review = fs.readFileSync(path.join(KIT, 'agents', 'sdlc-code-review-agent.md'), 'utf8');
  assert.match(review, /^tools: Read, Glob, Grep, Bash$/m, 'the review agent cannot write files');
  assert.match(review, /^skills:.*\bsdlc-code-review\b/m);
  assert.match(review, /sf-sdlc analyze --changed/);
  assert.match(fs.readFileSync(path.join(KIT, 'commands', 'sdlc-review.md'), 'utf8'), /Use the \*\*sdlc-code-review-agent\*\* subagent/);
});

test('plan mode follows the spec-driven plan format', () => {
  const md = fs.readFileSync(path.join(KIT, 'CLAUDE.md'), 'utf8');
  assert.match(md, /plan mode is on/);
  assert.match(md, /12 sections/);
  assert.match(fs.readFileSync(path.join(KIT, 'skills', 'sdlc-spec-driven-development', 'SKILL.md'), 'utf8'), /## Plan mode and planning requests/);
});

test('output styles: business analyst, developer, manager', () => {
  const styles = fs.readdirSync(path.join(KIT, 'output-styles')).sort();
  assert.deepStrictEqual(styles, ['sf-business-analyst.md', 'sf-developer.md', 'sf-manager.md']);
  for (const s of styles) {
    const text = fs.readFileSync(path.join(KIT, 'output-styles', s), 'utf8');
    assert.match(text, /^name: Salesforce (Business Analyst|Developer|Manager)$/m, s);
    assert.match(text, /^keep-coding-instructions: true$/m, s);
  }
});

test('paths.* must stay inside the project', () => {
  assert.ok(lib.validateConfig(cfg()).ok);
  assert.match(lib.validateConfig(cfg({ paths: { docs: 'docs/sdlc', specs: 'specs', templates: '../shared' } })).errors.join(), /paths\.templates must stay inside/);
  assert.match(lib.validateConfig(cfg({ paths: { docs: '', specs: 'specs', templates: 't' } })).errors.join(), /paths\.docs must be a folder/);
});

test('CLI: templates list and copy into paths.templates, never overwriting; doctor names stale 2.x files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-tpl-'));
  const cli = (...a) => JSON.parse(spawnSync('node', [path.join(KIT, 'bin', 'sf-sdlc'), ...a, '--json'], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } }).stdout);
  const list = cli('templates', 'list');
  assert.strictEqual(list.folder, 'docs/sdlc/templates');
  const ids = list.templates.map((x) => x.id);
  for (const id of ['jira/jira-process-template.md', 'jira/story-template.md', 'jira/jira-csv-import.md', 'brd/brd-template.md', 'spec/plan-template.md', 'release/release-notes-template.md']) assert.ok(ids.includes(id), id);
  assert.ok(list.templates.every((x) => !x.overridden));
  const first = cli('templates', 'copy', 'jira');
  assert.strictEqual(first.copied.length, 4);
  const f = path.join(dir, 'docs/sdlc/templates/jira/jira-process-template.md');
  fs.writeFileSync(f, 'our process');
  const again = cli('templates', 'copy', 'jira/jira-process-template.md');
  assert.deepStrictEqual(again.copied, []);
  assert.strictEqual(fs.readFileSync(f, 'utf8'), 'our process', 'a team copy is never overwritten');
  assert.ok(cli('templates', 'list').templates.find((x) => x.id === 'jira/jira-process-template.md').overridden);
  assert.strictEqual(cli('templates', 'copy', 'nope').ok, false);
  assert.deepStrictEqual(lib.obsoleteKitFiles(dir), []);
  fs.mkdirSync(path.join(dir, '.claude/agents'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/agents/sdlc-plan-agent.md'), 'x');
  assert.deepStrictEqual(lib.obsoleteKitFiles(dir), [path.join('.claude', 'agents', 'sdlc-plan-agent.md')]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('CLI: init, skills install/sync/remove in a temp project', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-'));
  fs.mkdirSync(path.join(dir, 'force-app/main/default/classes'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'sfdx-project.json'), JSON.stringify({ packageDirectories: [{ path: 'force-app' }], sourceApiVersion: '62.0' }));
  fs.writeFileSync(path.join(dir, 'force-app/main/default/classes/A.cls'), 'public with sharing class A {}');
  const cli = (...a) => {
    const r = spawnSync('node', [path.join(KIT, 'bin', 'sf-sdlc'), ...a, '--json'], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
    return { status: r.status, json: JSON.parse(r.stdout) };
  };
  const created = cli('init').json.created;
  assert.ok(created.includes('.claude/sf-sdlc.json'));
  assert.ok(created.includes('.github/workflows/sf-code-analyzer.yml'));
  assert.ok(created.some((c) => c.startsWith('.mcp.json')));
  const servers = JSON.parse(fs.readFileSync(path.join(dir, '.mcp.json'), 'utf8')).mcpServers;
  assert.deepStrictEqual(Object.keys(servers).sort(), ['atlassian-token', 'sf-browser', 'sf-data360', 'sf-headless-360', 'sf-metadata-experts', 'sf-metadata-grounding', 'sf-sobject-all', 'sf-sobject-reads']);
  assert.ok(created.some((c) => c.startsWith('.env (created')), 'init creates the .env template');
  assert.ok(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8').split('\n').includes('.env'), '.env is git-ignored');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'rules')), 'the copy-in folder already holds its rules; init does not write them');
  assert.match(fs.readFileSync(path.join(dir, 'code-analyzer.yml'), 'utf8'), /NoHardcodedSalesforceIds/);
  assert.ok(cli('init').json.skipped.some((c) => c.startsWith('.mcp.json')), 'a second init keeps .mcp.json');
  assert.ok(cli('config', 'validate').json.ok);
  const rec = cli('skills', 'recommend').json;
  assert.ok(rec.toInstall.includes('platform-apex-generate'));
  assert.ok(rec.toInstall.includes('platform-metadata-grounding-get'), 'grounding is recommended while metadata-grounding is enabled');
  assert.ok(rec.toInstall.includes('platform-headless-360-integrate') && rec.toInstall.includes('drawio-skill'), 'every platform-* skill and draw.io are mandatory');
  assert.ok(!rec.toInstall.some((s) => s.startsWith('experience-portal')), 'other families stay on demand');
  assert.ok(!rec.toInstall.some((s) => s.startsWith('omnistudio-')));
  assert.strictEqual(cli('skills', 'install', 'platform-soql-query').json.results[0].result, 'installed');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'ok');
  fs.appendFileSync(path.join(dir, '.claude/skills/platform-soql-query/SKILL.md'), '\nlocal edit\n');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'modified');
  assert.match(cli('skills', 'remove', 'platform-soql-query').json.results[0].result, /locally modified/);
  assert.strictEqual(cli('inventory').json.counts.ApexClass, 1);
  const coreRule = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules.find((r) => r.id === 'core');
  const names = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'skills.json'), 'utf8')).skills.map((x) => x.name);
  const core = [...new Set([...coreRule.skills, ...names.filter((n) => coreRule.skillPrefixes.some((p) => n.startsWith(p)))])];
  assert.deepStrictEqual(cli('skills', 'recommend', '--profile', 'ba').json.recommended.map((s) => s.name).sort(), [...core].sort(), 'a business analyst gets the core set only');
  assert.ok(core.every((s) => rec.recommended.some((r) => r.name === s)), 'every project gets the core set');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('.env: names only, never values; template is appended, never rewritten', () => {
  const envfile = require(path.join(KIT, 'hooks', 'envfile.js'));
  assert.deepStrictEqual(envfile.parse('# c\nexport A=1\nB="two words"\nC=x # note\nbad line\nD=\n'), { A: '1', B: 'two words', C: 'x', D: '' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-env-'));
  assert.strictEqual(envfile.status(dir).exists, false);
  fs.writeFileSync(path.join(dir, '.env'), 'JIRA_URL=https://acme.atlassian.net\nJIRA_USERNAME=me@acme.com\nJIRA_API_TOKEN=s3cr3t-token\nOTHER=keep\n');
  const st = envfile.status(dir);
  assert.strictEqual(st.groups.jira.state, 'configured');
  assert.strictEqual(st.groups.confluence.state, 'empty');
  assert.strictEqual(st.gitignored, false);
  assert.doesNotMatch(JSON.stringify(st), /s3cr3t|acme/, 'status never carries values');
  const r = envfile.ensure(dir);
  assert.strictEqual(r.result, 'appended');
  assert.ok(r.added.includes('GITHUB_TOKEN') && !r.added.includes('JIRA_URL'));
  const after = envfile.read(dir);
  assert.strictEqual(after.JIRA_API_TOKEN, 's3cr3t-token');
  assert.strictEqual(after.OTHER, 'keep');
  assert.strictEqual(envfile.ensure(dir).result, 'kept');
  assert.strictEqual(envfile.childEnv(dir, ['JIRA_API_TOKEN', 'GITHUB_TOKEN'], {}).JIRA_API_TOKEN, 's3cr3t-token');
  assert.strictEqual(envfile.childEnv(dir, ['JIRA_API_TOKEN', 'GITHUB_TOKEN'], {}).GITHUB_TOKEN, undefined, 'empty values are not passed on');
  const cli = spawnSync('node', [path.join(KIT, 'bin', 'sf-sdlc'), 'env', 'status'], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  assert.match(cli.stdout, /Jira.*configured/);
  assert.match(cli.stdout, /NOT git-ignored/);
  assert.doesNotMatch(cli.stdout + cli.stderr, /s3cr3t|acme/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('sf-atlassian-mcp: runs only with a complete token, never fails the handshake', () => {
  const { plan } = require(path.join(KIT, 'bin', 'sf-atlassian-mcp'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-atl-'));
  assert.match(plan(dir, () => true).reason, /no \.env/);
  fs.writeFileSync(path.join(dir, '.env'), 'JIRA_URL=https://acme.atlassian.net\nJIRA_USERNAME=me\nJIRA_API_TOKEN=\n');
  assert.match(plan(dir, () => true).reason, /no complete Jira or Confluence token/);
  fs.writeFileSync(path.join(dir, '.env'), 'JIRA_URL=https://acme.atlassian.net\nJIRA_USERNAME=me\nJIRA_API_TOKEN=t\nATLASSIAN_MCP_PACKAGE=mcp-atlassian==1.0.0\n');
  assert.deepStrictEqual(plan(dir, (c) => c === 'uvx'), { on: ['jira'], cmd: 'uvx', args: ['mcp-atlassian==1.0.0'] });
  const docker = plan(dir, (c) => c === 'docker');
  assert.strictEqual(docker.cmd, 'docker');
  assert.ok(docker.args.includes('JIRA_API_TOKEN') && !docker.args.some((a) => a.includes('=t')), 'docker gets key names, not values, on its command line');
  assert.match(plan(dir, () => false).reason, /neither uv/);
  fs.rmSync(path.join(dir, '.env'));
  const input = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }].map((m) => JSON.stringify(m)).join('\n') + '\n';
  const r = spawnSync('node', [path.join(KIT, 'bin', 'sf-atlassian-mcp')], { cwd: dir, input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, timeout: 20000 });
  const replies = r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  assert.match(replies[0].result.serverInfo.name, /atlassian-token \(inactive\)/);
  assert.deepStrictEqual(replies[1].result.tools, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('plugin init: project-scope plugin, .env read-deny, rules as project files, edits kept', () => {
  const PLUGIN = path.join(__dirname, '..', 'plugins', 'sf-sdlc');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-plugin-'));
  fs.mkdirSync(path.join(dir, '.claude'));
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify({ model: 'opus', permissions: { allow: ['Bash(npm test)'] } }));
  const cli = (...a) => JSON.parse(spawnSync('node', [path.join(PLUGIN, 'bin', 'sf-sdlc'), ...a, '--json'], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } }).stdout);
  const first = cli('init');
  assert.ok(first.created.some((c) => c.startsWith('.claude/settings.json (merged')));
  const s = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.strictEqual(s.model, 'opus', 'existing keys are kept');
  assert.ok(s.permissions.allow.includes('Bash(npm test)') && s.permissions.allow.includes('Bash(sf-sdlc doctor*)'));
  assert.ok(s.permissions.deny.includes('Read(./.env)'));
  assert.strictEqual(s.enabledPlugins['sf-sdlc@nagarro-sf'], true);
  assert.strictEqual(s.extraKnownMarketplaces['nagarro-sf'].source.source, 'github');
  assert.strictEqual(s.hooks, undefined, 'the plugin supplies the hooks; the project must not run them twice');
  const kitRule = path.join(dir, '.claude', 'rules', lib.KIT_RULE_FILE);
  assert.match(fs.readFileSync(kitRule, 'utf8'), /\/sf-sdlc:setup/);
  assert.match(fs.readFileSync(path.join(dir, '.claude', 'rules', 'salesforce-apex.md'), 'utf8'), /^---\n(.+\n)*paths:\n {2}- "\*\*\/\*\.cls"/);
  const second = cli('init');
  assert.ok(second.skipped.includes('.claude/settings.json (already up to date)'));
  assert.ok(second.skipped.includes(`.claude/rules/${lib.KIT_RULE_FILE} (up to date)`));
  fs.appendFileSync(kitRule, '\nTeam note.\n');
  assert.ok(cli('init').skipped.includes(`.claude/rules/${lib.KIT_RULE_FILE} (locally modified; not overwritten)`));
  // SessionStart stops printing the kit instructions once the project holds them as a rule.
  const hook = (d) => spawnSync(process.execPath, [path.join(PLUGIN, 'hooks', 'run.js'), 'session-start'], { input: JSON.stringify({ cwd: d }), encoding: 'utf8', env: { PATH: path.dirname(process.execPath), CLAUDE_PROJECT_DIR: d } }).stdout;
  assert.doesNotMatch(hook(dir), /# Salesforce project — AI delivery kit/);
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-bare-'));
  assert.match(hook(bare), /# Salesforce project — AI delivery kit/);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(bare, { recursive: true, force: true });
});

test('hosted MCP: routes, tool names, replies and config', () => {
  assert.strictEqual(mcp.serverUrl('metadata-grounding', {}), 'https://api.salesforce.com/platform/mcp/v1-beta.2/platform/metadata-grounding');
  assert.strictEqual(mcp.serverUrl('data360', {}), 'https://api.salesforce.com/platform/mcp/v1-beta.2/data/data360');
  assert.throws(() => mcp.serverUrl('metadata-grounding', { SF_SDLC_MCP_HOST: 'evil.example.com' }), /salesforce\.com/);
  assert.throws(() => mcp.serverUrl('nope', {}), /unknown/);
  assert.deepStrictEqual(mcp.parseToolName('mcp__sf-headless-360__dispatch'), { server: 'headless-360', tool: 'dispatch', writes: true });
  assert.deepStrictEqual(mcp.parseToolName('mcp__plugin_sf-sdlc_sf-headless-360__dispatch_readonly'), { server: 'headless-360', tool: 'dispatch_readonly', writes: false });
  assert.strictEqual(mcp.parseToolName('mcp__plugin_sf-sdlc_sf-data360__execute').writes, true);
  assert.strictEqual(mcp.parseToolName('mcp__sf-metadata-grounding__search_metadata').writes, false);
  assert.strictEqual(mcp.parseToolName('mcp__jira__jira_search'), null);
  assert.strictEqual(mcp.parseToolName('mcp__sf-unknown__x'), null);
  assert.deepStrictEqual(mcp.parseRpcBody('application/json', '{"jsonrpc":"2.0","id":1,"result":{}}'), [{ jsonrpc: '2.0', id: 1, result: {} }]);
  assert.deepStrictEqual(mcp.parseRpcBody('text/event-stream', 'event: message\ndata: {"id":2}\n\n: ping\n\ndata: {"id":3}\n\n').map((m) => m.id), [2, 3]);
  assert.strictEqual(mcp.classifyStatus(404, `{"message":"Server 'metadata-grounding' exists but is not active."}`), 'inactive');
  assert.strictEqual(mcp.classifyStatus(401, ''), 'auth');
  assert.strictEqual(mcp.classifyStatus(202, ''), 'ok');
  assert.strictEqual(mcp.classifyStatus(500, ''), 'unreachable');
  assert.deepStrictEqual(mcp.enabledServers(cfg()), ['metadata-experts', 'metadata-grounding', 'sobject-reads']);
  assert.deepStrictEqual(mcp.enabledServers(cfg({ mcp: { servers: ['headless-360', 'bogus'] } })), ['headless-360']);
  const c = cfg({ orgs: { dev: 'my-dev' }, mcp: { org: 'dev' } });
  assert.strictEqual(mcp.mcpOrg(os.tmpdir(), c, {}), 'my-dev');
  assert.strictEqual(mcp.mcpOrg(os.tmpdir(), c, { SF_TARGET_ORG: 'other' }), 'other');
});

test('hosted MCP guard: org-changing tools always ask', () => {
  const g = (tool, c) => hooks.mcpGuard(tool, c, os.tmpdir(), lookup);
  const ask = g('mcp__sf-headless-360__dispatch', cfg({ mcp: { org: 'prod' } }));
  assert.strictEqual(ask.decision, 'ask');
  assert.match(ask.reason, /prod \(production\)/);
  const uat = g('mcp__plugin_sf-sdlc_sf-data360__execute', cfg({ mcp: { org: 'uat' } }));
  assert.strictEqual(uat.decision, 'ask');
  assert.doesNotMatch(uat.reason, /production-class/);
  assert.match(g('mcp__sf-headless-360__dispatch', cfg({ mcp: { org: 'ghost' } })).reason, /unknown, treated as production/);
  assert.strictEqual(g('mcp__sf-headless-360__dispatch_readonly', cfg({ mcp: { org: 'prod' } })).decision, 'allow');
  assert.strictEqual(g('mcp__sf-metadata-grounding__search_metadata', cfg()).decision, 'allow');
  // sobject-all: tool names are not known to the kit, so everything asks unless it is plainly a read.
  for (const t of ['create_record', 'updateRecord', 'delete_sobject', 'upsert', 'listener_start', 'getaway']) assert.strictEqual(g(`mcp__plugin_sf-sdlc_sf-sobject-all__${t}`, cfg({ mcp: { org: 'uat' } })).decision, 'ask', t);
  for (const t of ['query', 'soql_query', 'describe_sobject', 'getRecord', 'list_objects', 'search']) assert.strictEqual(g(`mcp__sf-sobject-all__${t}`, cfg({ mcp: { org: 'prod' } })).decision, 'allow', t);
  assert.strictEqual(g('mcp__sf-sobject-reads__anything', cfg()).decision, 'allow');
});

test('setup: one run creates files, picks skills from the code inside the budget, and reports a checklist', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-setup-'));
  for (const d of ['classes', 'lwc/a', 'flows', 'objects/A__c', 'permissionsets', 'flexipages', 'aura/b', 'namedCredentials']) fs.mkdirSync(path.join(dir, 'force-app/main/default', d), { recursive: true });
  fs.writeFileSync(path.join(dir, 'sfdx-project.json'), JSON.stringify({ packageDirectories: [{ path: 'force-app' }], sourceApiVersion: '62.0' }));
  fs.writeFileSync(path.join(dir, 'force-app/main/default/classes/A.cls'), 'public with sharing class A {}');
  const cli = (...a) => {
    const r = spawnSync('node', [path.join(KIT, 'bin', 'sf-sdlc'), ...a], { cwd: dir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
    return { status: r.status, out: r.stdout, json: a.includes('--json') ? JSON.parse(r.stdout) : null };
  };
  const first = cli('setup', '--offline', '--json').json;
  const step = (re) => first.steps.find((x) => re.test(x.item));
  assert.strictEqual(step(/Git repository/).state, 'done');
  assert.ok(fs.existsSync(path.join(dir, '.git')), 'setup creates the git repository');
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'sf-sdlc.json')) && fs.existsSync(path.join(dir, '.env')));
  const sk = step(/^Skills for this project/);
  const coreRule = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules.find((r) => r.id === 'core');
  const catalogNames = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'skills.json'), 'utf8')).skills.map((x) => x.name);
  const core = [...coreRule.skills, ...catalogNames.filter((n) => coreRule.skillPrefixes.some((p) => n.startsWith(p)))];
  assert.ok(core.includes('drawio-skill') && core.filter((n) => n.startsWith('platform-')).length > 40, 'the core set is draw.io plus every platform-* skill');
  assert.ok(core.every((n) => sk.installed.includes(n)), 'the core set is always installed');
  assert.ok(fs.existsSync(path.join(dir, '.env.sample')), 'setup writes .env.sample for the team');
  assert.strictEqual(step(/^Browser for UI tests/).state, lib.has('npx') ? 'done' : 'you');
  assert.ok(sk.installed.includes('platform-apex-generate') && sk.installed.includes('experience-lwc-generate'), 'the main skill for each kind of code comes before secondary skills');
  assert.ok(Array.isArray(sk.availableLater), 'what does not fit is listed, not installed');
  assert.ok(sk.installed.includes('experience-aura-lwc-migrate'), 'on-demand skills the code needs are still installed next to the large core set');
  const listing = JSON.parse(cli('skills', 'list', '--json').out).onDemandChars;
  assert.ok(listing <= 8000, `on-demand skills stay inside the listing budget (${listing})`);
  assert.ok(first.steps.every((x) => ['done', 'claude', 'you', 'optional', 'skipped'].includes(x.state)));
  const jira = step(/^Jira/);
  assert.strictEqual(jira.state, 'you');
  assert.match(jira.url, /^https:\/\/id\.atlassian\.com\//, 'a step for the person carries its link');
  assert.match(step(/Other Salesforce MCP servers/).detail, /sobject-all/, 'optional servers are stated, not asked');
  // A second run changes nothing and says so; the text form is a table with the three lists.
  const again = cli('setup', '--offline', '--json').json;
  assert.strictEqual(again.restartNeeded, false);
  assert.deepStrictEqual(again.steps.find((x) => /^Skills for this project/.test(x.item)).added, []);
  const text = cli('setup', '--offline').out;
  assert.match(text, /^## Setup checklist/);
  assert.match(text, /\| ✅ \| Project \| Git repository \|/);
  assert.match(text, /### 👉 Your turn/);
  // Flags record answers without questions.
  assert.strictEqual(cli('setup', '--offline', '--no-jira', '--json').json.steps.find((x) => /^Jira/.test(x.item)).state, 'skipped');
  const ba = cli('setup', '--offline', '--profile', 'ba', '--json').json;
  assert.ok(ba.steps.filter((x) => /MCP server:/.test(x.item)).length === 0, 'requirements work is not asked to turn on org servers');
  // env set: addresses yes, tokens never (and nothing is half-written).
  assert.strictEqual(cli('env', 'set', 'JIRA_URL=https://x.atlassian.net', 'JIRA_USERNAME=a@b.c', '--json').status, 0);
  assert.notStrictEqual(cli('env', 'set', 'CONFLUENCE_URL=https://x.atlassian.net/wiki', 'JIRA_API_TOKEN=secret', '--json').status, 0);
  const env = fs.readFileSync(path.join(dir, '.env'), 'utf8');
  assert.match(env, /^JIRA_URL=https:\/\/x\.atlassian\.net$/m);
  assert.doesNotMatch(env, /secret/);
  assert.match(env, /^CONFLUENCE_URL=$/m);
  // mcp enable / disable edit mcp.servers and refuse unknown names.
  assert.deepStrictEqual(cli('mcp', 'enable', 'headless-360', '--json').json.servers, ['metadata-experts', 'metadata-grounding', 'sobject-reads', 'headless-360']);
  assert.deepStrictEqual(cli('mcp', 'disable', 'metadata-grounding', '--json').json.servers, ['metadata-experts', 'sobject-reads', 'headless-360']);
  assert.notStrictEqual(cli('mcp', 'enable', 'made-up', '--json').status, 0);
  assert.ok(cli('config', 'validate', '--json').json.ok);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('setup command runs in the main conversation, not in a subagent', () => {
  const cmd = fs.readFileSync(path.join(KIT, 'commands', 'sdlc-setup.md'), 'utf8');
  assert.doesNotMatch(cmd.split(/^---\s*$/m)[2], /^\s*Use the \*\*/, 'a subagent cannot ask the person anything');
  assert.match(cmd, /sf-sdlc setup --json/);
});

test('sf-mcp-proxy answers the handshake with no tools when its server is not enabled', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-mcp-'));
  fs.mkdirSync(path.join(dir, '.claude'));
  fs.writeFileSync(path.join(dir, '.claude', 'sf-sdlc.json'), JSON.stringify({ mcp: { servers: [] } }));
  const input = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'x' } },
  ].map((m) => JSON.stringify(m)).join('\n') + '\n';
  const r = spawnSync('node', [path.join(KIT, 'bin', 'sf-mcp-proxy'), 'metadata-grounding'], { cwd: dir, input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, timeout: 20000 });
  const replies = r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  assert.strictEqual(replies.length, 3);
  assert.match(replies[0].result.serverInfo.name, /inactive/);
  assert.deepStrictEqual(replies[1].result.tools, []);
  assert.strictEqual(replies[2].error.code, -32601);
  assert.match(r.stderr, /not listed in mcp\.servers/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// ------------------------------------------------------------------ Salesforce-standard draw.io diagrams

const diagram = require(path.join(KIT, 'hooks', 'diagram.js'));
const EXAMPLES = path.join(KIT, 'skills', 'sdlc-architecture-diagram', 'examples');

test('diagram examples: one per Salesforce type, valid, and their .drawio files are up to date', () => {
  const specs = fs.readdirSync(EXAMPLES).filter((f) => f.endsWith('.diagram.json'));
  const types = new Set();
  for (const f of specs) {
    const spec = JSON.parse(fs.readFileSync(path.join(EXAMPLES, f), 'utf8'));
    types.add(diagram.normaliseType(spec.type));
    const v = diagram.validateSpec(spec);
    assert.deepStrictEqual(v.errors, [], `${f}: ${v.errors.join('; ')}`);
    const xml = diagram.toDrawio(spec);
    const check = diagram.checkDrawio(xml);
    assert.deepStrictEqual(check.problems, [], `${f}: ${check.problems.join('; ')}`);
    assert.deepStrictEqual(check.warnings, [], `${f}: ${check.warnings.join('; ')}`);
    const drawio = path.join(EXAMPLES, f.replace('.diagram.json', '.drawio'));
    assert.strictEqual(fs.readFileSync(drawio, 'utf8'), xml, `${path.basename(drawio)} is stale: run sf-sdlc diagram drawio on ${f} (and export the PNG)`);
    assert.ok(fs.existsSync(drawio.replace(/\.drawio$/, '.png')), `${f}: picture reference missing`);
  }
  assert.deepStrictEqual([...types].sort(), [...diagram.TYPES].sort());
});

test('diagram spec validation refuses what would draw wrong', () => {
  const base = { type: 'solution', title: 'T', description: 'D.', groups: [{ id: 'g' }], cards: [{ id: 'a', title: 'A', group: 'g' }, { id: 'b', title: 'B', group: 'g' }] };
  assert.deepStrictEqual(diagram.validateSpec(base).errors, []);
  const errs = (over) => diagram.validateSpec({ ...base, ...over }).errors.join(' | ');
  assert.match(errs({ type: 'mindmap' }), /type must be one of/);
  assert.match(errs({ description: '' }), /description is required/);
  assert.match(errs({ cards: [{ id: 'a', title: 'A', group: 'g', icon: 'agentforce' }] }), /unknown icon "agentforce"/);
  assert.match(errs({ cards: [{ id: 'a', title: 'A', group: 'nope' }] }), /group "nope" is not defined/);
  assert.match(errs({ connectors: [{ from: 'a', to: 'zz' }] }), /to "zz" is not a card id/);
  assert.match(errs({ connectors: [{ from: 'a', to: 'b', kind: 'telepathy' }] }), /kind must be one of/);
  assert.match(errs({ cards: Array.from({ length: 26 }, (_, i) => ({ id: `c${i}`, title: 'x', group: 'g' })) }), /at most 25/);
  assert.match(errs({ type: 'roadmap', connectors: [{ from: 'a', to: 'b' }] }), /roadmaps have no connectors/);
  assert.throws(() => diagram.toDrawio({ ...base, title: '' }), /title is required/);
});

test('diagram XML escapes text and uses only real Salesforce icons', () => {
  const xml = diagram.toDrawio({ type: 'landscape', title: 'R&D <ops> "x"', description: 'A & B.', cards: [{ id: 'a', title: 'Q&A <b>', icon: 'sales', attributes: ['x < y & z'] }] });
  for (const [, v] of xml.matchAll(/ (?:value|style|name|id)="([^"]*)"/g)) {
    assert.doesNotMatch(v, /[<>]/, `raw angle bracket in attribute: ${v.slice(0, 60)}`);
    assert.doesNotMatch(v, /&(?!(amp|lt|gt|quot|#xa);)/, `bare ampersand in attribute: ${v.slice(0, 60)}`);
  }
  assert.match(xml, /R&amp;amp;D &amp;lt;ops&amp;gt;/, 'user text is HTML-escaped inside the escaped label');
  assert.match(xml, /shape=mxgraph\.salesforce\.sales2;/);
  for (const m of xml.matchAll(/shape=mxgraph\.salesforce\.([^;]+);/g)) assert.ok(diagram.SF_ICONS[m[1]], m[1]);
});

test('diagram check finds edges that will not render and unknown icons', () => {
  const xml = `<mxfile><diagram><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="a" style="shape=mxgraph.salesforce.agentforce;" vertex="1" parent="1"><mxGeometry x="0" y="0" width="10" height="10" as="geometry"/></mxCell>
    <mxCell id="e" edge="1" parent="1" source="a" target="zz"/>
    <mxCell id="a" vertex="1" parent="nope"><mxGeometry as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
  const r = diagram.checkDrawio(xml);
  const all = r.problems.join(' | ');
  assert.match(all, /duplicate cell id "a"/);
  assert.match(all, /edge "e" has no <mxGeometry/);
  assert.match(all, /target "zz" does not exist/);
  assert.match(all, /unknown Salesforce icon "agentforce"/);
  assert.match(all, /parent "nope"/);
  assert.match(r.warnings.join(' '), /no header/);
  assert.match(diagram.checkDrawio('<mxfile><diagram>' + 'A'.repeat(60) + '</diagram></mxfile>').problems[0], /compressed/);
});

test('diagram from components.json: story scope, neighbours, child fields and statuses', () => {
  const comps = [
    { apiName: 'healthPanel', type: 'LightningComponentBundle', status: 'new', story: 'US-04-03', layer: 'ui', dependsOn: ['Ctl'], note: '' },
    { apiName: 'Ctl', type: 'ApexClass', status: 'new', story: 'US-04-03', layer: 'automation', dependsOn: ['Opportunity.Score__c'], note: '' },
    { apiName: 'Other', type: 'ApexClass', status: 'unchanged', story: '', layer: 'automation', dependsOn: [], note: 'in inventory' },
    { apiName: 'Opportunity', type: 'CustomObject', status: 'changed', story: 'US-04-01', layer: 'data', dependsOn: [], note: '' },
    { apiName: 'Opportunity.Score__c', type: 'CustomField', status: 'new', story: 'US-04-01', layer: 'data', dependsOn: ['Opportunity'], note: '' },
  ];
  const spec = diagram.specFromComponents(comps, { story: 'US-04-03' });
  assert.deepStrictEqual(spec.cards.map((c) => c.id).sort(), ['Ctl', 'Opportunity', 'healthPanel']);
  const opp = spec.cards.find((c) => c.id === 'Opportunity');
  assert.deepStrictEqual(opp.attributes, ['+ Score__c']);
  assert.strictEqual(opp.status, 'changed');
  assert.deepStrictEqual(spec.connectors.map((e) => `${e.from}>${e.to}`).sort(), ['Ctl>Opportunity', 'healthPanel>Ctl']);
  assert.deepStrictEqual(spec.groups.map((g) => g.id), ['ui', 'automation', 'data']);
  assert.deepStrictEqual(diagram.checkDrawio(diagram.toDrawio(spec)).problems, []);
  assert.throws(() => diagram.specFromComponents(comps, { type: 'roadmap' }), /only solution-architecture and data-model/);
});

test('diagram layout routes a connector that skips a column below the cards in the way', () => {
  const spec = {
    type: 'solution', title: 'T', description: 'D.',
    groups: [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }],
    cards: [{ id: 'a', title: 'A', group: 'g1' }, { id: 'm', title: 'Middle', group: 'g2' }, { id: 'z', title: 'Z', group: 'g3' }],
    connectors: [{ from: 'a', to: 'z', label: 'skips' }],
  };
  const xml = diagram.toDrawio(spec);
  const edge = /<mxCell id="edge-1"[\s\S]*?<\/mxCell>/.exec(xml)[0];
  const ys = [...edge.matchAll(/<mxPoint x="[\d.]+" y="([\d.]+)"\/>/g)].map((m) => Number(m[1]));
  const middle = /<mxCell id="card-m" [^>]*><mxGeometry x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/.exec(xml);
  const group = /<mxCell id="group-g2" [^>]*><mxGeometry x="[\d.]+" y="([\d.]+)"/.exec(xml);
  const bottom = Number(group[1]) + Number(middle[1]) + Number(middle[2]);
  assert.strictEqual(ys.length, 4, 'highway route has four points');
  assert.ok(Math.max(...ys) > bottom, 'the highway runs below the middle card');
});

test('draw.io desktop is found from SF_SDLC_DRAWIO, and a missing one is reported, not faked', () => {
  const found = diagram.findDrawio({ SF_SDLC_DRAWIO: '/opt/x/drawio' }, (p) => p === '/opt/x/drawio');
  assert.deepStrictEqual(found, { cmd: '/opt/x/drawio', wsl: false });
  assert.deepStrictEqual(diagram.findDrawio({ SF_SDLC_DRAWIO: '/mnt/c/d/draw.io.exe' }, (p) => p === '/mnt/c/d/draw.io.exe'), { cmd: '/mnt/c/d/draw.io.exe', wsl: true });
  assert.ok(Array.isArray(diagram.validateSpec({}).errors));
});

test('every project gets the draw.io skill, and the Salesforce picture references ship with the diagram skill', () => {
  const rules = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules;
  assert.ok(rules.find((r) => r.id === 'core').skills.includes('drawio-skill'));
  const skill = fs.readFileSync(path.join(KIT, 'skill-library', 'drawio-skill', 'SKILL.md'), 'utf8');
  assert.match(skill, /^name: drawio-skill$/m);
  assert.ok(fs.existsSync(path.join(KIT, 'skill-library', 'drawio-skill', 'LICENSE')));
  const gallery = path.join(KIT, 'skills', 'sdlc-architecture-diagram', 'references', 'salesforce-gallery');
  const index = fs.readFileSync(path.join(gallery, 'README.md'), 'utf8');
  for (const [, link] of index.matchAll(/\]\(([\w-]+\/[\w-]+\.png)\)/g)) assert.ok(fs.existsSync(path.join(gallery, link)), `missing ${link}`);
  assert.ok((index.match(/\.png\)/g) || []).length >= 9);
});

test('browser guard: opening a production-class or unknown Salesforce org page asks; sandboxes and other sites pass', () => {
  const nav = (url, c = cfg(), name = 'mcp__sf-browser__browser_navigate') => browser.navigateGuard(name, { url }, c, os.tmpdir(), lookup).decision;
  assert.strictEqual(nav('https://acme--uat.sandbox.lightning.force.com/lightning/page/home'), 'allow');
  assert.strictEqual(nav('https://acme--uat--c.sandbox.vf.force.com/apex/X'), 'allow', 'Visualforce domain maps to its sandbox');
  assert.strictEqual(nav('https://x.scratch.lightning.force.com/'), 'allow');
  assert.strictEqual(nav('https://acme.lightning.force.com/lightning/setup/SetupOneHome/home'), 'ask', 'production org');
  assert.strictEqual(nav('https://acme.my.salesforce.com/', cfg(), 'mcp__plugin_sf-sdlc_sf-browser__browser_navigate'), 'ask', 'plugin tool name');
  assert.strictEqual(nav('https://other.my.salesforce.com/'), 'ask', 'an org the CLI does not know is treated as production');
  assert.strictEqual(nav('https://acme--uat.sandbox.my.salesforce.com/', cfg({ orgs: { production: ['uat'] } })), 'ask', 'orgs.production wins over the org type');
  assert.strictEqual(nav('https://test.salesforce.com/'), 'allow', 'login pages carry no org');
  assert.strictEqual(nav('https://example.com/'), 'allow');
  assert.strictEqual(browser.navigateGuard('mcp__sf-browser__browser_click', {}, cfg(), os.tmpdir(), lookup).decision, 'allow');
  assert.strictEqual(browser.navigateGuard('mcp__sf-browser__browser_navigate', { url: 'https://acme--uat.sandbox.my.salesforce.com/' }, cfg(), os.tmpdir(), () => null).decision, 'ask', 'no org list: never safe');
  assert.strictEqual(browser.parseToolName('mcp__sf-headless-360__dispatch'), null);
});

test('browser: launch plan, persistent profile inside .sf-sdlc, secrets kept out of tool output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-br-'));
  const p = browser.plan(root, cfg(), { has: () => true, platform: 'darwin' });
  assert.strictEqual(p.cmd, 'npx');
  assert.ok(p.args.includes(browser.PACKAGE) && /@\d+\.\d+\.\d+$/.test(browser.PACKAGE), 'the server version is pinned');
  assert.strictEqual(p.args[p.args.indexOf('--user-data-dir') + 1], path.join(root, '.sf-sdlc', 'browser-profile'));
  assert.match(p.args[p.args.indexOf('--redact-url-params') + 1], /\bsid\b/);
  assert.ok(!p.args.includes('--isolated') && !p.args.includes('--headless'));
  assert.strictEqual(browser.plan(root, cfg({ browser: { enabled: true, browser: 'chrome', headless: false } }), { has: (c) => c === 'npx', platform: 'linux', exists: () => false }).browser, 'chromium', 'Linux without Chrome falls back to Chrome for Testing');
  assert.ok(browser.plan(root, cfg({ browser: { enabled: true, browser: 'firefox', headless: true } }), { has: () => true }).args.includes('--headless'));
  assert.match(browser.plan(root, cfg({ browser: { enabled: false, browser: 'chrome', headless: false } }), { has: () => true }).reason, /browser\.enabled/);
  assert.match(browser.plan(root, cfg(), { has: () => false }).reason, /npx/);
  assert.ok(checks.isProtectedPath('.sf-sdlc/browser-profile/Default/Cookies'), 'the profile is a credential store');
  assert.ok(!checks.isProtectedPath('.sf-sdlc/audit.jsonl'));
  const settings = JSON.parse(fs.readFileSync(path.join(KIT, 'settings.json'), 'utf8'));
  assert.ok(settings.permissions.deny.includes('Read(./.sf-sdlc/browser-profile/**)'));
  assert.ok(new RegExp(`^(${settings.hooks.PreToolUse.find((h) => /sf-browser/.test(h.matcher)).matcher})$`).test('mcp__plugin_sf-sdlc_sf-browser__browser_navigate'));
  // Sign-in kept across restarts: the profile restores the last session, so Salesforce's session-only
  // cookie survives; the browser's own Preferences are merged, not replaced.
  assert.strictEqual(browser.prepareProfile(root, 'chrome').result, 'set');
  assert.ok(browser.keepsSignIn(root, 'chrome'));
  const prefsFile = path.join(browser.profileDir(root), 'Default', 'Preferences');
  fs.writeFileSync(prefsFile, JSON.stringify({ session: { restore_on_startup: 4 }, profile: { exit_type: 'Crashed', name: 'Person 1' }, extensions: { x: 1 } }));
  assert.strictEqual(browser.prepareProfile(root, 'msedge').result, 'set');
  const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf8'));
  assert.deepStrictEqual([prefs.session.restore_on_startup, prefs.profile.exit_type, prefs.profile.name, prefs.extensions.x], [1, 'Normal', 'Person 1', 1]);
  assert.strictEqual(browser.prepareProfile(root, 'chrome').result, 'kept');
  fs.writeFileSync(prefsFile, '{broken');
  assert.match(browser.prepareProfile(root, 'chrome').result, /left alone/);
  assert.strictEqual(browser.prepareProfile(root, 'firefox').result, 'set');
  assert.ok(browser.keepsSignIn(root, 'firefox'));
  assert.strictEqual(browser.prepareProfile(root, 'firefox').result, 'kept');
  fs.rmSync(browser.profileDir(root), { recursive: true, force: true });
  assert.strictEqual(browser.reset(root).result, 'nothing to reset');
  fs.mkdirSync(browser.profileDir(root), { recursive: true });
  assert.strictEqual(browser.reset(root).result, 'removed');
  assert.ok(lib.validateConfig(cfg({ browser: { enabled: true, browser: 'opera', headless: false } })).errors.some((e) => /browser\.browser/.test(e)));
});

test('.env: Salesforce and MCP address sections, .env.sample with no values, appends only what is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-env-'));
  for (const k of ['SF_LOGIN_URL', 'SF_USERNAME', 'SF_ORG_ALIAS', 'SF_MCP_METADATA_EXPERTS_URL', 'JIRA_API_TOKEN']) assert.match(envfile.SAMPLE, new RegExp(`^${k}=$`, 'm'));
  assert.ok(Object.keys(mcp.HOSTED_SERVERS).every((n) => envfile.ALL_KEYS.includes(mcp.urlKey(n))), 'every hosted server has an address key');
  assert.strictEqual(envfile.ensureSample(root).result, 'created');
  assert.strictEqual(envfile.ensureSample(root).result, 'kept');
  fs.writeFileSync(path.join(root, '.env.sample'), 'TEAM_OWN=\n');
  assert.strictEqual(envfile.ensureSample(root).result, 'exists, not managed by sf-sdlc');
  fs.writeFileSync(path.join(root, '.env'), 'JIRA_URL=https://x.atlassian.net\n');
  const r = envfile.ensure(root);
  assert.strictEqual(r.result, 'appended');
  assert.ok(r.added.includes('SF_LOGIN_URL') && !r.added.includes('JIRA_URL'));
  const text = fs.readFileSync(path.join(root, '.env'), 'utf8');
  assert.match(text, /^JIRA_URL=https:\/\/x\.atlassian\.net$/m, 'values are never changed');
  assert.match(text, /# Salesforce org for this project/, 'appended keys keep their explanation');
  assert.strictEqual(envfile.status(root).groups.mcp.state, 'default');
  assert.strictEqual(envfile.status(root).groups.salesforce.state, 'empty');
  envfile.setPlain(root, 'SF_LOGIN_URL', 'https://test.salesforce.com');
  assert.strictEqual(envfile.status(root).groups.salesforce.state, 'configured');
  assert.throws(() => envfile.setPlain(root, 'SF_MCP_SOBJECT_ALL_URL', 'https://x'), /cannot be set/);
});

test('hosted MCP: a per-server address override must stay on salesforce.com over https', () => {
  const k = mcp.urlKey('metadata-experts');
  assert.strictEqual(k, 'SF_MCP_METADATA_EXPERTS_URL');
  assert.strictEqual(mcp.serverUrl('metadata-experts', { [k]: 'https://api.salesforce.com/platform/mcp/v1/platform/metadata-experts/' }), 'https://api.salesforce.com/platform/mcp/v1/platform/metadata-experts');
  assert.throws(() => mcp.serverUrl('metadata-experts', { [k]: 'http://api.salesforce.com/x' }), /https/);
  assert.throws(() => mcp.serverUrl('metadata-experts', { [k]: 'https://salesforce.com.evil.io/x' }), /salesforce\.com/);
  assert.throws(() => mcp.serverUrl('metadata-experts', { [k]: 'https://u:p@api.salesforce.com/x' }), /salesforce\.com/);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sfsdlc-mcpenv-'));
  fs.writeFileSync(path.join(root, '.env'), `${k}=https://pilot.salesforce.com/mcp/x\nJIRA_API_TOKEN=t0k\n`);
  const env = mcp.addressEnv(root, {});
  assert.strictEqual(mcp.serverUrl('metadata-experts', env), 'https://pilot.salesforce.com/mcp/x');
  assert.strictEqual(env.JIRA_API_TOKEN, undefined, 'only address keys are read');
});

test('diagram layouts: process columns or lanes, role-hierarchy trees and release-plan stages', () => {
  const cell = (xml, id) => new RegExp(`<mxCell id="${id}" [^>]*><mxGeometry x="([\\d.]+)" y="([\\d.]+)" width="([\\d.]+)" height="([\\d.]+)"`).exec(xml).slice(1).map(Number);
  const proc = { type: 'process', title: 'T', description: 'D.', groups: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], cards: [{ id: 'x', title: 'X', group: 'a' }, { id: 'y', title: 'Y', group: 'b' }], connectors: [{ from: 'x', to: 'y', label: 'go' }] };
  const cols = diagram.toDrawio(proc);
  assert.doesNotMatch(cols, /swimlane;/, 'Salesforce-style process: participants as columns');
  assert.match(cols, /1\. go/, 'process steps are numbered');
  assert.match(diagram.toDrawio({ ...proc, layout: 'lanes' }), /swimlane;/);
  assert.match(diagram.validateSpec({ ...proc, type: 'solution', layout: 'lanes' }).errors.join(), /lanes" is for process/);

  const tree = diagram.toDrawio({ type: 'landscape', layout: 'tree', title: 'T', description: 'D.', cards: [{ id: 'ceo', title: 'CEO' }, { id: 'a', title: 'A' }, { id: 'b', title: 'B' }], connectors: [{ from: 'ceo', to: 'a' }, { from: 'ceo', to: 'b' }] });
  const [cx, cy, cw] = cell(tree, 'card-ceo');
  const [ax, ay, aw] = cell(tree, 'card-a');
  const [bx] = cell(tree, 'card-b');
  assert.ok(ay > cy, 'children below the parent');
  assert.ok(Math.abs((cx + cw / 2) - ((ax + aw / 2 + bx + aw / 2) / 2)) < 1, 'parent centred over its children');
  assert.match(tree, /sfKind=hierarchy/);
  assert.match(tree, /endArrow=none/);

  const stages = diagram.toDrawio({ type: 'roadmap', layout: 'stages', title: 'T', description: 'D.', cards: [{ id: 's1', title: 'Define', attributes: ['a', 'b', 'c'] }, { id: 's2', title: 'Build', footer: 'Sandbox' }, { id: 's3', title: 'Release', footer: 'Production' }] });
  assert.strictEqual((stages.match(/<mxCell id="edge-\d+"/g) || []).length, 2, 'stages are joined automatically');
  assert.strictEqual(cell(stages, 'card-s1')[3], cell(stages, 'card-s3')[3], 'stage cards share one height');
});

test('diagram containers carry footers, icons and boundaries; two-way kinds draw both arrowheads', () => {
  const xml = diagram.toDrawio({
    type: 'landscape', title: 'T', description: 'D.',
    groups: [{ id: 'g', label: 'Einstein', boundary: 'Einstein Trust Layer', attributes: ['Shared data'], footer: 'Platform services', footerIcons: ['workflow', 'data'] }, { id: 'h', label: 'Other' }],
    cards: [{ id: 'a', title: 'A', group: 'g' }, { id: 'b', title: 'B', group: 'h' }],
    connectors: [{ from: 'a', to: 'b', kind: 'native' }],
  });
  assert.match(xml, /id="group-g" [^>]*dashPattern=12 4 2 4/);
  assert.match(xml, /id="group-g-footer" value="Platform services"/);
  assert.match(xml, /id="group-g-footer-icon-2"/);
  assert.match(xml, /id="group-g-attributes"/);
  assert.match(xml, /value="Einstein Trust Layer"/, 'the boundary is named in the key');
  assert.match(/<mxCell id="edge-1"[^>]*>/.exec(xml)[0], /startArrow=block;/);
  assert.deepStrictEqual(diagram.checkDrawio(xml).problems, []);
  assert.match(diagram.validateSpec({ type: 'landscape', title: 'T', description: 'D.', groups: [{ id: 'g', footerIcons: ['nope'] }], cards: [{ id: 'a', title: 'A', group: 'g' }] }).errors.join(), /unknown footer icon "nope"/);
});

test('one architecture skill, and the Salesforce gallery is filed in its five types', () => {
  const skills = fs.readdirSync(path.join(KIT, 'skills'));
  assert.ok(skills.includes('sdlc-architecture-diagram'));
  assert.ok(!skills.some((s) => s !== 'sdlc-architecture-diagram' && /architect/.test(s)), 'design and diagrams live in one skill');
  const ref = path.join(KIT, 'skills', 'sdlc-architecture-diagram', 'references');
  for (const f of ['hld-template.md', 'lld-template.md', 'adr-template.md', 'baseline-template.md', 'decision-guides.md', 'well-architected-review.md']) assert.ok(fs.existsSync(path.join(ref, 'design', f)), f);
  const gallery = path.join(ref, 'salesforce-gallery');
  const types = fs.readdirSync(gallery).filter((d) => fs.statSync(path.join(gallery, d)).isDirectory()).sort();
  assert.deepStrictEqual(types, ['capability-map', 'interaction-process-flow', 'roadmap', 'solution-architecture', 'system-landscape']);
  const count = types.reduce((n, t) => n + fs.readdirSync(path.join(gallery, t)).filter((f) => f.endsWith('.png')).length, 0);
  assert.ok(count >= 25, `${count} reference images`);
  const all = fs.readFileSync(path.join(KIT, 'agents', 'sdlc-solution-architect-agent.md'), 'utf8') + fs.readFileSync(path.join(KIT, 'skills', 'sdlc-workflow', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(all, /sdlc-solution-architecture-generate/);
});
