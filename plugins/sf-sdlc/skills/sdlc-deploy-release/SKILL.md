---
name: sdlc-deploy-release
description: "Deployment and release runbook for Salesforce through the sf CLI: promotion order from the project config, classifying the target org first, validate then quick deploy, test levels per environment (never NoTestRun for production), delta versus full deployments, destructive changes with explicit confirmation, manual steps, failure diagnosis, rollback planning and the deployment record (DEP); then the release: evidence-based readiness checklist, go/no-go recommendation, release notes, Jira fix version and GitHub release after explicit approval, and hypercare. Production is deployed only when the user names the org and confirms. TRIGGER when: user asks to deploy, validate, promote, roll back, build a manifest, diagnose a deployment failure, check release readiness, write release notes, tag or close a release, or runs /sf-sdlc:deploy or /sf-sdlc:release. DO NOT TRIGGER when: the user wants tests run without deploying (use sdlc-test-execution) or a change reviewed (use sdlc-code-review)."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-deploy-release

A deployment is a controlled change to someone's business system. Validate before deploying,
never surprise the person who owns the org, and leave a record another engineer could roll back
from. Part A is deployment (`/sf-sdlc:deploy`); Part B is release (`/sf-sdlc:release`).

Both parts run **in the main conversation**; there is no separate deployment or release agent. Only
a person starts them: the commands cannot be invoked by the model, and the guard hooks ask before any
org-changing `sf` command. The readiness evidence can be gathered in parallel with the
`sdlc-release-readiness` workflow. Do not change source to make a deployment pass: report the cause
and hand the fix back to the build (`/sf-sdlc:implement`). You recommend go or no-go; a person decides.

All project values come from `sf-sdlc config show --json`: `orgs.*`,
`deploy.pipeline`, `deploy.testLevel.<role>`, `deploy.validateBeforeDeploy`,
`deploy.allowDirectProductionDeploy`, `deploy.useDelta`, `deploy.waitMinutes`, `git.*`, `jira.*`,
`quality.*`. Never type an alias, branch or test level from memory.

# Part A — Deployment

## 1. Target
1. The **user names the target** (a role from `deploy.pipeline` or an alias). Never choose one.
2. Resolve the role through `orgs.<role>`. Run
   `sf-sdlc org classify <alias> --json` and state the result before anything
   else: production, sandbox, scratch, developer or unknown.
3. **Unknown is treated as production.** An alias in `orgs.production` is production whatever
   the classifier says.
4. **Promotion order** is `deploy.pipeline` (for example dev → qa → uat → production). The
   change must have a successful `DEP-nnn` for the previous stage. Skipping a stage is the
   user's explicit decision, recorded in the deployment record.
5. **Production rule.** Deploy to production only when the user has named the production org and
   confirmed in this conversation, after seeing the validation result. A guard hook also
   blocks or asks on direct production deployments; a denied command is a decision, not an
   obstacle. Do not rephrase a command to get around it. If
   `deploy.allowDirectProductionDeploy` is false, a production deployment without a recorded
   successful validation is not attempted at all.

## 2. Readiness
Check and cite before building anything:
- Code review: `specs/<story>/review.md` verdict is Approve, or Approve with conditions that are
  met. `Changes required` stops the deployment unless the user overrides; record the override.
- Tests: for stages after the first test org, the previous stage's test run (`TR-…`) met its
  exit criteria and no Blocker or Major `DEF-nnn` is open for the stories being deployed.
- Source: the commit to deploy is on the expected branch and the working tree is clean
  (`git status --porcelain`). Deploy from a commit, never from uncommitted files.
- Static analysis: `sf-sdlc analyze --changed <ref> --json` shows nothing at or
  above `quality.analyzerSeverityThreshold`.
- Manual steps and destructive changes are listed (LLD §11, plan §9).

