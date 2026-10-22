# Tasks: {Feature name}

Plan: `specs/{id}-{slug}/plan.md` · Legend: `[P]` can run in parallel with the previous task ·
`(AC-n)` acceptance criteria served.

## Phase A — Data model and configuration
- [ ] T001 Create `Opportunity.Deal_Health_Score__c` (`force-app/main/default/objects/Opportunity/fields/Deal_Health_Score__c.field-meta.xml`) (AC-1)
- [ ] T002 [P] Create `Health_Rule__mdt` type and records (`force-app/main/default/customMetadata/…`) (AC-2..AC-5)
- [ ] T003 Grant FLS in `Sales_Manager_Access` and `Sales_Rep_Access` (`force-app/main/default/permissionsets/…`) (AC-1)
- [ ] T004 Validate: `sf project deploy start --dry-run` on T001-T003

## Phase B — Logic (tests first)
- [ ] T005 Write `OpportunityHealthServiceTest` with failing tests for AC-1..AC-5, bulk 200, runAs rep (`classes/OpportunityHealthServiceTest.cls`)
- [ ] T006 Implement `OpportunityHealthService` until T005 passes (`classes/OpportunityHealthService.cls`)
- [ ] T007 Wire into `OpportunityTriggerHandler.afterUpdate` (`classes/OpportunityTriggerHandler.cls`) (AC-2)
- [ ] T008 [P] `OpportunityHealthBatch` + schedulable + test (AC-6)

## Phase C — UI (if in scope)
- [ ] T009 Jest tests for `healthPanel` states
- [ ] T010 Implement `healthPanel` LWC; add to Opportunity record page

## Phase D — Verification
- [ ] T011 Run all related Apex tests with coverage; record results
- [ ] T012 Run Code Analyzer on changed files; fix high/critical
- [ ] T013 Security review of the diff (sharing, CRUD/FLS, injection, secrets)
- [ ] T014 Write `verification.md` (AC → evidence)

## Notes log
| Task | Note |
|---|---|
| T001 | done — deployed dry-run OK |
