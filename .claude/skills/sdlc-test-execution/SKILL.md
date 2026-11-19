---
name: sdlc-test-execution
description: "Execute Salesforce tests and close the loop: run Apex tests through the Salesforce CLI against a non-production org from the project config, run LWC Jest tests, run UI cases in a browser, read failures and per-class and org-wide coverage against the project targets, triage each failure (product defect, test defect, environment or data), record manual and UAT results reported by people, write the test-run report (TR), log defects (DEF) with steps, expected and actual results and evidence, create Jira bugs only after a preview and explicit yes, re-test fixes by re-running the failed and linked cases plus the regression set, and judge exit criteria. A defect is never closed without a cited passing run. TRIGGER when: user asks to run tests, check coverage, report results, log or triage a defect, re-test or verify a fix, record UAT results, or runs /sdlc-test-run or /sdlc-retest. DO NOT TRIGGER when: the user wants test cases designed (use sdlc-qa-test-case-generate) or a change reviewed (use sdlc-code-review)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-test-execution

Report what a run actually returned. No result, no claim: a test that was not executed is
`Not run`, and coverage that was not measured is "unverified".

Two modes: **Execute** (`/sdlc-test-run`) and **Re-test** (`/sdlc-retest`).

## Inputs
- Test cases: `docs/sdlc/04-qa/test-cases/US-nn-mm.md` (and `test-strategy.md` for exit criteria).
- Project config (`node .claude/bin/sf-sdlc config show --json`): `orgs.*`, `deploy.pipeline`,
  `deploy.waitMinutes`, `quality.coverageTarget`, `quality.orgCoverageMinimum`,
  `quality.bulkTestSize`, `jira.*`, `paths.docs`.
- What is deployed in the target org: the deployment record (`DEP-nnn`) or the commit.

## Outputs
- `docs/sdlc/04-qa/test-runs/TR-<YYYYMMDD>-<nn>.md` — [references/test-run-template.md](references/test-run-template.md)
- `docs/sdlc/04-qa/defects/DEF-<nnn>.md` — [references/defect-template.md](references/defect-template.md)
- Updated Execution status tables in the test-case files, and `docs/sdlc/04-qa/rtm.md`.
- Jira bugs, only after a preview and an explicit yes.

## Execute mode

### 1. Preconditions (stop if one fails)
1. **Target org.** The user names an org role or alias; resolve a role through `orgs.<role>`.
   Run `node .claude/bin/sf-sdlc org classify <alias> --json` and state the result.
   - `sandbox`, `scratch`, `developer`: proceed.
   - `production`, or an alias listed in `orgs.production`: **stop.** Tests are never run in
     production from this skill; Apex tests there run only as part of a deployment.
   - `unknown`: treat as production and stop; ask the user to fix the alias or the config.
2. **Build under test.** Identify what the org contains: the latest `DEP-nnn` for that org, or
   the commit the user states. If the story's change is not deployed there, say so and stop;
   propose `/sdlc-deploy <role>`.
3. **Test cases exist** for the stories in scope, each automated case naming its test class and
   method. If none exist, propose `/sdlc-test-cases`.
4. **Data and users.** Manual cases need the personas' test users and data from the strategy.
   Never use production personal data.

### 2. Run Apex tests
Preferred (reads org, wait time and thresholds from the config, records the run):

```bash
node .claude/bin/sf-sdlc test run --org qa --tests OpportunityHealthServiceTest,OpportunityTriggerHandlerTest --json
node .claude/bin/sf-sdlc test run --org qa --level RunLocalTests --json
node .claude/bin/sf-sdlc test report --org qa --json
```

Fallback when the kit CLI is unavailable (`<n>` = `deploy.waitMinutes`):

```bash
sf apex run test --target-org <alias> --class-names OpportunityHealthServiceTest --class-names OpportunityTriggerHandlerTest --code-coverage --result-format json --wait <n>
sf apex run test --target-org <alias> --test-level RunLocalTests --code-coverage --result-format json --wait <n>
sf apex get test --test-run-id <id> --target-org <alias> --code-coverage --result-format json
```

