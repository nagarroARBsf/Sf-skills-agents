---
name: sdlc-qa-test-case-generate
description: "Design comprehensive manual and automation-ready test cases for Salesforce user stories: positive flows, negative scenarios, boundary/edge cases, persona and permission (profile, permission set, sharing, FLS) tests, bulk/governor-limit tests, integration failure tests, LWC UI/accessibility/mobile checks and regression impact — derived from acceptance criteria, BRD rules and the LLD using equivalence partitioning, boundary values, decision tables and state transitions. Produces per-story test case files, a CSV for Xray/Zephyr/TestRail import, a test strategy and a requirements traceability matrix, and outlines Apex/Jest test methods. TRIGGER when: user asks for test cases, test scenarios, QA plan, test strategy, UAT scripts, regression suite, test coverage of stories, or an RTM. DO NOT TRIGGER when: user wants to run tests, record results, log defects or re-test (use sdlc-test-execution), or wants Apex or Jest test code written (use the installed Apex or LWC test skill)."
metadata:
  version: "1.1"
  author: "Nagarro Salesforce CoE"
---

# sdlc-qa-test-case-generate

Turn stories into test cases that prove each acceptance criterion **and** probe the ways Salesforce
solutions actually break: permissions, bulk data, automation order, limits, and integrations.

## Inputs
- Backlog (`docs/sdlc/02-backlog/backlog.md`) — stories and ACs. Required.
- LLD per story (`docs/sdlc/03-architecture/LLD/`) — components, rules, error handling. Strongly
  preferred; without it, design black-box tests from the ACs and say so.
- BRD (`docs/sdlc/01-brd/BRD.md`) — personas, business rules, NFRs.
- Optional: `specs/<story>/spec.md`, `plan.md` and implemented code (for regression impact), the
  client's test-management tool (Xray, Zephyr Scale, TestRail, Azure Test Plans).
- Project config (`sf-sdlc config show --json`): `quality.coverageTarget`,
  `quality.bulkTestSize` and the test org roles in `deploy.pipeline`. Never hard-code them.

## Outputs
- `docs/sdlc/04-qa/test-strategy.md` (once per release) — [references/test-strategy-template.md](references/test-strategy-template.md)
- `docs/sdlc/04-qa/test-cases/US-nn-mm.md` — [references/test-case-template.md](references/test-case-template.md)
- `docs/sdlc/04-qa/test-cases.csv` — all cases, import format in the template
- `docs/sdlc/04-qa/rtm.md` — format in `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-workflow/references/traceability-matrix.md`

## Workflow

### 1. Analyse each story
List: ACs, business rules (from BRD `RULE-nn.m`), inputs and their valid/invalid ranges,
personas involved, components from the LLD, states and transitions, integrations, NFRs.

### 2. Design with techniques, not intuition
Use [references/salesforce-test-design.md](references/salesforce-test-design.md):
- **Equivalence partitions + boundary values** for every threshold and range
  (19.99 / 20 / 20.01 %; 0, 1, max length).
- **Decision table** when two or more rules combine (scores, eligibility, routing).
- **State transition** for status/stage lifecycles, including invalid transitions.
- **Persona × permission matrix** for every story that shows or changes data.
- **Error guessing** from the Salesforce failure catalogue (bulk, limits, locking, null lookups,
  inactive picklist values, time zones, currency).

### 3. Write test cases
Every AC gets at least one positive case. Every story gets, where applicable:

| Category | Code | Minimum |
|---|---|---|
| Positive / happy path | `POS` | 1 per AC |
| Negative / invalid input / blocked action | `NEG` | 1 per validation or rule |
| Boundary / edge | `EDGE` | each threshold: below, at, above |
| Security: persona, CRUD/FLS, sharing | `SEC` | each persona the story names + one unauthorised |
| Bulk / governor limits | `BULK` | 1 when triggers, flows or batch are involved (`quality.bulkTestSize` records, at least 200) |
| Integration | `INT` | success, timeout, error response, retry/idempotency |
| UI / UX / accessibility / mobile | `UI` | states (loading, empty, error), keyboard, mobile app |
| Performance | `PERF` | when an NFR sets a number |
| Regression | `REG` | existing behaviour the change could break (LLD items with change status `Changed` or `Removed`, and the plan's Impact Analysis) |

Steps are concrete and executable by someone who did not read the story: exact navigation, exact
values, exact expected text. Preconditions name the user/persona and the data.

### 4. Automation candidates
Mark each case's best automation level: `Apex` (logic, bulk, security via `System.runAs`), `Jest`
(LWC logic/rendering), `UI` (UTAM, Provar, Playwright, Copado Robotic Testing — use what the
project has), or `Manual` (exploratory, visual, UAT). Add an **Apex test outline** per story
(class name, method names, what each asserts). For a case automated in Apex or Jest, name the
test class and method (or Jest file and test name) in the case, so a test run can map a tool
result back to the case. Writing the test code is the developer's job: use the installed Apex or
LWC test skill if present; if it is missing, tell the user to run `/sf-sdlc:skills`.

### 5. Coverage check
- [ ] Every AC → ≥ 1 test case.
- [ ] Every business rule and threshold → boundary cases.
- [ ] Every persona in the story → access test; one persona without access → denied test.
- [ ] Automation-bearing stories → bulk case.
- [ ] Each LLD error path → a negative case.
- [ ] RTM updated; gaps listed.

### 6. Link to execution
Design and execution are separate stages with one shared record:
- Every case file carries the **Execution status** table from the template. Write each new case
  as `Not run`. Never write `Passed` or `Failed` here: those come only from a recorded test run.
- When updating cases for a story that has already been executed, keep the existing status rows.
  A case whose steps or expected result changed is reset to `Not run` with a note
  ("changed after TR-…"); it must be executed again.
- Execution, test-run reports (`TR-…`), defects (`DEF-nnn`) and re-tests are handled by the
  `sdlc-test-execution` skill (`/sf-sdlc:test-run`, `/sf-sdlc:retest`). The RTM takes its result,
  defect and release columns from those records.

### 7. Report
Paths, counts by category and priority, automation split, ACs without testable behaviour (raise to
PO), defects suspected from the design (for example an AC that contradicts the LLD), the
regression areas to retest, and the next step: QA lead review, then `/sf-sdlc:test-run` once the
build is deployed to a test org.

## Priority
`P1` blocks release (core AC, security, data loss), `P2` major function or common edge, `P3` minor or
cosmetic. Smoke suite = P1 positive cases across all stories.

## Test data
Never use production personal data. Define test data per case (or a shared data set in the strategy):
synthetic accounts, users per persona with the right permission sets, and record volumes for bulk.
