# Tasks: {Feature name}

Plan: `specs/{id}-{slug}/plan.md` (approved {date} by {name}) · Legend: `[P]` can run in parallel
with the previous task · `(AC-n)` acceptance criterion served · `(§4 #n)` row of the plan's
Metadata Scope · `(§7 #n)` row of the plan's Unit Test Plan.

Paths below are examples; use the project's package directories (`salesforce.packageDirectories`)
and its real component names. Org names are roles from the project config.

## Phase A — Data model and configuration
- [ ] T001 Create `Opportunity.Deal_Health_Score__c` (`force-app/main/default/objects/Opportunity/fields/Deal_Health_Score__c.field-meta.xml`) (AC-1)
- [ ] T002 [P] Create `Health_Rule__mdt` type and records (`force-app/main/default/customMetadata/…`) (AC-2..AC-5)
- [ ] T003 Grant FLS in `Sales_Manager_Access` and `Sales_Rep_Access` (`force-app/main/default/permissionsets/…`) (AC-1)
- [ ] T004 Validate T001-T003 against the developer org: `sf-sdlc deploy validate --org dev`

## Phase B — Logic (tests first)
- [ ] T005 Write `OpportunityHealthServiceTest` with failing tests for AC-1..AC-5, null and empty inputs, bulk (`quality.bulkTestSize`), runAs rep (`classes/OpportunityHealthServiceTest.cls`) (§7 #1-#9)
- [ ] T006 Implement `OpportunityHealthService` until T005 passes (`classes/OpportunityHealthService.cls`)
- [ ] T007 Wire into `OpportunityTriggerHandler.afterUpdate` (`classes/OpportunityTriggerHandler.cls`) (AC-2)
- [ ] T008 [P] `OpportunityHealthBatch` + schedulable + test (AC-6)

## Phase C — UI (if in scope)
- [ ] T009 Jest tests for `healthPanel` states
- [ ] T010 Implement `healthPanel` LWC; add to Opportunity record page

## Phase D — Regression and verification
- [ ] T011 Regression: run the existing tests named in the plan's §6 Impact Analysis (Medium and High rows); record results
- [ ] T012 Run all related Apex tests with coverage: `sf-sdlc test run --org dev --tests OpportunityHealthServiceTest,OpportunityTriggerHandlerTest`; record pass/fail and coverage per changed class against `quality.coverageTarget`
- [ ] T013 Run Jest for changed bundles: `npm run test:unit -- healthPanel`
- [ ] T014 Run `sf-sdlc analyze --changed`; fix violations at or above `quality.analyzerSeverityThreshold`
- [ ] T015 Write `verification.md` (plan §8 checklist and AC → evidence, real output pasted)
- [ ] T016 Hand off to `/sf-sdlc:review`; address findings; record the verdict

## Notes log
| Task | Note |
|---|---|
| T001 | done — field file created; validation against dev org succeeded (job id recorded) |
