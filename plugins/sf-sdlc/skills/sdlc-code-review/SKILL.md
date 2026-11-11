---
name: sdlc-code-review
description: "Independent, read-only review of Salesforce changes (Apex, triggers, LWC, Aura, Visualforce, Flow, metadata) against the spec and acceptance criteria, security (sharing, CRUD/FLS and user mode, SOQL injection, secrets, hard-coded IDs, @AuraEnabled exposure, XSS, guest access), governor limits and bulk safety, automation interplay, test quality and coverage, metadata hygiene and maintainability. Uses the official Salesforce Code Analyzer and the change delta. Every finding cites a file and line that was read, with a severity and a confidence; unverifiable concerns become questions. Produces review.md with a verdict: Approve, Approve with conditions, or Changes required. TRIGGER when: user asks for a code, peer, PR, security or best-practice review, a governor-limit or coverage check of a change, or runs /sf-sdlc:review. DO NOT TRIGGER when: the user wants code fixed or written (use sdlc-spec-driven-development), or only a static-analysis run (/sf-sdlc:analyze)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-code-review

Review someone else's change as an independent engineer: verify claims instead of trusting them,
report what could not be verified, and never touch the code.

## Ground rules
- **Read-only.** The reviewer never edits source, tests, metadata, the spec or the plan, and
  never commits, deploys or changes an org. Fixes are the author's job. Do not work around a
  missing write tool through the shell.
- **Evidence.** Every finding cites `path/to/file:line` from a file opened in this review, and
  states the concrete failure it causes. No citation, no finding.
- **Honesty about limits.** What was not read or could not be checked is listed in the report.
  A review that silently skipped the flows is worse than one that says so.
- **Project values from config.** Coverage target, analyzer threshold, bulk size and base branch
  come from `sf-sdlc config show --json` (`quality.*`, `git.*`).

## 1. Scope

Establish exactly what is under review, and say it in the report.

| Request | Scope | How |
|---|---|---|
| "review my changes", a branch, a PR | Diff against the base branch | Base = `git.pullRequestBase` (fall back to `git.integrationBranch`). `sf-sdlc delta --from <base> --json` for components; `git diff <base>...HEAD --stat` and `git diff <base>...HEAD` for lines |
| A story (`US-nn-mm`) or feature folder | The components in `specs/<story>/plan.md` §4 Metadata Scope, checked against the delta | Read `spec.md`, `plan.md`, `tasks.md`, `verification.md` first |
| Paths | Those files, plus what they call and what calls them | State that the rest of the change was not reviewed |

Then read, in full:
1. Every changed file. A diff hunk is not enough: sharing declarations, class-level state and
   surrounding loops are outside the hunk.
2. Tests of every changed class or bundle.
3. Callers of anything whose signature or behaviour changed. Every `@AuraEnabled`, `@InvocableMethod`,
   `global`, `@RestResource` and `webservice` member is public API: search LWC and Aura imports,
   flows (`<actionName>`), FlexiPages, other classes and tests.
4. Other automation on the same objects (triggers, record-triggered flows, validation rules).

If the delta contains components the plan does not list, or the plan lists components that did
not change, report it: unplanned scope is a finding.

## 2. Tooling

Run before reading, and treat the output as leads to verify, not as findings:
- `sf-sdlc analyze --changed <base> --json` — official Salesforce Code Analyzer
  (`sf code-analyzer run`) on the changed files, judged against
  `quality.analyzerSeverityThreshold`.
- `sf-sdlc check --json` — fast offline source checks on the changed files.
- `sf-sdlc delta --from <base> --json` — new, changed and removed components.

For each tool result: open the cited line, then report it as a finding you agree with, or list
it as dismissed with the reason (false positive, test-only code, accepted by a recorded
constitution exception). If a tool could not run, say so; do not present the review as analysed.

Coverage and test results are **not** produced by reading code. Use an existing result
(`verification.md`, a `TR-…` report, CI output) and cite it. If there is none, coverage is
"unverified" and that is a finding against the hand-over, not a guess at a percentage.

## 3. Review passes

Work through the passes in order, using
[references/review-checklist.md](references/review-checklist.md) for the detailed checks.

