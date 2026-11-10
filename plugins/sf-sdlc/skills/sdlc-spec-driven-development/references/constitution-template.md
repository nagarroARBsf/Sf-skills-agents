# Engineering constitution — {Project}

Non-negotiable principles for every feature. Plans must pass each article, or state the breach
in the plan's §6 Impact Analysis with its reason and prevention and have it accepted at plan
approval. Standing exceptions are listed under "Recorded exceptions". Amend by pull request with
a version bump.

**Version** 1.0 · **Ratified** {YYYY-MM-DD} · **Owner** {tech lead}

## Project facts
Fill from the project config first (`sf-sdlc config show --json`), then from
detection (`sf-sdlc detect --json`), then by asking. The config stays the source
of truth: this table quotes it so that reviewers see the values; when the config changes, update
the table and bump the version. Do not write a number here that the config does not contain.

| Item | Value | Source |
|---|---|---|
| API version | {value} | `salesforce.apiVersion` ("auto" = `sourceApiVersion` in `sfdx-project.json`) |
| Package directories | {value} | `salesforce.packageDirectories` ("auto" = `sfdx-project.json`) |
| Namespace prefix | {value or none} | `salesforce.namespacePrefix` |
| Component naming prefix | {value or none} | `salesforce.componentPrefix` |
| Trigger framework | {name / "one trigger per object + handler class"} | detected in source |
| Test data factory | {class / none} | detected in source |
| Logging | {utility class / none} | detected in source |
| Coverage target, new and changed classes | {value}% | `quality.coverageTarget` |
| Org-wide coverage minimum | {value}% | `quality.orgCoverageMinimum` |
| Bulk test size | {value} records | `quality.bulkTestSize` |
| Code Analyzer blocking severity | {value} | `quality.analyzerSeverityThreshold`, rules `quality.analyzerRuleSelector` |
| Branching | main `{value}`, integration `{value}`, pattern `{value}`, PR base `{value}` | `git.*` |
| Promotion path and test levels | {roles in order, test level each} | `deploy.pipeline`, `deploy.testLevel` |
| CI checks | {Code Analyzer, Apex tests, Jest} | detected (CI files) |

## Recorded exceptions
Deviations from an article that this project accepts, each with its reason, scope and owner. A
plan may rely on an exception only if it is listed here.

| # | Article | Exception | Scope (classes / objects) | Reason | Approved by, date |
|---|---|---|---|---|---|
| — | — | none | — | — | — |

## Article I — Spec before code
Non-trivial changes follow spec → plan → tasks → implement. Code without an approved spec is a
review blocker.

## Article II — Standard and declarative first
Use the approach ladder: standard feature → configuration → Flow → Apex/LWC. Choosing code over a
declarative option, or Flow over Apex for complex logic, is stated with a reason in the plan.

## Article III — Security by default
- Apex classes declare sharing (`with sharing` unless justified; `inherited sharing` for utilities).
- Queries use `WITH USER_MODE` or `Database.query(…, AccessLevel.USER_MODE)`; DML uses
  `as user` / `AccessLevel.USER_MODE`, or `Security.stripInaccessible` where partial access is valid.
- No dynamic SOQL with concatenated user input; use bind variables.
- Access is granted by permission sets/groups and custom permissions, never by hard-coded profile
  or role names.
- No secrets, endpoints, record IDs or org-specific values in code. Named/External Credentials,
  Custom Metadata, Custom Labels.

## Article IV — Bulk-safe and limit-aware
- No SOQL or DML inside loops. All entry points accept collections.
- One trigger per object delegating to a handler; recursion controlled.
- Work that can exceed synchronous limits is asynchronous (Queueable, Batch, Platform Events).

## Article V — Tests first, meaningful tests
- Tests are written before or with the implementation, from the acceptance criteria.
- Every Apex test asserts outcomes with messages; no assert-free coverage tests.
- Cover positive, negative, bulk (the bulk test size in project facts, never fewer than 200
  records) and permission (`System.runAs`) cases.
- Test data via a factory; no `SeeAllData=true` unless a recorded exception covers the class; no
  hard-coded IDs.
- LWC logic covered by Jest.
- Coverage of new and changed classes meets the target in project facts; org-wide coverage never
  falls below the org-wide minimum in project facts (the platform itself refuses production
  deployments below 75%).

## Article VI — Simple and consistent
- Follow existing project patterns before introducing new ones.
- Business thresholds and mappings live in Custom Metadata.
- LWC uses Lightning Base Components and SLDS styling hooks; accessible by default.
- Names describe intent; no abbreviations that only the author understands.

## Article VII — Observable and recoverable
- Automations have fault paths; errors are logged with context and surfaced to users in plain
  language.
- Integrations are idempotent and retry-safe; failed records have an owner.

## Article VIII — Everything through source control
All metadata changes live in the repository and are deployed through the pipeline in project
facts, validated before every deployment. Manual org changes are recorded as pre- or
post-deployment steps in the plan and the deployment record. Production is deployed only by a
person who names the org and confirms.

## Article IX — Independent review and evidence
Every change is reviewed by someone other than its author (`/sf-sdlc:review`) before it leaves the
developer's org. Claims of "tested", "covered" and "deployed" cite the run that proves them.

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
