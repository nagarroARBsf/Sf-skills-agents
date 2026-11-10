export const meta = {
  name: 'sdlc-release-readiness',
  description: 'Check release readiness in parallel — traceability, reviews, tests, code analysis, deployments, approvals — and assemble the evidence',
  phases: [{ title: 'Checks' }, { title: 'Assemble' }],
}

const version = typeof args === 'string' && args.trim() ? args.trim() : 'next'

const CHECK = {
  type: 'object',
  required: ['status', 'summary', 'evidence'],
  properties: {
    status: { type: 'string', enum: ['Pass', 'Fail', 'No evidence'] },
    summary: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
    blockers: { type: 'array', items: { type: 'string' } },
  },
}

const lead =
  `You are checking one aspect of readiness for release ${version} of a Salesforce project. Read-only: do not edit files, deploy, or change Jira or GitHub. ` +
  'Read `.claude/sf-sdlc.json` for paths and thresholds and follow the sdlc-workflow and sdlc-deploy-release skills for artifact locations. ' +
  'Judge only from artifacts on disk and command output, and cite the file for every statement. A missing artifact is "No evidence", never a pass.\n\nYour check: '

const CHECKS = [
  ['traceability', 'TRACEABILITY — every story in the release scope traces from a requirement through design, spec and test cases; list stories with a broken chain.'],
  ['approvals', 'APPROVALS — the approval record of the BRD, backlog, HLD, each plan and each test strategy in scope is filled in by a person; list artifacts still in draft.'],
  ['reviews', 'CODE REVIEW — each story in scope has a review.md whose verdict is Approve or Approve with conditions, and every condition is closed; list the rest.'],
  ['tests', 'TESTING — the latest test run per story passed, coverage meets quality.coverageTarget and quality.orgCoverageMinimum, and there are no open Blocker or Major defects; list open defects by severity.'],
  ['analysis', 'STATIC ANALYSIS — run `node .claude/bin/sf-sdlc analyze --json` and report violations at or above the blocking severity.'],
  ['deployment', 'DEPLOYMENT — a validation against the last pre-production org in deploy.pipeline succeeded for this scope, deployment records exist for each promoted stage, each has a rollback plan, and manual steps are listed.'],
]

phase('Checks')
const results = await parallel(
  CHECKS.map(([key, prompt]) => () =>
    agent(lead + prompt, { label: key, phase: 'Checks', schema: CHECK }).then((r) => ({ key, ...(r || { status: 'No evidence', summary: 'The check did not finish.', evidence: [] }) })),
  ),
)

phase('Assemble')
const failing = results.filter((r) => r.status !== 'Pass')
return {
  version,
  recommendation: failing.length ? 'Not ready' : 'Ready for a go/no-go decision',
  note: 'This is evidence for a person to decide on. Write it up with the release command; a person signs the readiness report.',
  checks: results,
}