Choose the scope deliberately:
- Story verification: the test classes named in the story's test cases and plan (§7), plus the
  tests of every changed class.
- Regression or release candidate: `RunLocalTests` (all tests except managed packages). This is
  also the only scope that gives a current org-wide coverage figure.
- If the wait expires the run continues in the org: fetch it with the run ID. Do not start a
  second run of the same scope.

### 3. Run LWC Jest tests
Only when the project has them (`package.json` has a `test:unit` script):

```bash
npm run test:unit
npm run test:unit -- --coverage
npm run test:unit -- healthPanel
```

Jest runs locally against source, not against the org: record the commit it ran on. If there is
no script, record "Jest not configured" as a gap; do not invent a result.

### 4. Read the results
From the JSON, not from the summary line:
- **Outcome**: tests run, passed, failed, skipped; the run ID; duration.
- **Failures**: for each, class and method, message and stack trace (first project frame).
- **Per-class coverage**: every class and trigger changed by the stories in scope against
  `quality.coverageTarget`. A changed class missing from the coverage list has 0% from this run.
- **Org-wide coverage** against `quality.orgCoverageMinimum`: valid only from a `RunLocalTests`
  run; otherwise report "not measured in this run".
- A run with zero tests executed, or a pass with no assertions behind it, is not a pass. Say so.

Map each tool result to its test case through the class and method named in the case. Tests
with no test case are reported as "untraced"; cases with no executed test stay `Not run`.

### 5. Triage every failure
Decide the category before logging anything.

| Category | Signals | Action |
|---|---|---|
| **Product defect** | Assertion fails on a value the AC defines; behaviour contradicts the spec or LLD; passes on the previous build | Log `DEF-nnn`; hand to the developer |
| **Test defect** | Test asserts something the AC does not say; hard-coded ID, date or user; depends on org data or test order; `SeeAllData`; wrong mock | Fix the test if QA owns it, otherwise raise to its owner. No `DEF` against the product; record it in the run |
| **Environment or data** | `UNABLE_TO_LOCK_ROW`; missing permission set assignment, record type, custom setting or metadata record in the org; inactive user; unrelated validation rule or duplicate rule firing; `MIXED_DML_OPERATION` from org automation; deployment incomplete; sandbox refresh state | Record as `Blocked` with the cause and the owner; fix the environment; re-run. No product `DEF` |

Rules: read the failing test and the code it exercises before deciding; one root cause is one
defect, however many tests it fails; if the story and the LLD disagree about the expected
result, it is a suspected product defect for the PO and architect, not a choice for QA; QA does
not change product code.

### 6. UI cases in the browser, manual and UAT cases
**UI cases you can run yourself.** When the `sf-browser` tools (Playwright MCP) are available, run the
UI, persona and LWC cases in a real browser against the same non-production org, following the
`sdlc-ui-testing` skill (locators, waits, accessibility and mobile checks, console and server errors,
session rules): get the address with
`node .claude/bin/sf-sdlc browser url --org <role> --json`; the person signs in in the browser window
the first time (never type a password); act on snapshot references; check every expected result word
for word; save a screenshot per verified result under `docs/sdlc/04-qa/test-runs/evidence/<TR-id>/`;
record the executor as `Claude (browser, sf-browser)`; call `browser_close` at the end. Without the
browser tools, those cases are manual cases.

**Manual cases a person runs** are **recorded, not produced**:
- Give the tester the cases in execution order with preconditions and data.
- Record for each case what the named person reports: tester, date, org, per-step actual result,
  status, evidence reference (screenshot or recording file name, record URL without credentials).
- Never mark a manual case `Passed` without a named person's reported result, or a browser case
  without its screenshots. Cases nobody executed stay `Not run`.
- UAT sign-off is the business owner's entry in the test run's approval record.

### 7. Write the test run and update status
1. Next ID: `TR-<YYYYMMDD>-<nn>` (run date, next sequence for that day).
2. Fill the test-run template: scope, org, build, commands, results, coverage, failures with
   triage, blocked cases, defects raised, exit-criteria assessment, raw output location.
