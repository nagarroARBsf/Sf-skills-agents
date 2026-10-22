---
name: sdlc-qa-test-case-generate
description: "Design comprehensive manual and automation-ready test cases for Salesforce user stories: positive flows, negative scenarios, boundary/edge cases, persona and permission (profile, permission set, sharing, FLS) tests, bulk/governor-limit tests, integration failure tests, LWC UI/accessibility/mobile checks and regression impact — derived from acceptance criteria, BRD rules and the LLD using equivalence partitioning, boundary values, decision tables and state transitions. Produces per-story test case files, a CSV for Xray/Zephyr/TestRail import, a test strategy and a requirements traceability matrix, and outlines Apex/Jest test methods. TRIGGER when: user asks for test cases, test scenarios, QA plan, test strategy, UAT scripts, regression suite, test coverage of stories, or an RTM. DO NOT TRIGGER when: user wants Apex test classes written as code (use platform-apex-test-generate), to run tests (platform-apex-test-run), or Agentforce agent tests (agentforce-test)."
metadata:
  version: "1.0"
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
- Optional: `specs/<story>/spec.md` and implemented code (for regression impact), the client's
  test-management tool (Xray, Zephyr Scale, TestRail, Azure Test Plans).

## Outputs
- `docs/sdlc/04-qa/test-strategy.md` (once per release) — [references/test-strategy-template.md](references/test-strategy-template.md)
- `docs/sdlc/04-qa/test-cases/US-nn-mm.md` — [references/test-case-template.md](references/test-case-template.md)
- `docs/sdlc/04-qa/test-cases.csv` — all cases, import format in the template
- `docs/sdlc/04-qa/rtm.md` — [../sdlc-workflow/references/traceability-matrix.md](../sdlc-workflow/references/traceability-matrix.md)

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
| Bulk / governor limits | `BULK` | 1 when triggers, flows or batch are involved (≥ 200 records) |
| Integration | `INT` | success, timeout, error response, retry/idempotency |
| UI / UX / accessibility / mobile | `UI` | states (loading, empty, error), keyboard, mobile app |
| Performance | `PERF` | when an NFR sets a number |
| Regression | `REG` | existing behaviour the change could break (from LLD "Modify" items) |

Steps are concrete and executable by someone who did not read the story: exact navigation, exact
values, exact expected text. Preconditions name the user/persona and the data.

### 4. Automation candidates
Mark each case's best automation level: `Apex` (logic, bulk, security via `System.runAs`), `Jest`
(LWC logic/rendering), `UI` (UTAM, Provar, Playwright, Copado Robotic Testing — use what the
project has), or `Manual` (exploratory, visual, UAT). Add an **Apex test outline** per story
(class name, method names, what each asserts) that the `platform-apex-test-generate` skill can
implement.

### 5. Coverage check
- [ ] Every AC → ≥ 1 test case.
- [ ] Every business rule and threshold → boundary cases.
- [ ] Every persona in the story → access test; one persona without access → denied test.
- [ ] Automation-bearing stories → bulk case.
- [ ] Each LLD error path → a negative case.
- [ ] RTM updated; gaps listed.

### 6. Report
Paths, counts by category and priority, automation split, ACs without testable behaviour (raise to
PO), defects suspected from the design (for example an AC that contradicts the LLD), and the
regression areas to retest.

## Priority
`P1` blocks release (core AC, security, data loss), `P2` major function or common edge, `P3` minor or
cosmetic. Smoke suite = P1 positive cases across all stories.

## Test data
Never use production personal data. Define test data per case (or a shared data set in the strategy):
synthetic accounts, users per persona with the right permission sets, and record volumes for bulk.
