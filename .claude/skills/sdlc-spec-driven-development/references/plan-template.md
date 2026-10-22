# Implementation plan: {Feature name}

| Item | Details |
|---|---|
| Spec | `specs/{id}-{slug}/spec.md` |
| LLD | `docs/sdlc/03-architecture/LLD/{story}.md` or "none" |
| Date / status | {YYYY-MM-DD} / Draft |

## 1. Summary
Approach in three to five sentences.

## 2. Technical context
| Item | Value |
|---|---|
| API version | |
| Package directory | `force-app/main/default` |
| Existing components touched | `OpportunityTrigger`, `OpportunityTriggerHandler` |
| Frameworks / utilities reused | trigger handler base, logger, TestDataFactory |
| Target org for validation | {alias or "none — local only"} |

## 3. Constitution check
| Article | Result | Notes |
|---|---|---|
| I Spec first | Pass | |
| II Declarative first | Pass | Apex chosen: logic reused by batch and trigger (ADR-002) |
| III Security | Pass | `with sharing`, `WITH USER_MODE` |
| IV Bulk-safe | Pass | |
| V Tests first | Pass | |
| VI Simple | Pass | |
| VII Observable | Pass | errors logged via `Logger` |
| VIII Source control | Pass | post-deploy: schedule batch |

## 4. Metadata inventory
| # | Type | API name | Action | Skill to use |
|---|---|---|---|---|
| 1 | CustomField | `Opportunity.Deal_Health_Score__c` | New | `platform-custom-field-generate` |
| 2 | CustomMetadata | `Health_Rule__mdt` + records | New | `platform-custom-metadata-type-generate` |
| 3 | PermissionSet | `Sales_Manager_Access` | Modify | `platform-permission-set-generate` |
| 4 | ApexClass | `OpportunityHealthServiceTest` | New | `platform-apex-test-generate` |
| 5 | ApexClass | `OpportunityHealthService` | New | `platform-apex-generate` |

## 5. Design
Per component: responsibility, public interface, key logic (pseudo-code or Mermaid), error
handling. Reference LLD sections instead of repeating them.

## 6. Test plan
| AC | Test (class.method / Jest file / manual) |
|---|---|
| AC-1 | `OpportunityHealthServiceTest.calculate_noRisks_returns100` |

Commands:
```bash
sf project deploy start --source-dir force-app --target-org {alias} --dry-run
sf apex run test --class-names OpportunityHealthServiceTest --result-format human --code-coverage --target-org {alias}
npm run test:unit -- healthPanel
sf code-analyzer run --target force-app/main/default/classes/OpportunityHealth*
```

## 7. Deployment and post-deploy steps
Order, manual steps, data backfill, rollback.

## 8. Risks and complexity tracking
| Item | Why needed | Simpler alternative rejected because |
|---|---|---|

## 9. Changed during implementation
{Filled in phase 5 if the plan changes.}
