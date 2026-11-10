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
});

test('catalog and detection rules are consistent', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'skills.json'), 'utf8'));
  const names = new Set(catalog.skills.map((s) => s.name));
  const rules = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules;
  const missing = rules.flatMap((r) => r.skills).filter((s) => !names.has(s));
  assert.deepStrictEqual([...new Set(missing)], [], 'detection rules name skills that are not in the catalog');
  for (const s of catalog.skills) assert.ok(fs.existsSync(path.join(KIT, s.location, s.name, 'SKILL.md')), s.name);
  // Always-loaded skills are the SDLC process skills only.
  assert.deepStrictEqual(catalog.skills.filter((s) => s.location === 'skills' && !s.name.startsWith('sdlc-')), []);
});

test('agents and commands reference things that exist', () => {
  const skills = new Set(fs.readdirSync(path.join(KIT, 'skills')));
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
    for (const s of text.match(/`sdlc-[a-z-]+`/g) || []) {
      const n = s.replace(/`/g, '');
      assert.ok(skills.has(n) || agents.includes(n), `${f} names unknown skill or agent ${n}`);
    }
  }
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
  assert.ok(cli('init').json.created.includes('.claude/sf-sdlc.json'));
  assert.ok(cli('config', 'validate').json.ok);
  const rec = cli('skills', 'recommend').json;
  assert.ok(rec.toInstall.includes('platform-apex-generate'));
  assert.ok(!rec.toInstall.some((s) => s.startsWith('omnistudio-')));
  assert.strictEqual(cli('skills', 'install', 'platform-soql-query').json.results[0].result, 'installed');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'ok');
  fs.appendFileSync(path.join(dir, '.claude/skills/platform-soql-query/SKILL.md'), '\nlocal edit\n');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'modified');
  assert.match(cli('skills', 'remove', 'platform-soql-query').json.results[0].result, /locally modified/);
  assert.strictEqual(cli('inventory').json.counts.ApexClass, 1);
  assert.strictEqual(cli('skills', 'recommend', '--profile', 'ba').json.toInstall.length, 0);
  fs.rmSync(dir, { recursive: true, force: true });
});
