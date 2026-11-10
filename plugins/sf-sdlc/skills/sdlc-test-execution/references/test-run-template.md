# Test run TR-{YYYYMMDD}-{nn} — {scope in a few words}

Save as `docs/sdlc/04-qa/test-runs/TR-{YYYYMMDD}-{nn}.md`. One file per execution cycle against
one org. Every number in this file comes from tool output or from a named tester; nothing is
estimated.

| Item | Details |
|---|---|
| Run type | Story verification / Regression / Release candidate / UAT / Re-test (use the re-test template) |
| Scope | Stories {US-nn-mm, …}; release {REL-… or —} |
| Target org | role `{qa}` → alias `{alias}`; classified `{sandbox}` by `sf-sdlc org classify` on {date} |
| Build under test | {DEP-nnn} — commit `{sha}` on branch `{branch}` |
| Executed by | {agent name} for automated tests; {tester names} for manual cases |
| Date | {YYYY-MM-DD} |
| Result | **{Passed / Failed / Incomplete}** |
| Status | Draft for review |

## 1. Summary
| | Planned | Executed | Passed | Failed | Blocked | Not run |
|---|---|---|---|---|---|---|
| Apex (automated) | | | | | | |
| Jest (automated) | | | | | | |
| Manual / UI | | | | | | |
| **Total** | | | | | | |

Two or three sentences for a mixed audience: what was proven, what failed, what is blocked.

## 2. Commands and raw results
| # | Command | Run ID | Started / duration | Outcome | Raw output |
|---|---|---|---|---|---|
| 1 | `sf-sdlc test run --org qa --tests OpportunityHealthServiceTest,OpportunityTriggerHandlerTest --json` | `707…` | {time} / {n} s | 23 run, 21 passed, 2 failed | `{path to saved JSON}` |
| 2 | `npm run test:unit -- healthPanel` | — | | 9 passed | `{path}` (commit `{sha}`) |

Commands are recorded exactly as executed. A command that was not run is not listed.

## 3. Coverage
Targets from the project config: changed classes ≥ `quality.coverageTarget` = {n}%; org-wide ≥
`quality.orgCoverageMinimum` = {n}%.

| Changed class / trigger | Covered % | Uncovered lines | Target met |
|---|---|---|---|
| `OpportunityHealthService` | 94 | 71, 88 | Yes |
| `OpportunityHealthBatch` | 68 | 22-31 | **No** |

Org-wide coverage: {n}% from run #{n} (`RunLocalTests`) — or "not measured in this run".
Jest coverage (if run with `--coverage`): {statements / branches} for changed bundles.

## 4. Results by test case
| Test case | AC | Automation (class.method / Jest test / manual) | Status | Evidence | Defect |
|---|---|---|---|---|---|
| TC-US-04-02-001 | AC-1 | `OpportunityHealthServiceTest.calculate_noRisks_returns100` | Passed | run #1 | — |
| TC-US-04-02-004 | AC-3 | `OpportunityHealthServiceTest.calculate_discountAt20_noDeduction` | Failed | run #1 | DEF-003 |
| TC-US-04-02-009 | AC-1 | Manual | Passed | tester {name}, {date}, `evidence/TC009.png` | — |
| TC-US-04-02-012 | AC-6 | `OpportunityHealthBatchTest.batch_bulk` | Blocked | run #1 | — (environment) |

Status values: Passed · Failed · Blocked · Not run · Skipped.

Executed tests with no test case (untraced): {list or "none"}.

## 5. Failures and triage
| # | Test | Message (first line) and location | Category | Reasoning | Action |
|---|---|---|---|---|---|
| 1 | `OpportunityHealthServiceTest.calculate_discountAt20_noDeduction` | `Assertion Failed: Expected: 100, Actual: 90` — `OpportunityHealthService.cls:63` | Product defect | AC-3 says exactly 20% applies no deduction; the code compares with `>=` | DEF-003 |
| 2 | `OpportunityHealthBatchTest.batch_bulk` | `UNABLE_TO_LOCK_ROW` | Environment / data | Parallel test execution locking the shared parent account | Re-run serially; owner QA |
| 3 | `OpportunityTriggerHandlerTest.update_setsDefaults` | `List has no rows for assignment` | Test defect | Test queries a record type by name that exists only in the developer org | Raise to the test's owner |

Categories: Product defect · Test defect · Environment / data.

## 6. Manual and UAT execution records
| Test case | Tester | Date | Org | Step results (actual) | Status | Evidence |
|---|---|---|---|---|---|---|
| TC-US-04-03-002 | {name, role} | {date} | {alias} | 1 as expected; 2 as expected; 3 banner text reads "At risk" | Passed | `evidence/TC-US-04-03-002.png` |

Results in this section are as reported by the named tester.

## 7. Defects raised in this run
| Defect | Severity | Story | Test cases | Summary | Jira key |
|---|---|---|---|---|---|
| DEF-003 | Major | US-04-02 | TC-US-04-02-004 | Discount of exactly 20% deducts 10 points | — |

## 8. Exit criteria
Source: `docs/sdlc/04-qa/test-strategy.md` §{n} (or "skill defaults applied").

| Criterion | Met | Evidence |
|---|---|---|
| All P1 cases executed and passed | No | TC-US-04-02-012 blocked |
| Every AC has a passing case | No | AC-3 failed (DEF-003) |
| No open Blocker or Major defect | No | DEF-003 Major |
| Changed classes at or above the coverage target | No | `OpportunityHealthBatch` 68% |
| Org-wide coverage at or above the minimum | Not measured | no `RunLocalTests` in this run |

**Exit criteria: {met / not met}.**

## 9. Gaps and next steps
What was not executed and why; environment fixes needed; re-test plan (`/sf-sdlc:retest` after
DEF-003 is fixed and deployed).

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only (QA lead; business owner for a UAT run).
