# Deployment record DEP-{nnn} — {target role}: {scope in a few words}

Save as `docs/sdlc/05-release/deployments/DEP-{nnn}.md`. One record per validation-and-deploy
to one org, including failed and abandoned attempts. Every value comes from command output or
from a named person.

| Item | Details |
|---|---|
| Target | role `{uat}` → alias `{alias}`; classified `{sandbox / production}` by `sf-sdlc org classify` on {date} |
| Named by | {person who named the target org}, {date and time} |
| Pipeline position | stage {n} of `deploy.pipeline` ({dev → qa → uat → production}); previous stage: DEP-{nnn} ({result}) / skipped — decided by {name}: {reason} |
| Release | REL-{version} or — |
| Stories | US-{nn-mm}, … |
| Source | branch `{branch}`, commit `{sha}`; working tree clean: yes |
| Baseline in target | commit `{sha}` from DEP-{nnn} (or "unknown — full deployment") |
| Type | Delta from `{ref}` / Full |
| Test level | `{RunLocalTests}` from `deploy.testLevel.{role}` |
| Result | **{Validated / Deployed / Failed / Cancelled / Rolled back}** |
| Status | Draft for review |

## 1. Readiness checks
| Check | Result | Evidence |
|---|---|---|
| Code review verdict | Approve | `specs/US-04-02-…/review.md` round 2 |
| Previous-stage test run | Exit criteria met | TR-20260115-01 |
| Open Blocker / Major defects for these stories | None | `docs/sdlc/04-qa/defects/` |
| Code Analyzer on the change | No violation at or above severity {n} | command output, {date} |
| Overrides | None / {what was overridden, by whom, why} | |

## 2. Components
Counts by metadata type and change status (from `sf-sdlc delta --from {ref} --json`).

| Type | New | Changed | Removed |
|---|---|---|---|
| ApexClass | 4 | 1 | 0 |
| CustomField | 2 | 0 | 1 |
| PermissionSet | 0 | 2 | 0 |

Manifest: `{path to package.xml}`. Full component list: `{path}` or below.

### Destructive changes
| Component | Type | Pre / post | Replaced by | Data consequence | Data exported | Confirmed by |
|---|---|---|---|---|---|---|
| `Opportunity.Legacy_Score__c` | CustomField | Post | `Opportunity.Deal_Health_Score__c` | Values on all records deleted | `{export file}`, {date} | {name}: "yes", {date and time} |

"None" if there are none. No destructive change runs without the Confirmed-by entry.

## 3. Validation
| Item | Value |
|---|---|
| Command | `sf-sdlc deploy validate --org {role} --delta --from {ref} --json` |
| Job ID | `0Af…` |
| Started / finished | {date time} / {date time} |
| Status | Succeeded / Failed |
| Components | {n} deployed, {n} failed |
| Tests | {n} run, {n} failed |
| Coverage, changed classes | lowest: `{Class}` {n}% (target `quality.coverageTarget` = {n}%) |
| Org-wide coverage | {n}% (minimum `quality.orgCoverageMinimum` = {n}%) |
| Warnings | {list or none} |

Failures (if any):

| # | Component or test | Error | Likely cause | Fix / owner |
|---|---|---|---|---|

Earlier attempts in this record: {job IDs and outcomes, or none}.

## 4. Rollback plan (written before deploying)
| Item | Details |
|---|---|
| Method | Re-deploy commit `{previous sha}` for Changed components; destructive manifest for New components; validate first |
| Prepared artefacts | `{rollback package.xml}`, `{rollback destructive manifest}` |
| Cannot be rolled back | {data changes, deleted fields, activated flow versions, sent notifications, …} |
| Data backups taken | `{files}` |
| Decision owner and deadline | {name}; within {period} of deployment |
| Trigger | {smoke test failure / named error signal} |

## 5. Approval to deploy
| Question asked | Answer | By | When |
|---|---|---|---|
| "Validation {job ID} succeeded. Deploy to {alias} ({type})?" | yes | {name} | {date time} |
| Production only: org named by the user | "{alias}" | {name} | {date time} |

## 6. Deployment
| Item | Value |
|---|---|
| Command | `sf-sdlc deploy quick --org {role} --json` |
| Job ID | `0Af…` |
| Finished | {date time} |
| Status | Succeeded / Failed |

## 7. Manual steps
| # | When | Step | Owner | Done (date, by) |
|---|---|---|---|---|
| 1 | Before | Export `Legacy_Score__c` values | {name} | |
| 2 | After | Assign permission set `Sales_Manager_Access` to the manager group | {name} | |
| 3 | After | Schedule `OpportunityHealthBatch` nightly | {name} | |
| 4 | After | Activate flow `{name}` version {n} | {name} | |

Steps not done are open items; the deployment is not complete until this table is.

## 8. Post-deployment verification
| Check | Result | By / evidence |
|---|---|---|
| Smoke test (P1 positive cases) | {n} of {n} passed | {tester}, {date} |
| Apex jobs, flow errors, integration logs | No new errors in the first {period} | {name} |

Next step: {`/sf-sdlc:test-run` in this org / promote to {next role} / hypercare}.

## 9. Rollback executed (only if it happened)
What was rolled back, by whom, when, job IDs, and what remained changed.

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only (release owner or environment owner).
