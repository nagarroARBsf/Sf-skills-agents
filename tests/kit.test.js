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
  const created = cli('init').json.created;
  assert.ok(created.includes('.claude/sf-sdlc.json'));
  assert.ok(created.includes('.github/workflows/sf-code-analyzer.yml'));
  assert.ok(created.some((c) => c.startsWith('.mcp.json')));
  const servers = JSON.parse(fs.readFileSync(path.join(dir, '.mcp.json'), 'utf8')).mcpServers;
  assert.deepStrictEqual(Object.keys(servers).sort(), ['atlassian-token', 'sf-data360', 'sf-headless-360', 'sf-metadata-experts', 'sf-metadata-grounding', 'sf-sobject-all', 'sf-sobject-reads']);
  assert.ok(created.some((c) => c.startsWith('.env (created')), 'init creates the .env template');
  assert.ok(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8').split('\n').includes('.env'), '.env is git-ignored');
  assert.ok(!fs.existsSync(path.join(dir, '.claude', 'rules')), 'the copy-in folder already holds its rules; init does not write them');
  assert.match(fs.readFileSync(path.join(dir, 'code-analyzer.yml'), 'utf8'), /NoHardcodedSalesforceIds/);
  assert.ok(cli('init').json.skipped.some((c) => c.startsWith('.mcp.json')), 'a second init keeps .mcp.json');
  assert.ok(cli('config', 'validate').json.ok);
  const rec = cli('skills', 'recommend').json;
  assert.ok(rec.toInstall.includes('platform-apex-generate'));
  assert.ok(rec.toInstall.includes('platform-metadata-grounding-get'), 'grounding is recommended while metadata-grounding is enabled');
  assert.ok(!rec.toInstall.includes('platform-headless-360-integrate'), 'headless-360 is opt-in');
  assert.ok(!rec.toInstall.some((s) => s.startsWith('omnistudio-')));
  assert.strictEqual(cli('skills', 'install', 'platform-soql-query').json.results[0].result, 'installed');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'ok');
  fs.appendFileSync(path.join(dir, '.claude/skills/platform-soql-query/SKILL.md'), '\nlocal edit\n');
  assert.strictEqual(cli('skills', 'list').json.installed[0].state, 'modified');
  assert.match(cli('skills', 'remove', 'platform-soql-query').json.results[0].result, /locally modified/);
  assert.strictEqual(cli('inventory').json.counts.ApexClass, 1);
  const core = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules.find((r) => r.id === 'core').skills;
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
  assert.deepStrictEqual(mcp.enabledServers(cfg()), ['metadata-experts', 'metadata-grounding']);
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
  const core = JSON.parse(fs.readFileSync(path.join(KIT, 'catalog', 'detection-rules.json'), 'utf8')).rules.find((r) => r.id === 'core').skills;
  assert.ok(core.every((n) => sk.installed.includes(n)), 'the core set is always installed');
  assert.ok(sk.installed.includes('platform-apex-generate') && sk.installed.includes('experience-lwc-generate'), 'the main skill for each kind of code comes before secondary skills');
  assert.ok(sk.availableLater.length > 0, 'what does not fit is listed, not installed');
  const listing = JSON.parse(cli('skills', 'list', '--json').out).listingChars;
  assert.ok(listing <= 8000, `skills stay inside the listing budget (${listing})`);
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
  assert.deepStrictEqual(cli('mcp', 'enable', 'sobject-reads', '--json').json.servers, ['metadata-experts', 'metadata-grounding', 'sobject-reads']);
  assert.deepStrictEqual(cli('mcp', 'disable', 'metadata-grounding', '--json').json.servers, ['metadata-experts', 'sobject-reads']);
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
