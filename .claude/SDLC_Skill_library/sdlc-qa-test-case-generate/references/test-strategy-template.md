# Test strategy — {Project} {Release}

| Item | Details |
|---|---|
| Scope | Epics {list}; stories {n} |
| Inputs | BRD v{x}, backlog {date}, HLD v{x} |
| Status | Draft for QA lead review |

## 1. Objectives and scope
What must be proven before go-live; what is out of scope for testing (and why).

## 2. Test levels and responsibilities
| Level | Environment | Entry criteria | Exit criteria | Owner |
|---|---|---|---|---|
| Unit (Apex/Jest) | Dev sandbox / scratch | Code complete | All pass; coverage ≥ 85% for new classes | Dev |
| SIT | Integration / QA sandbox | Deployed via pipeline; smoke passes | All P1 pass; no open Sev1/Sev2 | QA |
| UAT | UAT sandbox (partial copy) | SIT exit met | Business sign-off | Business |
| Regression | QA / Staging | Release candidate | Smoke + REG pass | QA |
| Performance | Full copy | Representative data volume | NFR targets met | QA / Architect |

## 3. Environments and data
Sandboxes and refresh plan, test users per persona (with permission sets), synthetic data sets and
volumes, integration endpoints (mocks vs real), data masking.

## 4. Entry and exit criteria per phase
## 5. Defect management
Severity definitions (Sev1 blocker … Sev4 cosmetic), workflow, triage cadence, tool.

## 6. Automation approach
What is automated at which level and with which tool; CI execution; flaky test policy.

## 7. Risks
| Risk | Mitigation |
|---|---|
| Sandbox data not representative | Load volume data set before performance tests |

## 8. Schedule and reporting
Test cycles, daily status metrics (executed/passed/failed/blocked), final test summary report.
