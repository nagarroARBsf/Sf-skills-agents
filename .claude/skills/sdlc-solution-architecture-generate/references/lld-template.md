# LLD-US-{nn-mm}: {Story title}

| Item | Details |
|---|---|
| Story | US-{nn-mm} ({Jira key}) — Source BR-{nn} / FR-{nn.m} |
| HLD | HLD §{n} |
| ADRs | {ADR-nnn} |
| Baseline | `baseline/inventory.md` @ `{commit}`; statuses from `components.json` |
| Status | Draft for tech-lead review |

## 1. Summary
Two to four sentences: what changes and the chosen approach. Alternatives considered and why
rejected (one line each).

## 2. Acceptance criteria → design
| AC | Satisfied by | Verified by |
|---|---|---|
| AC-1 | `OpportunityHealthService.calculate()` base score | Apex test `calculate_noRisks_returns100` |
| AC-6 | `OpportunityHealthBatch` (scope 200) | Apex test `batch_10kRecords` + QA TC-…-012 |

## 3. Metadata inventory
| # | Type | API name | Change | What changes / verification |
|---|---|---|---|---|
| 1 | CustomField | `Opportunity.Deal_Health_Score__c` | New | Number(3,0) |
| 2 | CustomObject | `Opportunity` | Changed | gains field #1; nothing else |
| 3 | ApexClass | `OpportunityHealthService` | New | |
| 4 | ApexClass | `OpportunityHealthServiceTest` | New | |
| 5 | ApexClass | `OpportunityTriggerHandler` | Changed | `afterUpdate` calls the new service; existing handler logic untouched |
| 6 | ApexTrigger | `OpportunityTrigger` | Unchanged | in baseline; already delegates all events to the handler |
| 7 | PermissionSet | `Sales_Manager_Access` | Changed | adds FLS read on field #1 |
| 8 | CustomField | `Opportunity.Legacy_Score__c` | Removed | replaced by #1; values not migrated (see §11) |

Change values: **New** (absent from the baseline), **Changed** (present, modified by this story),
**Unchanged** (present, verified, listed because the design depends on it or it is a regression
risk), **Removed** (present, deleted by this story). The values are copied from
`components.json`; update the model first. Never write Unchanged for a component that
was not found in the baseline inventory or the org.

Deployment order follows the table order. New and Changed rows form `package.xml`; Removed rows
form the destructive manifest.

### 3.1 Component diagram
Solution architecture diagram for this story, generated from the rows above:
`node .claude/bin/sf-sdlc diagram drawio docs/sdlc/03-architecture/components.json --story US-nn-mm`,
refined in its spec (pills, connector kinds), checked and exported.

![Solution architecture US-nn-mm](../diagrams/solution-architecture-US-nn-mm.png)

*Caption: {question answered}.* Source:
[../diagrams/solution-architecture-US-nn-mm.drawio](../diagrams/solution-architecture-US-nn-mm.drawio).

Text version with the change-status overlay (template 3 in
`.claude/skills/sdlc-architecture-diagram/references/diagram-templates.md`).

## 4. Data model changes
| Object | Field label | API name | Change | Type | Length/precision | Default | Required | Help text | FLS (read/edit) |
|---|---|---|---|---|---|---|---|---|---|

For a Changed field state the old and new definition (type changes and length reductions can
lose data; a changed picklist value affects existing records, reports and automation).

Picklist values, record types, validation rules (with formula and exact error message and location).

## 5. Logic design
Business logic as pseudo-code or a flowchart. Name entry points.

```mermaid
flowchart TD
    S["Start: list of Opportunity Ids"] --> Q["Query fields WITH USER_MODE (one SOQL)"]
    Q --> L{"For each opportunity"}
    L --> C1{"IsClosed?"}
    C1 -->|"yes"| N["Score = null"]
    C1 -->|"no"| B["Score = 100 minus deductions; floor 0"]
    B --> U["Collect for update"]
    N --> U
    U --> D["Single DML update; partial success; log failures"]
```

### 5.1 Declarative components
Flow name, type, trigger, entry conditions, elements, fault paths.

### 5.2 Apex design
```mermaid
classDiagram
    class OpportunityTriggerHandler {
        +afterUpdate(newMap, oldMap)
    }
    class OpportunityHealthService {
        +recalculate(Set~Id~ oppIds)
        +calculate(Opportunity opp) Integer
    }
    class OpportunityHealthBatch {
        +start(ctx) QueryLocator
        +execute(ctx, scope)
        +finish(ctx)
    }
    OpportunityTriggerHandler --> OpportunityHealthService
    OpportunityHealthBatch --> OpportunityHealthService
```
Method signatures, sharing keyword, inputs/outputs, exceptions thrown.

### 5.3 LWC design
Component tree, `@api` properties, wire adapters / Apex methods (cacheable?), events, states
(loading, empty, error), SLDS blueprint, accessibility notes, Lightning page placement and
targets in `js-meta.xml`.

## 6. Interaction
```mermaid
sequenceDiagram
    actor U as Sales Rep
    participant P as Opportunity page
    participant T as OpportunityTrigger
    participant H as [CHG] OpportunityTriggerHandler
    participant S as [NEW] OpportunityHealthService
    Note over U,S: Key - [NEW] new, [CHG] changed, no prefix unchanged
    U->>P: Edit discount to 25%
    P->>T: after update
    T->>H: afterUpdate(newMap, oldMap)
    H->>S: [NEW] recalculate(changed Ids)
    S-->>H: scores updated
    P-->>U: refreshed score 90
```

## 7. Security
Sharing keyword and reason; CRUD/FLS enforcement (`WITH USER_MODE`, `stripInaccessible`);
permission sets/custom permissions touched; data exposed in the UI by persona.

## 8. Governor limits and performance
| Path | SOQL | DML | Rows | CPU risk | Notes |
|---|---|---|---|---|---|
| Trigger (200 records) | 1 | 1 | 200 | Low | no SOQL in loop |
| Batch execute (scope 200) | 1 | 1 | 200 | Low | |

Large data volume considerations, selective queries, async limits.

## 9. Error handling and logging
What can fail, what the user sees, what is logged where, retry behaviour.

## 10. Test design (developer level)
| Test class / file | Method / test | Covers |
|---|---|---|
| `OpportunityHealthServiceTest` | `calculate_overdue_deducts20` | AC-2 |
| `OpportunityHealthServiceTest` | `recalculate_bulk200_noLimitErrors` | NFR-02 |
| `healthPanel.test.js` | renders amber band for 60 | AC-… |

Test data approach (TestDataFactory), personas (`System.runAs`), mocks.

## 11. Deployment notes
- Pre-deployment manual steps (feature enablement, data export before a removal).
- Post-deployment manual steps (data backfill, scheduling the batch, permission set assignment,
  flow activation).
- Destructive changes: one line per `Removed` row in §3 — pre- or post-deployment manifest, what
  replaces it, what data is lost, who confirmed.
- Rollback approach, and what cannot be rolled back (data changes, deleted fields).
- Regression surface: the `Changed` and `Unchanged` rows in §3 that must behave as before, and
  the tests that prove it.

The deployment itself follows the `sdlc-deploy-release` skill.

## 12. Open issues
Questions, assumptions made in the design, and deviations from the story (to be raised to the PO).

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
