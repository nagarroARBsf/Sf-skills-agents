# Re-test run TR-{YYYYMMDD}-{nn} — re-test of {DEF-nnn, …}

Save as `docs/sdlc/04-qa/test-runs/TR-{YYYYMMDD}-{nn}.md`. A re-test is a test run with a fixed
scope: the failed cases, the cases linked to the fix, and the regression set. Nothing is closed
on the basis of this file unless the results below are from an actual run.

| Item | Details |
|---|---|
| Run type | Re-test |
| Defects under re-test | DEF-{nnn}, … |
| Original run(s) | TR-{…} |
| Target org | role `{qa}` → alias `{alias}`; classified `{sandbox}` on {date} |
| Build under test | {DEP-nnn} — commit `{sha}` |
| Fix present in build | DEF-{nnn}: commit `{fix sha}` is contained in `{sha}` — verified with `git merge-base --is-ancestor {fix sha} {sha}` |
| Executed by / date | {agent, testers} / {YYYY-MM-DD} |
| Result | **{All fixes verified / Some fixes failed / Regression found}** |
| Status | Draft for review |

## 1. Re-test set and why each case is in it
| Test case | Reason | Defect |
|---|---|---|
| TC-US-04-02-004 | Failed in TR-… | DEF-003 |
| TC-US-04-02-005, -006 | Linked to the fixed component `OpportunityHealthService` (same threshold logic) | DEF-003 |
| TC-US-04-02-010..013 | Regression set: `REG` cases of US-04-02 | — |
| TC-US-04-01-001, TC-US-04-03-001 | Smoke: P1 positive cases of affected stories | — |

Components changed by the fix (from `node .claude/bin/sf-sdlc delta --from {ref-before-fix} --json`):
`{ApiName}` ({type}, Changed), …

Cases deliberately left out, and why: {list or "none"}.

## 2. Commands and raw results
| # | Command | Run ID | Outcome | Raw output |
|---|---|---|---|---|
| 1 | `node .claude/bin/sf-sdlc test run --org qa --tests OpportunityHealthServiceTest --json` | `707…` | 14 run, 14 passed | `{path}` |

## 3. Results
| Test case | Previous status (run) | Status now | Evidence |
|---|---|---|---|
| TC-US-04-02-004 | Failed (TR-…) | Passed | `OpportunityHealthServiceTest.calculate_discountAt20_noDeduction`, run #1 |
| TC-US-04-02-010 | Passed (TR-…) | Passed | run #1 |

Coverage of the classes changed by the fix against `quality.coverageTarget` = {n}%:

| Class | Covered % | Target met |
|---|---|---|

## 4. Outcome per defect
| Defect | Failed cases now passing | Regression failures | Outcome | New status |
|---|---|---|---|---|
| DEF-003 | 1 of 1 | 0 | Fix verified | Closed — cites this run |
| DEF-004 | 0 of 2 | 0 | Still failing: `{message}` | Reopened |

Rules applied:
- `Closed` only when every failed case of the defect passes in this run, no regression case
  fails, and the defect's "Constraint added" is filled. The defect file's re-test history gets a
  row citing this run. Passing but no constraint → stays `Ready for re-test` ("constraint missing").
- Still failing → `Reopened`, new evidence appended to the defect file.
- A regression case fails → the original defect stays open; a new defect is logged below.
- A case that could not be executed → the defect stays `Ready for re-test`; say why.

## 5. New defects found during the re-test
| Defect | Severity | Test case | Summary | Linked to fix of |
|---|---|---|---|---|

## 6. Updates made
- [ ] Defect files: status, re-test history row, evidence.
- [ ] Test-case files: Execution status tables.
- [ ] `docs/sdlc/04-qa/rtm.md`: last run, defect columns.
- [ ] Jira bug status: {changed after preview and explicit yes on {date} by {name} / not changed —
      listed for the user}.

## 7. Exit criteria after this run
| Criterion | Met | Evidence |
|---|---|---|

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
