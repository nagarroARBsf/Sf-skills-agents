# Spec-Driven Development (SDD) Planning

Mandatory plan format. Apply it whenever the user asks for a plan, an approach, an
impact analysis or a root-cause analysis, runs `/sf-sdlc:plan`, or uses plan mode on a
ticket or feature request.

**Plan before you code.** When the user asks for a plan, an approach, an analysis,
or is working in plan mode, produce a written specification **before** touching any
file. Do not implement until the plan is approved.

Applies to: "create a plan / what's the impact / how should we approach this", and
any plan-mode session on a Jira ticket.

Save the plan as `specs/<id>-<slug>/plan.md` (root from `paths.specs`). Project values
named below as `quality.*`, `git.*`, `jira.*`, `orgs.*` or `deploy.*` are read from the
project config with `sf-sdlc config show --json` — never typed from
memory.

## Write for a mixed audience

Directors and BAs read this plan alongside engineers. Lead with plain English, then
the detail. Expand each Salesforce term on first use ("Apex controller (server-side
class the page calls for data)"). Bullets, tables, and diagrams — not prose.

## Discovery first

Never plan from the ticket alone. Read every file the ticket names or implies —
in full — then trace dependencies **both directions**: who calls the code, and what
it depends on. Every `@AuraEnabled` method is public API, so grep for all consumers
(LWC, Aura, Flows, flexipages, tests) before changing a signature. Match existing
conventions. The plan's value is the impact surface the ticket *didn't* mention.

## Required sections, in this order

### 1. Problem Statement

Bullets only, two lists:

- **What is wrong today** — one bullet per symptom, as the user experiences it.
- **What is being asked for** — one bullet per deliverable, naming where and when
  it appears ("a bar chart of Cases by Type on the Account record page only"), plus
  what must keep working unchanged.

End with one line: **In one line:** the shape of the solution.

### 2. Root Cause & Current Behaviour

Plain-English cause first, then how it actually works — cited by file and line
(`AccountOppChartController.cls:14`). Name the mechanism, not the symptom.

### 3. Functional Requirements

Numbered, atomic, testable. Each maps to a test in §7 and a criterion in §8.

### 4. Metadata Scope

| Component | Type | Change | Why |
| --- | --- | --- | --- |

Include objects, fields, flexipages, permission sets, custom metadata.

- **Component** — the exact API name. **Type** — the Metadata API type name
  (`ApexClass`, `LightningComponentBundle`, `CustomField`, `FlexiPage`, `PermissionSet`, …).
- **Change** — exactly one of **New**, **Changed**, **Unchanged**, **Removed**.
  New = absent from the code base today; Changed = present and modified; Unchanged =
  present, read, and listed because the change depends on it; Removed = deleted by
  this change. Never write Unchanged for something you did not open.
- When the story has an LLD, take the rows from its metadata inventory and record
  only deviations. Keep `docs/sdlc/03-architecture/components.json` in step.

### 5. Technical Flow

Explain top-down in this fixed order: **Page → Component → Method → API Parameters.**

