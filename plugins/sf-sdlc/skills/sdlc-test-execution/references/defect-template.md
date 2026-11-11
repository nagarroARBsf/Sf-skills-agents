# DEF-{nnn}: {One-line summary of the wrong behaviour}

Save as `docs/sdlc/04-qa/defects/DEF-{nnn}.md`. One defect per root cause. Write it so that a
developer who was not in the test session can reproduce it.

| Item | Details |
|---|---|
| Status | Open |
| Severity | Blocker / Major / Minor / Trivial |
| Priority | {set by the PO or QA lead, or —} |
| Story | US-{nn-mm} ({Jira key}) — AC-{n} |
| Test cases | TC-US-{nn-mm}-{nnn}, … |
| Found in | TR-{YYYYMMDD}-{nn} — org role `{qa}` (`{alias}`) — build {DEP-nnn}, commit `{sha}`; or `production` — `06-observe/findings-{YYYYMMDD}.md` |
| Found by | {agent name / tester name} on {YYYY-MM-DD} |
| Category | Product defect |
| Suspected component | `{ApiName}` ({type}) — `{path}:{line}` if identified |
| Jira key | — (filled only after creation; never invented) |

Status flow: `Open` → `In progress` → `Fixed` (developer, with commit) → `Ready for re-test`
(fix deployed to the test org, with DEP-nnn) → `Closed` (passing re-test cited) or `Reopened`.
Also: `Rejected` (not a defect; reason and who decided) and `Deferred` (accepted for a later
release; who accepted). `Rejected` and `Deferred` are decisions by a person.

## 1. Steps to reproduce
Preconditions: user/persona and permission sets, data, org state.

1. {Exact action with exact values}
2. {…}
3. {…}

For an automated failure, also give the command:
`sf-sdlc test run --org {role} --tests {Class.method} --json`

## 2. Expected result
{What should happen}, per {AC-n of US-nn-mm / RULE-nn.m / LLD-US-nn-mm §n}. Quote the criterion.

## 3. Actual result
{What happened, with exact values and exact error text.}

## 4. Evidence
| Type | Reference |
|---|---|
| Test result | `{Class.method}` — `{assertion or error message}` — run ID `{id}` in TR-… |
| Stack trace (first project frame) | `{Class.cls}: line {n}` |
| Screenshot / recording | `{file name}` |
| Record | {record name; no customer personal data, no session URLs} |

Synthetic test data only. Do not paste credentials, access tokens or personal data.

## 5. Impact
Who is affected, how often, workaround if any, and why this severity.

## 6. Analysis (optional, by QA)
What the failing test and the code suggest. Marked as a hypothesis; the developer confirms the
root cause.

## 7. Fix (filled by the developer)
| Item | Details |
|---|---|
| Root cause | |
| Fix | commit `{sha}`, branch `{branch}`, PR {link} |
| Components changed | `{ApiName}` (New / Changed / Removed) |
| Tests added or changed | `{Class.method}` |
| Review | `specs/{story}/review.md` round {n}: {verdict} |
| Deployed to test org | DEP-{nnn} on {date} |
| Constraint added | **Required.** One of: test · Code Analyzer rule · hook or quality gate · spec or checklist update · ontology or feature-map entry · none — {reason}. Plus the reference: `{Class.method}` / rule name in `code-analyzer.yml` / hook / file and section |

**Constraint added** answers "why did this get through, and what now catches it?" Pick the strongest
check that fits (a test or Code Analyzer rule before an instruction). `none` needs a stated reason
(for example "one-off data problem, no code path"). A defect cannot be closed with this row empty.

## 8. Re-test history
| Date | Test run | Cases re-run | Regression set | Result | New status |
|---|---|---|---|---|---|
| {date} | TR-{…} | TC-US-04-02-004: Passed | 12 run, 12 passed | Fix verified | Closed |

A defect is `Closed` only when this table has a row with a passing run for every failed case and
no failing regression case, **and** section 7's "Constraint added" is filled (a constraint with its
reference, or `none` with a reason). No row or no constraint, no closure.

## 9. Closure
| Status | Closed by | Role | Date | Passing run cited |
|---|---|---|---|---|
| — | — | — | — | — |

Filled in by a person (QA lead) after the re-test row above exists.