## 3. Manifest: delta or full
`sf-sdlc delta --from <git-ref> --json` buckets components as new, changed and
removed against the ref (the commit recorded in the target org's last successful `DEP-nnn`).
Add `--manifest` to write `package.xml`. If the sfdx-git-delta plugin is installed,
`sf sgd source delta --from <ref> --to HEAD --output-dir <dir>` produces `package/package.xml`
and `destructiveChanges/destructiveChanges.xml` (older plugin versions name the flag `--output`).

Use a **delta** when `deploy.useDelta` is true and the target's last deployed commit is known.
A **full deployment** of the package directories is safer when:
- it is the first deployment to the org, or the org was refreshed or recreated;
- the last deployed commit is unknown, or the org was changed outside the pipeline (drift);
- components were renamed or moved between package directories;
- the delta contains only part of a tightly coupled set (an object without its record types or
  layouts, a flow without the fields it uses, permission sets without the components they grant);
- the test level is `RunSpecifiedTests` and the delta makes per-class coverage hard to prove.

Show the user the component list (counts by type; every Removed component by name) before
validating. Removed components never ride along silently: see section 7.

## 4. Validate (always first)
Preview what would change, then validate with the stage's test level:

```bash
sf-sdlc deploy preview --org <role> --json
sf-sdlc deploy validate --org <role> --json
sf-sdlc deploy validate --org <role> --delta --from <git-ref> --json
sf-sdlc deploy report --org <role> --json
```

The kit CLI applies `deploy.testLevel.<role>` and `deploy.waitMinutes` and records the
validation job. Equivalent raw commands (`<n>` = `deploy.waitMinutes`):

```bash
sf project deploy preview --target-org <alias> --manifest <package.xml>
sf project deploy validate --target-org <alias> --manifest <package.xml> --test-level RunLocalTests --wait <n>
sf project deploy validate --target-org <alias> --manifest <package.xml> --test-level RunSpecifiedTests --tests <TestClassA> --tests <TestClassB> --wait <n>
sf project deploy report --job-id <id> --target-org <alias>
```

`sf project deploy start --dry-run` also checks a deployment without saving, but it does not
produce a job that can be quick-deployed: use it for previews in development orgs only.

**Test levels** (from `deploy.testLevel.<role>`):

| Level | Runs | Use |
|---|---|---|
| `NoTestRun` | nothing | Developer and scratch orgs only. **Never production.** |
| `RunSpecifiedTests` | the named test classes | Fast feedback in test orgs. Every Apex class and trigger in the deployment must reach 75% coverage from those tests alone |
| `RunLocalTests` | all tests except managed-package tests | Default for shared test orgs and production; org-wide coverage must be at least 75% |
| `RunAllTestsInOrg` | everything including managed packages | Rarely; before major releases when package interplay is a risk |

Why `NoTestRun` is never used for production: the platform rejects it for deployments that
contain Apex; a validation that ran no tests cannot be quick-deployed; and a metadata-only
change (a field, validation rule, flow or permission) can still break existing Apex and
automation, so the test run is the only proof before the change is live.

## 5. Review the validation result
Report from the job result, not from the exit code: status, components deployed and failed,
tests run and failed, coverage per changed class against `quality.coverageTarget`, org-wide
coverage against `quality.orgCoverageMinimum`, warnings. On failure, report each component
error and test failure with its likely cause and fix, using
[references/troubleshooting.md](references/troubleshooting.md). Do not retry blindly, do not
weaken the test level, and do not edit source to make a deployment pass: hand code fixes back
to the developer (`/sf-sdlc:implement`) and validate again from the new commit.

## 6. Rollback plan (before deploying)
Write it in the deployment record before the quick deploy:
- **How**: re-deploy the previous commit's version of every Changed component (the commit in
  the org's last successful `DEP-nnn`), and remove every New component with a destructive
  manifest, validated the same way.
- **Cannot be rolled back**: data created, changed or deleted by the release; deleted fields
  and objects and their data; field type or length changes that truncated data; flow versions
  (an older definition deploys as a new version, and the previously active version is
  re-activated by hand); emails and outbound messages already sent; upgraded managed packages.
- **Decision point**: who decides to roll back, by when, on which signal.
- Export data that a destructive change or migration will alter before deploying.

## 7. Destructive changes
- List every Removed component by name and type with its data consequence ("field
  `Opportunity.Legacy_Score__c`: values on 48,000 records are deleted").
- Check that nothing still references it: `sf-sdlc inventory --json` and a
  search of the source tree.
- Pre- or post-deployment: `destructiveChangesPre.xml` when the component blocks the new
  metadata (for example a field type change by delete-and-recreate); `destructiveChangesPost.xml`
  for everything else, so removal happens after its replacement is live.
- Raw form: `--manifest <package.xml> --pre-destructive-changes <file>` or
  `--post-destructive-changes <file>` on validate. Do not add `--purge-on-delete` unless the
  user asks; it bypasses the Recycle Bin and is not honoured in production.
- **Separate explicit yes.** Ask "Delete these {n} components from {org}? Data in deleted
  fields and objects is lost. (yes/no)" and proceed only on a clear yes to that question.

## 8. Deploy
After the user approves the validation result (and, for production, names the org and confirms):

```bash
sf-sdlc deploy quick --org <role> --json
sf project deploy quick --job-id <validation-job-id> --target-org <alias> --wait <n>
```

A quick deploy reuses the validated job without re-running tests. It is available for ten days
and only while no other deployment has reached the org since; otherwise validate again. Shared
orgs and production are always validated first, whatever `deploy.validateBeforeDeploy` says.

## 9. Pre- and post-deployment steps
Metadata deployment does not do everything. Record who did each step and when:
- **Before**: enable required features and settings; install or upgrade packages; export data
  affected by destructive changes; pause schedules or integrations if designed.
- **After**: assign permission sets and groups; activate flows deployed inactive; schedule
  Apex jobs; load data and configuration records that are not in source; set Named Credential
  secrets and External Credential principals; rebuild sharing if rules changed.
- Steps the agent cannot perform (Setup clicks, secrets) are listed for a named person.

## 10. Record
Write `docs/sdlc/05-release/deployments/DEP-<nnn>.md` from
[references/deployment-record-template.md](references/deployment-record-template.md) for every
validation and deployment to a shared org or production, including failed ones. Then report:
target and org type, what was validated and deployed (job IDs), test results, manual steps
still open, rollback plan, next step (`/sf-sdlc:test-run` in a test org; smoke test in production).

# Part B — Release

## 11. Scope
The version comes from the user; `REL-<version>` uses it unchanged. List the stories in the
release from the backlog and the deployments (`DEP-nnn`) that carry them. A story is in the
release only if it is deployed to the stage before production with a passing test run.

## 12. Readiness checklist
Build `docs/sdlc/05-release/REL-<version>/readiness.md` from
[references/readiness-template.md](references/readiness-template.md). Every line cites a file.
**A missing artifact is "No evidence", never "OK".** Checks:
- traceability complete (BR → story → LLD → test cases → run), from the RTM;
- every AC of every story has cited passing evidence;
- review verdicts and their conditions;
- test runs passed and exit criteria met in the last test stage;
- open defects by severity, each with its disposition and who accepted it;
- production (or final-stage) validation succeeded, with job ID, date and test results;
- approvals present on BRD, backlog, design, plans, test runs;
- manual steps, rollback plan, communication and support cover are in place.

## 13. Go/no-go recommendation
Recommend Go, Go with accepted risks, or No-go, with the blocking items first. The agent
recommends; a person decides and signs the approval record.

## 14. Release notes
Write `release-notes.md` from [references/release-notes-template.md](references/release-notes-template.md)
for a mixed audience: what changes for users first, in business language; then known issues;
then the technical inventory (components by New / Changed / Removed), manual steps and
deployment references. Take content from stories and deployment records, not from commit
messages alone. No customer data, credentials or internal hostnames.

## 15. Close-out (each action needs its own preview and explicit yes)
Only after the production deployment is recorded as successful:
- **Jira** (if `jira.enabled` and a Jira tool is connected): create or find the fix version,
  set it on the release's issues, transition them with `jira.transitions.done`, mark the version
  released. Show the issue list and the exact changes first.
- **Git tag and GitHub release**: confirm the tag name and target commit (the deployed commit
  on `git.mainBranch`), then
  `gh release create <tag> --target <commit-or-branch> --title "<title>" --notes-file <release-notes.md>`.
  Check `gh auth status` first. Never tag a commit that was not the one deployed.
- Without Jira or `gh`, list the manual steps instead.

## 16. Post-release
- **Smoke test** in production right after deployment: the P1 positive cases marked safe for
  production, run by a named person, read-only where possible, never creating test data in
  real records. Record the result in the deployment record.
- **Hypercare notes** in `readiness.md`: period and owner; what to watch (Apex exception and
  flow error emails, failed asynchronous jobs, integration error logs); the rollback decision
  point; how users report problems; open defects carried over.
