# Test strategy — {Project} {Release}

| Item | Details |
|---|---|
| Scope | Epics {list}; stories {n} |
| Inputs | BRD v{x}, backlog {date}, HLD v{x} |
| Target orgs | Test org roles from `deploy.pipeline` in the project config (never production) |
| Status | Draft for QA lead review |

## 1. Objectives and scope
What must be proven before go-live; what is out of scope for testing (and why).

## 2. Test levels and responsibilities
| Level | Environment | Entry criteria | Exit criteria | Owner |
|---|---|---|---|---|
| Unit (Apex/Jest) | Dev sandbox / scratch | Code complete | All pass; coverage of new and changed classes ≥ `quality.coverageTarget` | Dev |
| SIT | Integration / QA sandbox | Deployed via pipeline; smoke passes | All P1 pass; no open Blocker or Major defect | QA |
| UAT | UAT sandbox (partial copy) | SIT exit met | Business sign-off | Business |
| Regression | QA / Staging | Release candidate | Smoke + REG pass | QA |
| Performance | Full copy | Representative data volume | NFR targets met | QA / Architect |

## 3. Environments and data
Sandboxes and refresh plan, test users per persona (with permission sets), synthetic data sets and
volumes, integration endpoints (mocks vs real), data masking.

## 4. Entry and exit criteria per phase
## 5. Defect management
Severity scale (Blocker, Major, Minor, Trivial), workflow, triage cadence, tool. Defects are
recorded as `DEF-nnn` and closed only with a cited passing re-test (`sdlc-test-execution` skill).

## 6. Automation approach
What is automated at which level and with which tool; CI execution; flaky test policy.

## 7. Risks
| Risk | Mitigation |
|---|---|
| Sandbox data not representative | Load volume data set before performance tests |

## 8. Schedule and reporting
Test cycles, daily status metrics (executed/passed/failed/blocked), final test summary report.
Each cycle is recorded as a test run `TR-<YYYYMMDD>-<nn>` under `docs/sdlc/04-qa/test-runs/`.

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
