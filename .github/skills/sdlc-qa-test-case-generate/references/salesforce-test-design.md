# Salesforce test design

## Techniques

**Equivalence partitioning + boundary value analysis** — for each input, list valid and invalid
partitions and test the edges.

| Input | Valid partitions | Invalid | Boundaries to test |
|---|---|---|---|
| Discount % (threshold 20) | 0–20, 20.01–100 | < 0, > 100, blank | 0, 19.99, 20, 20.01, 100, 100.01 |
| Text(80) name | 1–80 chars | 0, 81 | 1, 80, 81, unicode, emoji, `<script>` |
| Close date | past, today, future | blank | yesterday, today, tomorrow (in user's time zone) |

**Decision tables** — when rules combine. One column per condition, one row per meaningful
combination; collapse rows that cannot differ in outcome.

**State transition** — list states and allowed transitions; test each allowed transition and at least
the risky disallowed ones (skip a stage, reopen a closed record, change after approval lock).

**Pairwise** — persona × record type × channel combinations too many to test fully: cover every
pair at least once.

**Error guessing** — use the catalogue below.

## Salesforce failure catalogue (error guessing)

| Area | Test idea |
|---|---|
| Permissions | User with object read but no FLS on the new field: page, LWC, report, list view, API |
| Permissions | Persona without the custom permission: hidden section really hidden (not only greyed) |
| Sharing | Rep A cannot see Rep B's record (OWD Private); manager above both can |
| Sharing | Record owner change: access recalculated, components still load |
| Bulk | Data Loader / Bulk API update of 200, 201 and 10,000 records: no limit errors, all records processed |
| Bulk | Mixed batch: some records valid, some invalid → partial success behaves as designed |
| Automation order | Flow and trigger on same object: final field values match the design |
| Recursion | Update that triggers itself does not loop or double-count |
| Async | Batch/queueable finishes; failures logged; re-run is idempotent |
| Locking | Two users / a batch and a user editing the same parent: `UNABLE_TO_LOCK_ROW` handled |
| Nulls | Lookup empty, optional fields blank, deleted parent record |
| Picklists | Inactive value on old records; dependent picklist combinations; translations |
| Dates/time | User time zone vs org time zone around midnight; DST changes; fiscal year boundaries |
| Currency | Multi-currency org: amounts in non-corporate currency, conversion in reports |
| Validation | Exact error text and location; admins/integration user bypass if designed |
| Integration | Timeout, 401 (expired auth), 500, malformed response, duplicate message, endpoint down |
| UI (LWC) | Loading spinner, empty state, Apex error toast; data refresh after save |
| UI | Salesforce mobile app rendering; small viewport; keyboard-only navigation; screen-reader labels; colour not sole signal |
| Reports | Report totals equal the records a persona can see; dashboard running-user behaviour |
| Data migration | Record counts reconcile; owners/RecordTypes mapped; automation bypass flag reset after load |
| Deployment | Post-deploy steps done (permission set assigned, batch scheduled); feature works for a fresh user |

## Persona × permission matrix

Build one per story that exposes or changes data:

| Persona | Object access | Field access | Feature (custom permission) | Expected |
|---|---|---|---|---|
| Sales Rep | Read/Edit own | Score: read | — | Sees score and badges; no explanations |
| Sales Manager | Read team | Score: read | `View_Deal_Insights` | Sees score, badges, explanations |
| Read-only user | Read | none on Score | — | Panel shows "no access" state, no error |
| Integration user | Edit all | Edit | — | Bulk update recalculates score |

## Bulk test recipe (Apex)
- Create 200 (trigger chunk) and 201 (crosses a chunk) records in `@TestSetup` through a
  TestDataFactory.
- Run the operation between `Test.startTest()` and `Test.stopTest()`.
- Assert every record's outcome, plus `Limits.getQueries()` / `Limits.getDmlStatements()` inside
  the transaction to catch SOQL/DML in loops.

## Test levels on Salesforce

| Level | Tool | Owner |
|---|---|---|
| Unit | Apex tests, Jest for LWC | Developer |
| Static analysis | Salesforce Code Analyzer (PMD, ESLint, Flow scanner) | Developer / CI |
| System / integration (SIT) | Manual cases from this skill; UTAM/Provar/Playwright for UI | QA |
| UAT | Business-friendly subset (P1 positive + key personas) | Business users |
| Regression | Automated smoke + REG cases | QA / CI |
| Performance | Page load, batch duration, API throughput (for NFRs with numbers) | QA / architect |
