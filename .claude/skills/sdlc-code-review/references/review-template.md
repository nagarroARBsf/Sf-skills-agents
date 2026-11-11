# Code review — {US-nn-mm}: {Story title}

Save as `specs/{id}-{slug}/review.md`. A re-review adds a new "Round" block at the top of
section 9 and updates the header; earlier rounds are kept.

| Item | Details |
|---|---|
| Story / feature | {US-nn-mm} ({Jira key}) — `specs/{id}-{slug}/` |
| Scope reviewed | {branch `…` against `{base}` at `{commit}` / paths …} |
| Inputs read | spec.md v{…}, plan.md ({approved / not approved}), tasks.md, verification.md, LLD-US-{nn-mm} |
| Reviewer | {agent name, or person} |
| Date / round | {YYYY-MM-DD} / Round {n} |
| Verdict | **{Approve / Approve with conditions / Changes required}** |

## 1. Summary
Three to five sentences for a mixed audience: what the change does, whether it meets the
acceptance criteria, the main risks found, and what must happen before it moves on.

| Severity | Count | Confirmed | Likely | Needs verification |
|---|---|---|---|---|
| Blocker | | | | |
| Major | | | | |
| Minor | | | | |
| Note | | | | |

## 2. Scope and change set
| Component | Type | Change (New / Changed / Removed) | In plan §4? | Read in full? |
|---|---|---|---|---|
| `OpportunityHealthService` | ApexClass | New | Yes | Yes |
| `OpportunityTriggerHandler` | ApexClass | Changed | Yes | Yes |
| `Sales_Rep_Access` | PermissionSet | Changed | **No — unplanned** | Yes |

Source: `node .claude/bin/sf-sdlc delta --from {base} --json`.

## 3. Acceptance criteria coverage
| AC | Implemented by (`file:line`) | Proven by (test or evidence) | Result |
|---|---|---|---|
| AC-1 | `OpportunityHealthService.cls:42` | `OpportunityHealthServiceTest.calculate_noRisks_returns100` | Met |
| AC-5 | — | — | **Not implemented** (R-01) |
| AC-6 | `OpportunityHealthBatch.cls:18` | no test found | **Unproven** (R-03) |

Result values: Met · Unproven (code exists, no test or evidence) · Not implemented · Deviates.

## 4. Tool results
| Tool | Command | Result | Disposition |
|---|---|---|---|
| Salesforce Code Analyzer | `node .claude/bin/sf-sdlc analyze --changed {base} --json` | {n} violations at or above severity {threshold}; {n} below | {n} reported as findings (R-…), {n} dismissed (reasons below) |
| Source checks | `node .claude/bin/sf-sdlc check --json` | | |
| Test results and coverage | cited from {verification.md / TR-… / CI run} | {pass/fail}; coverage per changed class | or **Unverified — no run result available** |

Dismissed tool results:

| Rule | `file:line` | Why dismissed |
|---|---|---|

## 5. Findings
Ordered by severity, then by file. Every row cites a line that was read.

| ID | Severity | Confidence | Pass | Location | Finding | Failure it causes | Fix direction |
|---|---|---|---|---|---|---|---|
| R-01 | Blocker | Confirmed | Correctness | `OpportunityHealthService.cls:57` | Closed opportunities are scored; AC-5 requires the score to be cleared. | Closed deals appear in the at-risk report. | Skip and clear when `IsClosed`; add the AC-5 test. |
| R-02 | Major | Confirmed | Security | `OpportunityHealthController.cls:12` | Class has no sharing keyword and the query at line 20 runs in system mode. | A representative can read scores of deals they cannot open. | Declare `with sharing`; query `WITH USER_MODE`. |
| R-03 | Major | Likely | Tests | `OpportunityHealthBatchTest.cls:1-40` | No bulk test; assumes the batch is scheduled nightly (not visible in source). | Limit errors at volume go unnoticed. | Add a test with the configured bulk size. |
| R-04 | Minor | Needs verification | Governor limits | `OpportunityHealthService.cls:31` | Filter on `StageName` only. Check: query plan for this filter in an org with production-like volume. | Possible non-selective query on a large object. | Add an indexed filter if the plan shows a table scan. |

Severity: Blocker · Major · Minor · Note. Confidence: Confirmed · Likely · Needs verification.
A Blocker is never "Needs verification".

### Constraints to add
For findings that repeat an earlier one (this change, a previous review, a `DEF-nnn`): the
deterministic check that would catch it next time. Omit the table when there are none.

| Finding | Seen before in | Constraint (test · Code Analyzer rule · hook or gate · instruction) | Where |
|---|---|---|---|
| R-02 | `DEF-007` | Code Analyzer rule: Apex classes without a sharing keyword | `code-analyzer.yml` |

## 6. Questions for the author
Concerns that could not be tied to a line or verified from the repository. They are not findings
and do not affect the verdict until answered.

| # | Question | Why it matters |
|---|---|---|
| 1 | Is there a record-triggered flow on Opportunity in the org that is not in source? | It could set the same field after the trigger. |

## 7. What was not reviewed
State every gap. An empty section must say "Nothing excluded".

| Not reviewed | Reason | Risk |
|---|---|---|
| Flow `Opp_AfterSave_Notifications` | Changed in the branch, flow XML too large to trace fully | Interplay with the new trigger logic unverified |
| Behaviour in an org | Reviewer is read-only and ran no tests | Coverage and limits rely on the cited run |

## 8. Verdict and conditions
**{Approve / Approve with conditions / Changes required}**

- Blockers to resolve: {R-01, …}
- Conditions (for "Approve with conditions"), each with an owner: {R-03 — add bulk test — author}
- Re-review needed: {yes — after R-01, R-02 / no}
- Next step: {`/sdd-implement` for fixes, then `/sdlc-review` again / `/sdlc-deploy` to the test org}

## 9. Review rounds
| Round | Date | Commit | Verdict | Resolved since last round | Still open |
|---|---|---|---|---|---|
| 1 | {date} | `{sha}` | Changes required | — | R-01..R-04 |
| 2 | {date} | `{sha}` | Approve with conditions | R-01 (`…cls:57-63`), R-02 (`…cls:12`) | R-03 |

A finding is marked resolved only after the reviewer re-read the changed lines; cite them.

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only: the tech lead or reviewer of record accepts or overrides the verdict.