| # | Pass | Core question |
|---|---|---|
| 1 | Correctness vs spec | Does each AC and each plan requirement have code that satisfies it and a test that proves it? Anything built that nobody asked for? |
| 2 | Security | Sharing keyword, CRUD/FLS and user mode (fields queried versus fields the permission set grants), SOQL/SOSL injection, secrets and hard-coded IDs, `@AuraEnabled` exposure, XSS in LWC/Aura/Visualforce, guest-user and Experience Cloud access |
| 3 | Governor limits and bulk safety | SOQL/DML/callouts in loops, selective queries, heap and CPU, async limits, recursion, mixed DML, row locking |
| 4 | Automation interplay | Order of execution; trigger plus flow plus validation rule on the same object and event; re-entry |
| 5 | Tests | Real assertions; negative, bulk and `System.runAs` cases; no `SeeAllData`; coverage of changed classes against `quality.coverageTarget` |
| 6 | Metadata | API version drift, permission sets not profiles, destructive changes, field history and encryption impacts, FLS for new fields |
| 7 | LWC | Wire vs imperative, error handling, accessibility, lifecycle and events |
| 8 | Maintainability | Fits existing patterns, naming, configuration over constants, dead code, logging |

Use the installed technical skill for an area (Apex, LWC, Flow, security) for depth if present;
if it is missing, review from the checklist and mention that `/sf-sdlc:skills` can install it.

## 4. Findings

Each finding has: ID (`R-01`…), severity, confidence, pass, `file:line`, what is wrong, the
failure it causes (a scenario, not a rule name), and the fix direction in one sentence (no
rewritten code).

**Severity**

| Severity | Meaning | Examples |
|---|---|---|
| Blocker | Must not ship: data exposure or loss, guaranteed failure at volume, broken AC, failing deployment | `without sharing` controller returning records to a community user; SOQL in a trigger loop; AC not implemented |
| Major | Likely to cause a defect or a security weakness in realistic use; fix before merge | Missing negative test for a validation; no FLS enforcement on an internal page; unbounded query on a growing object |
| Minor | Should be fixed, low risk if deferred | Hard-coded label text; missing fault path on a low-volume flow |
| Note | Observation or suggestion; no action required | Naming, a simpler alternative |

**Confidence**

| Confidence | Meaning | Required evidence |
|---|---|---|
| Confirmed | The reviewer read the code path end to end and the failure follows from it | `file:line` for the fault and for the path that reaches it |
| Likely | The fault is visible, but one link depends on configuration or data not in the repository | `file:line` plus the stated assumption |
| Needs verification | The code suggests a risk that only a run or an org check can settle | `file:line` plus the exact check to run |

Rules:
- A concern with no `file:line`, or that rests only on what "usually" goes wrong, is **not a
  finding**. List it under **Questions for the author**.
- Never raise severity to compensate for low confidence. A Blocker must be Confirmed or Likely.
- One finding per root cause; list the other occurrences in it.
- Do not report style that the project's formatter or linter already enforces.
- Praise is not a finding. Leave it out.

**Make repeated mistakes a constraint.** When a finding repeats one already seen in this change, in
an earlier `review.md` or in a `DEF-nnn`, add to its fix direction the strongest deterministic
check that would catch it next time, in this order: a test (for example a minimum-access
`System.runAs` test for a permission gap); a Code Analyzer custom rule written with the
`dx-code-analyzer-custom-rule-create` skill and added to `code-analyzer.yml`; a hook or quality
gate. A new instruction in a rule or skill is the weakest option; recommend it only when nothing
deterministic fits. List these under **Constraints to add** in the report.

## 5. Verdict

| Verdict | When |
|---|---|
| Approve | No Blocker or Major; ACs evidenced; analyzer clean at the threshold; coverage evidenced at or above the target |
| Approve with conditions | No Blocker; Majors or unverified items that have a named owner and can be closed without re-review. List each condition |
| Changes required | Any Blocker; an AC without implementation or test; coverage or analysis failing or unverified with no plan; scope that could not be reviewed |

The verdict is the reviewer's recommendation. A person accepts it in the approval record.

## 6. Report

Write the report in the format of [references/review-template.md](references/review-template.md)
to `specs/<story>/review.md` (root from `paths.specs`). If the reviewer has no write tool, return
the complete report as the final message so the caller can save it. A re-review appends a new
dated round to the same file and states which earlier findings are resolved, citing the lines.

Finish with: the verdict, counts by severity, the conditions or blockers in one line each, what
was not reviewed, and the next step (`/sf-sdlc:implement` for fixes, or `/sf-sdlc:deploy` to the test
org when approved).