3. Update each test-case file's Execution status table: status, `TR-…`, `DEF-nnn`.
4. Update the RTM result and defect columns.

### 8. Defects
For each product defect write `DEF-nnn` (next free number) from the template: severity, steps to
reproduce, expected (with the AC or rule it comes from), actual, evidence (test name, message,
run ID), linked `TC`, `TR`, story and build. Severity:

| Severity | Meaning |
|---|---|
| Blocker | Core AC fails, data loss or exposure, or testing cannot continue |
| Major | AC fails with no acceptable workaround, or a security or bulk failure |
| Minor | AC met with a deviation, or a failure with an easy workaround |
| Trivial | Cosmetic; no AC affected |

Jira bug (optional): only if `jira.enabled` and a Jira tool is connected. Search first for an
existing issue with the label or summary prefix `DEF-nnn`. Show the exact payload (project
`jira.projectKey`, type `jira.issueTypes.bug`, summary `DEF-nnn …`, labels `DEF-nnn`,
`US-nn-mm`, `jira.labels`, link to the story's issue) and ask for an explicit yes. Record the
returned key in the defect file. Without Jira, the defect file is the record.

Production findings from the Observe stage (`sdlc-workflow`, section Observe) that are defects
use the same template with `Found in: production` and a link to the findings file. Every defect,
wherever found, ends with a "Constraint added" in its Fix section before it can close.

## Re-test mode

A fix is not verified because someone says it is fixed.

1. **Select defects**: the `DEF-nnn` IDs given, or all with status `Ready for re-test`. For each,
   confirm the fix is in the target org: the fixing commit is contained in the build recorded by
   the latest `DEP-nnn` for that org. If not, stop for that defect.
2. **Build the re-test set**, exactly:
   - every case that failed and is linked to the defect;
   - every case linked to the components the fix changed (from the fix's diff:
     `node .claude/bin/sf-sdlc delta --from <ref-before-fix> --json`);
   - the regression set: all `REG` cases of the affected stories and the P1 smoke cases.
   Run tests for the automated ones; hand the manual ones to the tester.
3. **Run and record** as a new test run (`TR-…`, type Re-test), using
   [references/retest-template.md](references/retest-template.md).
4. **Update each defect**:
   - all its failed cases now pass, no regression case fails, **and** "Constraint added" in the
     defect's Fix section is filled → `Closed`, citing the `TR-…` and the passing test names.
     If the run passes but the constraint is empty, leave the defect `Ready for re-test`, say
     "passing, constraint missing" and ask the developer for the test, rule, hook or reason. When
     the constraint is a new test, it must be in the passing run;
   - still failing → `Reopened`, with the new evidence appended;
   - a regression case fails → the original defect stays open and a new `DEF-nnn` is logged
     for the regression, linked to the fix.
   **Never close a defect without a passing run cited in its file and its constraint recorded.**
   Never delete a defect.
5. Update test-case status, the RTM, and (after preview and explicit yes) the Jira bug's
   status using the transition names in `jira.transitions`.

## Exit criteria
Judge against `test-strategy.md`; where it sets none, use these and say that defaults applied:
- every P1 case executed and passed; every AC has at least one passing case in a cited run;
- no open Blocker or Major defect; Minor and Trivial defects listed and accepted by a person;
- every changed Apex class and trigger at or above `quality.coverageTarget`; org-wide coverage
  at or above `quality.orgCoverageMinimum` from a `RunLocalTests` run;
- no `Blocked` or `Not run` P1 or P2 case without a recorded decision;
- every closed defect cites its passing re-test and its constraint added.

State "met" or "not met" per criterion with the evidence file. The QA lead signs the approval
record; the agent does not.

## Report
Run ID and path; org and build; counts (run, passed, failed, blocked, not run); failures by
triage category; coverage against both targets; defects raised or closed; exit criteria met or
not; next step (`/sdd-implement` for fixes then `/sdlc-deploy` and `/sdlc-retest`, or
`/sdlc-release` when the exit criteria are met).
