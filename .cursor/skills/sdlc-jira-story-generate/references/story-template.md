# Story template

Use exactly this layout for every story in `backlog.md`. Fields in the table map to Jira CSV
columns.

```markdown
### US-04-02: Calculate and store the opportunity health score

| Field | Value |
|---|---|
| Issue type | Story |
| Epic | EPIC-04 Opportunity Intelligence |
| Story type | Automation (Apex) |
| Priority | High (Must) |
| Story points | 5 (estimate) |
| Labels | sf-apex, sf-scheduled, opportunity |
| Persona | Sales Manager |
| Source | BR-04 / FR-04.2, RULE-04.1–04.5 |
| Blocked by | US-03-02 |
| Readiness | Not Ready — Q-06 (stagnation threshold) |
| Jira key | — |

**User story**
As a Sales Manager, I want each open opportunity to carry a health score calculated from agreed
risk rules, so that I can find at-risk deals in reviews and reports without checking each record.

**Context and business rules**
- Score starts at 100; deductions per RULE-04.1–04.5; minimum 0.
- Bands per RULE-04.6.

**Acceptance criteria**
- AC-1 Healthy baseline
  Given an open opportunity with a future close date, amount 50,000, discount 0%, decision maker identified
  When the score is calculated
  Then the health score is 100
- AC-2 Overdue close date
  Given an open opportunity whose close date was yesterday and no other risk factor
  When the score is calculated
  Then the health score is 80
- AC-3 Discount boundary
  Given discount is exactly 20%
  Then no discount deduction applies
  And given discount is 20.01%, a deduction of 10 applies
- AC-4 Stacked deductions and floor
  Given all five risk factors apply
  Then the health score is 20
- AC-5 Closed opportunities
  Given an opportunity is Closed Won or Closed Lost
  Then no score is calculated and the stored score is cleared  ← confirm with PO (Q-08)
- AC-6 Bulk
  Given 10,000 open opportunities
  When the nightly recalculation runs
  Then all scores are updated without errors and the job completes in under 30 minutes

**Feasibility notes**
- F2: the overdue deduction depends on today's date; a score stored on save goes stale. Proposed:
  recalculate on relevant field change and nightly via scheduled job. Architect to confirm (ADR).

**Salesforce implementation notes (indicative — architect decides)**
- Opportunity fields from US-03-02; candidate approach: before-save flow for on-edit + Batch Apex
  nightly, or Apex service called from both.

**Non-functional**
- Runs within governor limits for 200-record trigger batches (NFR-02).

**Out of scope**
- Displaying the score (US-04-01), explanations (US-04-04).
```

## Readiness and done

**Definition of Ready** (the story can enter a sprint):
- Source requirement approved; no open question that changes the ACs.
- ACs are concrete and testable.
- Dependencies identified; blocking stories planned earlier.
- Estimated by the team.

**Definition of Done** (reference once in backlog.md; do not repeat per story):
- Metadata in source control; deployed to the integration sandbox through the pipeline.
- Apex: tests with meaningful assertions, positive/negative/bulk/permission cases, org-wide
  coverage ≥ 75% (project target 85%+); LWC: Jest tests for logic.
- Code Analyzer / PMD: no new high-severity violations.
- CRUD/FLS and sharing enforced; permission set updated.
- Test cases linked and passed in QA; AC evidence attached.
- Documentation (LLD, release notes, manual post-deploy steps) updated.
