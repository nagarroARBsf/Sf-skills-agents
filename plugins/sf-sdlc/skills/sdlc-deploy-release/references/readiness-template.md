# Release readiness — REL-{version}

Save as `docs/sdlc/05-release/REL-{version}/readiness.md`. Every row cites the file that proves
it. Evidence values: **OK** (the cited artifact shows it), **Not OK** (the artifact shows a
failure), **No evidence** (the artifact is missing or silent). "No evidence" is never rounded
up to OK.

| Item | Details |
|---|---|
| Release | REL-{version} — {name or theme} |
| Planned production date | {date, window} |
| Scope | {n} stories in {n} epics (list in section 2) |
| Production target | role `production` → alias named by the user at deployment time |
| Prepared by / date | {agent name} / {YYYY-MM-DD} |
| Recommendation | **{Go / Go with accepted risks / No-go}** |
| Status | Draft for review |

## 1. Summary for decision makers
Five sentences at most, in business language: what the release delivers, whether it is ready,
what blocks it or what risk is being accepted, and what the decision maker is asked to decide.

## 2. Scope
| Story | Title | Epic / BR | Jira key | In release because |
|---|---|---|---|---|
| US-04-02 | Calculate and store the health score | EPIC-04 / BR-04 | {key} | Deployed to `{uat}` in DEP-012; TR-20260120-01 passed |

Stories planned but not included, and why: {list or none}.

## 3. Readiness checklist
| # | Check | Evidence | Result |
|---|---|---|---|
| 1 | Traceability complete: every story traces to a BR and has LLD, test cases and a run | `docs/sdlc/04-qa/rtm.md` ({date}) | |
| 2 | Every AC of every story has passing evidence | section 4 | |
| 3 | Code review verdict Approve, or conditions met, for every story | section 5 | |
| 4 | Test runs passed; exit criteria met in the last test stage | TR-{…}, section 6 | |
| 5 | No open Blocker or Major defect; others dispositioned | section 7 | |
| 6 | Coverage: changed classes at or above `quality.coverageTarget`; org-wide at or above `quality.orgCoverageMinimum` | TR-{…} / DEP-{…} | |
| 7 | Code Analyzer: nothing at or above `quality.analyzerSeverityThreshold` | review.md tool results / DEP readiness | |
| 8 | Validation against production succeeded with `deploy.testLevel.production` | DEP-{nnn}: job `{id}`, {date} | |
| 9 | Validation is still usable (within ten days, no other deployment since) | DEP-{nnn} | |
| 10 | Destructive changes confirmed; data exported | DEP-{nnn} §2 | |
| 11 | Rollback plan written, artefacts prepared, decision owner named | DEP-{nnn} §4 | |
| 12 | Pre- and post-deployment manual steps listed with owners | DEP-{nnn} §7 | |
| 13 | Approvals present: BRD, backlog, HLD/LLD, plans, test runs | section 8 | |
| 14 | Release notes written and reviewed | `release-notes.md` | |
| 15 | Users, support and stakeholders informed; training done where needed | {reference} | |
| 16 | Hypercare owner and period agreed | section 10 | |

## 4. Acceptance criteria evidence
| Story | ACs | Passing in | Not evidenced |
|---|---|---|---|
| US-04-02 | AC-1..AC-6 | TR-20260120-01 (TC-US-04-02-001..014) | — |
| US-04-03 | AC-1..AC-5 | TR-20260120-01 | **AC-4: no executed case** |

## 5. Code review verdicts
| Story | Review file | Round | Verdict | Open conditions |
|---|---|---|---|---|

## 6. Test runs
| Run | Type | Org | Build | Result | Exit criteria |
|---|---|---|---|---|---|

## 7. Defects
| Severity | Open | Closed with cited passing run | Deferred / accepted |
|---|---|---|---|
| Blocker | | | |
| Major | | | |
| Minor | | | |
| Trivial | | | |

Open and deferred defects:

| Defect | Severity | Story | Summary | Disposition | Accepted by (name, date) |
|---|---|---|---|---|---|

A defect "accepted" without a named person is open.

## 8. Approvals found
| Artifact | Version | Status | Approver | Date |
|---|---|---|---|---|
| `docs/sdlc/01-brd/BRD.md` | | | | |
| `docs/sdlc/02-backlog/backlog.md` | | | | |
| `docs/sdlc/03-architecture/HLD.md` | | | | |
| `specs/{story}/plan.md` (each) | | | | |
| TR-{…} | | | | |

Copied from each artifact's approval record. An empty record is "Draft for review".

## 9. Risks
| # | Risk | Likelihood | Impact | Mitigation | Accepted by |
|---|---|---|---|---|---|

Include: items marked "No evidence" above, things that cannot be rolled back, manual steps that
depend on one person, first-time production behaviours (data volumes, integrations, schedules).

## 10. Hypercare
| Item | Details |
|---|---|
| Period and owner | {dates}; {name} |
| What is watched | Apex exception emails; flow error emails; failed asynchronous jobs; integration error logs; adoption of {feature} |
| Rollback decision point | {when, who, on which signal} |
| How users report problems | {channel} |
| Defects carried into hypercare | DEF-{nnn}, … |

## 11. Recommendation
**{Go / Go with accepted risks / No-go}**

- Blocking items: {list, each with the checklist number}
- Risks to be accepted for a Go: {list}
- Conditions: {what must be true at deployment time}

This is a recommendation. The decision is the approver's.

## Approval record (go / no-go decision)
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only: `Approved` = Go, `Approved with conditions` = Go with the listed
conditions, `Rejected` = No-go.

## 12. Close-out (after production deployment)
| Action | Done | Reference | Confirmed by |
|---|---|---|---|
| Production deployment | | DEP-{nnn} | |
| Production smoke test | | DEP-{nnn} §8 | |
| Jira fix version set and released | | {version name} | {name: yes, date} |
| Git tag and GitHub release | | {tag}, {URL} | {name: yes, date} |
| RTM updated with the release | | `docs/sdlc/04-qa/rtm.md` | |
