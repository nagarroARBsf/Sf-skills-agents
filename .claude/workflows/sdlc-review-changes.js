export const meta = {
  name: 'sdlc-review-changes',
  description: 'Review the changes on this branch with parallel Salesforce reviewers, then verify each finding',
  phases: [{ title: 'Scope' }, { title: 'Review' }, { title: 'Verify' }, { title: 'Report' }],
}

const base = typeof args === 'string' && args.trim() ? args.trim() : ''

phase('Scope')
const scope = await agent(
  `Run \`node .claude/bin/sf-sdlc delta ${base ? '--from ' + base + ' ' : ''}--json\` and \`git diff --name-only\` in this project. ` +
    'Return the changed Salesforce source files (not deleted ones), the story or feature folder under specs/ this branch belongs to if one is evident from the branch name, and the base ref used. Do not review anything yet.',
  {
    label: 'scope',
    schema: {
      type: 'object',
      required: ['files', 'base'],
      properties: {
        files: { type: 'array', items: { type: 'string' } },
        base: { type: 'string' },
        specFolder: { type: 'string' },
      },
    },
  },
)
if (!scope || !scope.files.length) return { verdict: 'Nothing to review', findings: [] }

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'severity', 'title', 'failure'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          severity: { type: 'string', enum: ['Blocker', 'Major', 'Minor', 'Note'] },
          title: { type: 'string' },
          failure: { type: 'string' },
        },
      },
    },
    notReviewed: { type: 'string' },
  },
}

const context =
  `You are a read-only Salesforce code reviewer. Do not edit any file. Follow the sdlc-code-review skill. ` +
  `Changed files (against ${scope.base}):\n${scope.files.join('\n')}\n` +
  (scope.specFolder ? `Spec folder: ${scope.specFolder} (read spec.md and plan.md for the acceptance criteria).\n` : '') +
  'Read each changed file in full, plus callers and tests of anything whose behaviour changed. ' +
  'Report only findings you can cite by file and line, each with the concrete failure it causes.\n\nYour pass: '

const PASSES = [
  { key: 'security', prompt: 'SECURITY — sharing keywords, CRUD/FLS and user-mode data access, SOQL injection, secrets and hard-coded IDs or URLs, @AuraEnabled exposure, XSS in LWC/Aura/Visualforce, guest-user access.' },
  { key: 'limits', prompt: 'GOVERNOR LIMITS AND BULK SAFETY — SOQL or DML in loops, unselective queries, heap and CPU, recursion, mixed DML, async limits, and trigger plus Flow interplay on the same object (order of execution).' },
  { key: 'tests', prompt: 'TESTS AND REQUIREMENTS — each acceptance criterion has a test or evidence; assertions are meaningful; negative, bulk and System.runAs cases exist; no SeeAllData; changed classes are covered.' },
  { key: 'metadata', prompt: 'METADATA AND MAINTAINABILITY — API version drift, access granted through permission sets not profiles, destructive changes, missing descriptions, LWC accessibility and error handling, naming and reuse of existing project frameworks. Also run `node .claude/bin/sf-sdlc analyze --changed --json` and include the Code Analyzer violations at or above the blocking severity that you agree with.' },
]

const reviewed = await pipeline(
  PASSES,
  (p) => agent(context + p.prompt, { label: `review:${p.key}`, phase: 'Review', schema: FINDINGS }).then((r) => ({ pass: p.key, findings: (r && r.findings) || [] })),
  (res) =>
    parallel(
      res.findings.map((f) => () =>
        agent(
          `Adversarially verify this code review finding. Open ${f.file} around line ${f.line} and the code it interacts with. ` +
            `Finding (${f.severity}): ${f.title}. Claimed failure: ${f.failure}. ` +
            'Decide whether it is real. Do not edit any file.',
          {
            label: `verify:${f.file}:${f.line}`,
            phase: 'Verify',
            schema: {
              type: 'object',
              required: ['confidence', 'reason'],
              properties: {
                confidence: { type: 'string', enum: ['Confirmed', 'Likely', 'Needs verification', 'Not a problem'] },
                reason: { type: 'string' },
              },
            },
          },
        ).then((v) => ({ ...f, pass: res.pass, confidence: v ? v.confidence : 'Needs verification', reason: v ? v.reason : 'verifier did not finish' })),
      ),
    ),
)

phase('Report')
const findings = reviewed.flat().filter(Boolean).filter((f) => f.confidence !== 'Not a problem')
const rank = { Blocker: 0, Major: 1, Minor: 2, Note: 3 }
findings.sort((a, b) => rank[a.severity] - rank[b.severity])
const solid = findings.filter((f) => f.confidence === 'Confirmed' || f.confidence === 'Likely')
const verdict = solid.some((f) => f.severity === 'Blocker' || f.severity === 'Major')
  ? 'Changes required'
  : solid.length
    ? 'Approve with conditions'
    : 'Approve'

return { verdict, base: scope.base, files: scope.files.length, specFolder: scope.specFolder || null, findings }
