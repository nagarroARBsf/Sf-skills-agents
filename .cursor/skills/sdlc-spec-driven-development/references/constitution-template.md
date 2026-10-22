# Engineering constitution — {Project}

Non-negotiable principles for every feature. Plans must pass each article or record a justified
exception in "Complexity tracking". Amend by pull request with a version bump.

**Version** 1.0 · **Ratified** {YYYY-MM-DD} · **Owner** {tech lead}

## Project facts (detected)
| Item | Value |
|---|---|
| API version | {from sfdx-project.json} |
| Package directories | {force-app, …} |
| Trigger framework | {name / "one trigger per object + handler class"} |
| Logging | {utility class / Nebula Logger / none} |
| Naming prefix | {e.g. none / ORN_} |
| Test coverage target | {85}% for new and changed classes |
| CI checks | {Code Analyzer, Apex tests, Jest} |

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
- Cover positive, negative, bulk (≥ 200 records) and permission (`System.runAs`) cases.
- Test data via a factory; no `SeeAllData=true`; no hard-coded IDs.
- LWC logic covered by Jest.
- Coverage target per project facts; org-wide never below 75%.

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
All metadata changes live in the repository and are deployed through the pipeline. Manual org
changes are recorded as post-deploy steps in the plan.