**Diagram (required).** Use the `sdlc-architecture-diagram` skill
(`${CLAUDE_PLUGIN_ROOT}/skills/sdlc-architecture-diagram/`) for a single high-level `flowchart`,
fenced as ```mermaid, with a one-sentence business caption and the skill's
new / changed / unchanged overlay. Structure it as parallel top-down lanes, one lane per entry point/context
the feature is reached from (e.g. a Home/App page vs. a Record page, or List View A
vs. List View B) — not as a generic layer stack:

```
Entry Point A                      Entry Point B
(what the user sees, plain          (what the user sees, plain
 English — e.g. "shows all           English — e.g. "shows related
 records")                            records + child records")
        |                                    |
        └──────────────┬─────────────────────┘
                        v
              LWC Component (real bundle name)
                        v
              Apex Class (real class name)
                        v
         Object(s) touched (real API names, e.g.
         Opportunity, Case)
```

Rules for this diagram:

- **Name real artifacts.** Every component/class node must show its actual name
  (the LWC bundle, the Apex controller/service/selector class) — never a generic
  label like "Component" or "Controller" on its own.
- **Name the Apex test class too**, either as its own node under the class it
  covers, or in the node label (`AccountOppChartController` /
  `AccountOppChartControllerTest`).
- **No internal implementation details.** Do not show decorators (`@wire`,
  `@AuraEnabled`), individual record/field names, DTOs, or method-level logic —
  those belong in the Walkthrough and the API parameter table below, not the
  diagram. The diagram is for a mixed audience; keep it to entry points →
  component → class → object.
- Highlight new or changed nodes with the overlay from the `sdlc-architecture-diagram`
  skill: the `new` / `changed` / `unchanged` / `removed` classes with its exact
  palette, the `[NEW]` / `[CHG]` / `[DEL]` label prefixes (unchanged has none), and
  the Key. Each node's status matches its row in §4. Keep the whole diagram to
  ~10 nodes, Key excluded.
- If the feature has only one entry point, use a single lane — don't invent a
  second one to fit the shape.

**Walkthrough.** One short block each: the **Page** and the context it supplies;
the **Component** and what makes each chart render; the **Method** each chart calls
(existing or new); then an **API parameter** table:

| Method | Called from | Parameters in | Returns | Behaviour when null |
| --- | --- | --- | --- | --- |

Close with the layer owners (UI / Controller / Service / Selector) and the one-line
flow: `Record page → @api recordId → @wire(getX, { accountId: '$recordId' }) → Controller → Selector → SOQL`.
Justify any deviation from existing repo patterns.

### 6. Impact Analysis

Beyond the obvious files: callers of changed signatures, other LWC/Aura/Flows/
flexipages, test classes, metadata and permissions, and the regression surface that
must not change. One row per component/class touched or affected — including
those *verified unaffected*, so the reader sees the full surface that was checked,
not just what changed.

| Component/Class Name | Impact Analysis | Impact Summary | Prevention |
| --- | --- | --- | --- |

- **Impact Analysis** — a single word: **Low**, **Medium**, or **High**. Judge it
  by blast radius: how many consumers, whether it's a public `@AuraEnabled`
  signature, whether it touches shared/production data paths.
- **Impact Summary** — one plain-English sentence naming the concrete risk, e.g.
  "If this class is modified, `AccountOppChartControllerTest` may break because it
  asserts on the exact return shape." Not a restatement of the change — the
  *consequence* of it.
- **Prevention** — the concrete guard: a regression test to add/run, a null-check,
  a backward-compatible optional parameter, a manual verification step. "None
  needed" is a valid entry only for a row marked **Low** with a stated reason.

### 7. Unit Test Plan

List the tests before writing them. Standards: `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/salesforce-apex-tests.md`.

| # | Class / bundle | Test | Scenario in plain English | Requirement | Key assertion |
| --- | --- | --- | --- | --- | --- |

Cover Apex and LWC Jest. Then state explicitly how each of these is covered — or
consciously is not, with the reason:

- Null / absent context (no `recordId`), and empty result sets (return empty, never `null`).
- Aggregate `null` (`SUM()` over zero rows) and the `null` `GROUP BY` key label.
- The regression test proving the null-parameter path is unchanged — the one people forget.
- Bulk (`quality.bulkTestSize` records, never fewer than 200).

Finish with test data: what `@testSetup` creates. `SeeAllData=true` is not used;
name a class that needs it only if the project constitution (`specs/constitution.md`)
records an exception that covers it, and cite that exception.

### 8. Acceptance Criteria — verified by you, not by hand

```text
□  Apex tests pass with coverage on changed classes at or above `quality.coverageTarget`
   (write the configured number here) — positive, negative, null paths.
□  Every test in §7 exists and passes; real run output pasted.
□  Existing org-wide behaviour unchanged when the optional parameter is null.
□  No SOQL in loops; aggregates safe at 10,000+ records.
□  ESLint and Prettier pass on changed files.
□  Salesforce Code Analyzer: no violation at or above `quality.analyzerSeverityThreshold`
   on changed files (`sf-sdlc analyze --changed`).
□  Deployment to the target org succeeds (validation first; never production from a plan).
```

### 9. Delivery Plan

Branch named from `git.branchPattern`, commit message shape from `git.commitPattern`,
PR against `git.pullRequestBase` and its description, reviewer call-outs, and the
Jira comment to be posted on completion. Write the resolved branch name and PR base
in the plan, not the pattern.

### 10. Referenced Skills

Installed skills (and rules) actually used to write this plan.

| Skill | Used For |
| --- | --- |
| `sdlc-spec-driven-development` | this plan format |
| `sdlc-architecture-diagram` | §5 diagram |
| `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/salesforce-apex-tests.md` (rule) | §7 test plan |

### 11. Close the Loop on the Ticket

After the build is finished (`/sf-sdlc:implement`, then `/sf-sdlc:verify`), post a Jira
comment: what was delivered, acceptance criteria met, **actual observed** test
results/coverage, branch/PR link. Jira confirmation rule: show the user the exact
text and the ticket ID, and post only after an explicit yes given to that preview;
a yes given earlier does not count. Never invent a ticket ID. With no Jira tool
connected, or `jira.enabled` false, put the comment text in the plan for the user
to paste.

### 12. Development Required Skills

Skim the installed skills in `.claude/skills/` (or run
`sf-sdlc skills list --json`) and list what the build will need,
matched by each skill's TRIGGER text (not name alone), so it's not rediscovered
mid-build. List only installed skills by their real names. For a need with no
installed skill, add a row that says so and tell the user to run `/sf-sdlc:skills`.

| Installed skill | Covers |
| --- | --- |
| {installed Apex skill} | new/changed Apex class |
| {installed Apex test skill} | its test class |
| {installed LWC skill} | LWC bundle |
| `sdlc-test-execution` | running tests + validating coverage |
| `sdlc-deploy-release` | deploy step |
| — none installed for {need} | run `/sf-sdlc:skills` |

## Rules for the plan itself

- **No code** — signatures, parameter tables, and diagrams only.
- **Cite real files and lines** you actually read; never guess.
- **State uncertainty** as an open question rather than asserting "unaffected".
- **Check the constitution** (`specs/constitution.md`): a plan that breaks an article
  says so in §6 with the reason and the prevention, or changes the approach.
- **No hard-coded project values** — coverage, branch names, PR base, org aliases and
  Jira keys come from the project config.
- Keep it scannable.

## Approval record

| Status | Approver | Role | Date | Comment |
| --- | --- | --- | --- | --- |
| Draft for review | — | — | — | — |

Filled in by a person only. Do not implement until Status is Approved.
