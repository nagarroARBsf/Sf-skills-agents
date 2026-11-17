# Diagram templates with the change-status overlay

One worked example per Salesforce diagram type. Copy, then replace every node from
`components.json`; the names below are illustrative. Each template has: a title (front matter),
`accTitle` / `accDescr`, one flow direction, one status class per node, label prefixes, the Key
subgraph, and the `classDef` / `linkStyle` lines at the end.

If a renderer rejects the front-matter block (the three lines `---`, `title:`, `---`), delete
those lines and keep the Markdown heading and caption.

Edge numbering for `linkStyle` starts at 0 and follows the order in which edges are written.
Each template lists its edge numbers in a comment so they can be recounted after an edit.

## The shared tail (identical in every flowchart)

```text
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
```

Line styles for edges (append after the `classDef` lines, one line per status used):

```text
    linkStyle 1,2 stroke:#15803d,stroke-width:2px
    linkStyle 3 stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3
    linkStyle 5 stroke:#b91c1c,stroke-width:2px,stroke-dasharray:2 2
```

---

## 1. Capability map

Question: which business capabilities does this release add, improve or retire? Nodes are
capabilities in business language; no API names. No edges.

```mermaid
---
title: Capability map - sales and service, release 1.2
---
flowchart TB
    accTitle: Capability map for release 1.2
    accDescr: Business capabilities grouped by domain, marked as new, changed, unchanged or removed in this release
    subgraph SALES["Sales management"]
        direction LR
        CAP1["Pipeline management"]:::unchanged
        CAP2["[CHG] Deal review"]:::changed
        CAP3["[NEW] Deal health insight"]:::new
        CAP4["Forecasting"]:::unchanged
    end
    subgraph PARTNER["Partner management"]
        direction LR
        CAP5["[NEW] Partner deal registration"]:::new
        CAP6["[NEW] Partner onboarding"]:::new
    end
    subgraph SERVICE["Customer service"]
        direction LR
        CAP7["Case management"]:::unchanged
        CAP8["[DEL] Fax case intake"]:::removed
    end
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
```

*Caption: release 1.2 adds deal health insight and partner management, improves deal review and
retires fax case intake.*

---

## 2. System landscape

Question: which systems take part and which data flows are added, changed or retired?

```mermaid
---
title: System landscape - order to cash
---
flowchart LR
    accTitle: System landscape for order to cash
    accDescr: Users, the Salesforce org and external systems, with new, changed and removed systems and data flows marked
    subgraph USERS["Users"]
        REP["Sales representative"]:::unchanged
        PUSER["[NEW] Partner user"]:::new
    end
    subgraph SF["Salesforce org"]
        SALES["[CHG] Sales Cloud"]:::changed
        SITE["[NEW] Experience Cloud partner site"]:::new
    end
    subgraph EXT["External systems"]
        MW["[CHG] Middleware"]:::changed
        ERP["ERP"]:::unchanged
        FAX["[DEL] Fax gateway"]:::removed
    end
    %% edges: 0 REP-SALES, 1 PUSER-SITE, 2 SITE-SALES, 3 SALES-MW, 4 MW-ERP, 5 FAX-SALES
    REP -->|"uses"| SALES
    PUSER -->|"[NEW] registers deals"| SITE
    SITE -->|"[NEW] shares deal records"| SALES
    SALES <-->|"[CHG] orders, REST API replaces nightly file"| MW
    MW <-->|"orders"| ERP
    FAX -.->|"[DEL] inbound orders"| SALES
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
    linkStyle 1,2 stroke:#15803d,stroke-width:2px
    linkStyle 3 stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3
    linkStyle 5 stroke:#b91c1c,stroke-width:2px,stroke-dasharray:2 2
```

*Caption: partners reach Sales Cloud through a new site; the ERP interface moves from a nightly
file to a REST API; the fax gateway is retired. Lines use the same colours and prefixes as the
cards.*

---

## 3. Solution architecture

Question: which metadata components deliver US-04-02 and what do they depend on? One subgraph
per layer; nodes carry the API name and, on a second line, the metadata type.

```mermaid
---
title: Solution architecture - deal health score (US-04-02)
---
flowchart TB
    accTitle: Solution architecture for the deal health score
    accDescr: Components by layer from the record page down to the data, with new and changed components marked
    subgraph UI["Experience"]
        PAGE["[CHG] Opportunity_Record_Page<br/>FlexiPage"]:::changed
        PANEL["[NEW] healthPanel<br/>LightningComponentBundle"]:::new
    end
    subgraph LOGIC["Automation"]
        CTRL["[NEW] OpportunityHealthController<br/>ApexClass"]:::new
        TRG["OpportunityTrigger<br/>ApexTrigger"]:::unchanged
        HND["[CHG] OpportunityTriggerHandler<br/>ApexClass"]:::changed
        SVC["[NEW] OpportunityHealthService<br/>ApexClass"]:::new
        BATCH["[NEW] OpportunityHealthBatch<br/>ApexClass"]:::new
    end
    subgraph DATA["Data and configuration"]
        OPP[("[CHG] Opportunity<br/>+ Deal_Health_Score__c")]:::changed
        RULE[("[NEW] Health_Rule__mdt<br/>CustomObject, metadata type")]:::new
    end
    subgraph SEC["Security"]
        PS["[CHG] Sales_Manager_Access<br/>PermissionSet"]:::changed
    end
    %% edges: 0 PAGE-PANEL, 1 PANEL-CTRL, 2 CTRL-SVC, 3 TRG-HND, 4 HND-SVC, 5 BATCH-SVC, 6 SVC-OPP, 7 SVC-RULE, 8 PS-OPP
    PAGE -->|"[NEW] hosts"| PANEL
    PANEL -->|"[NEW] reads score"| CTRL
    CTRL -->|"[NEW] calls"| SVC
    TRG -->|"delegates"| HND
    HND -->|"[NEW] calls"| SVC
    BATCH -->|"[NEW] calls nightly"| SVC
    SVC -->|"[NEW] reads and updates"| OPP
    SVC -->|"[NEW] reads rules"| RULE
    PS -.->|"[CHG] grants field access"| OPP
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
    linkStyle 0,1,2,4,5,6,7 stroke:#15803d,stroke-width:2px
    linkStyle 8 stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3
```

*Caption: the score is calculated by one new service, called from the existing trigger handler,
a new nightly batch and a new panel on the existing Opportunity page. `OpportunityTrigger` was
checked in the inventory and does not change.*

For a mixed audience (the plan's section 5), reduce this to entry points, component, class with
its test class, and objects: about 10 nodes, no metadata type line.

---

## 4. Roadmap

Question: in which release does each change land? One subgraph per release, in time order.
Status is relative to the state before the first release shown. For dates and durations with no
status, use a `gantt` (pattern 9 in
`.claude/skills/sdlc-architecture-diagram/references/design/mermaid-patterns.md`).

```mermaid
---
title: Roadmap - deal intelligence, releases 1.1 to 1.3
---
flowchart LR
    accTitle: Roadmap for deal intelligence
    accDescr: Three releases from left to right, each listing the capabilities it adds, changes or retires
    subgraph R1["REL-1.1 Foundation"]
        direction TB
        A1["[CHG] Opportunity data model"]:::changed
        A2["[NEW] Manager and representative access"]:::new
    end
    subgraph R2["REL-1.2 Insight"]
        direction TB
        B1["[NEW] Health score calculation"]:::new
        B2["[NEW] Score panel on the deal page"]:::new
        B3["[CHG] Pipeline dashboard"]:::changed
    end
    subgraph R3["REL-1.3 Clean-up"]
        direction TB
        C1["[DEL] Legacy scoring spreadsheet import"]:::removed
        C2["[CHG] Forecast categories"]:::changed
    end
    %% edges: 0 R1-R2, 1 R2-R3
    R1 -->|"enables"| R2
    R2 -->|"then"| R3
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
```

*Caption: the data model and access land first, insight features second, and the legacy import
is retired only after the score has run for one release.*

---

## 5. Interaction, process or flow

### 5a. Process flow (business steps, `flowchart`)

Question: what changes in the path from saving a deal to seeing its score?

```mermaid
---
title: Process flow - score recalculation on save
---
flowchart LR
    accTitle: Score recalculation when a deal is saved
    accDescr: Steps from the user saving a deal to the refreshed score, with new and changed steps marked
    S1["Representative saves the deal"]:::unchanged
    S2["Validation rules run"]:::unchanged
    S3["[CHG] After-save automation"]:::changed
    S4{"[NEW] Score-relevant field changed?"}:::new
    S5["[NEW] Recalculate score"]:::new
    S6["[NEW] Score and band shown on the page"]:::new
    S7["Save completes"]:::unchanged
    %% edges: 0 S1-S2, 1 S2-S3, 2 S3-S4, 3 S4-S5, 4 S4-S7, 5 S5-S6, 6 S6-S7
    S1 --> S2
    S2 --> S3
    S3 -->|"[NEW]"| S4
    S4 -->|"[NEW] yes"| S5
    S4 -->|"[NEW] no"| S7
    S5 -->|"[NEW]"| S6
    S6 -->|"[NEW]"| S7
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
    linkStyle 2,3,4,5,6 stroke:#15803d,stroke-width:2px
```

### 5b. Interaction (who calls whom, `sequenceDiagram`)

`sequenceDiagram` has no classes. Status is carried by the prefix on participants and messages,
a `rect` in the status fill around new or changed interactions, and a `Note over` line as the Key.

```mermaid
---
title: Interaction - score recalculation on save
---
sequenceDiagram
    accTitle: Interaction for score recalculation on save
    accDescr: Calls between the page, trigger, handler, service and the Opportunity record, with new and changed participants marked
    autonumber
    actor U as Sales representative
    participant P as Opportunity record page
    participant T as OpportunityTrigger
    participant H as [CHG] OpportunityTriggerHandler
    participant S as [NEW] OpportunityHealthService
    participant D as [CHG] Opportunity
    Note over U,D: Key - [NEW] new, [CHG] changed, [DEL] removed, no prefix unchanged. Green band marks new calls
    U->>P: Save discount of 25 percent
    P->>T: after update
    T->>H: afterUpdate(newMap, oldMap)
    rect rgb(220, 252, 231)
        H->>S: [NEW] recalculate(changed ids)
        S->>D: [NEW] update Deal_Health_Score__c
        D-->>S: saved
        S-->>H: done
    end
    H-->>T: return
    P-->>U: [NEW] score 90 shown in the panel
```

*Caption: the existing trigger and page are untouched; the handler gains one call to a new
service that writes the new score field.*

`rect` fills: new `rgb(220, 252, 231)`, changed `rgb(254, 243, 199)`, removed `rgb(254, 226, 226)`.

---

## 6. Data model

Question: which objects, relationships and fields does this change add, alter or delete? Use
`flowchart` so status can be shown. Changed objects list only the fields that change, prefixed
`+` (added), `~` (altered) or `-` (deleted). Relationship type and cardinality go in the edge
label; the arrow points from parent to child.

```mermaid
---
title: Data model - deal health and reviews
---
flowchart LR
    accTitle: Data model for deal health and reviews
    accDescr: Objects and relationships with new, changed and removed objects, fields and relationships marked
    ACC[("Account")]:::unchanged
    OPP[("[CHG] Opportunity<br/>+ Deal_Health_Score__c, Number<br/>+ Discount_Percentage__c, Percent<br/>~ StageName, new picklist value")]:::changed
    OCR[("OpportunityContactRole")]:::unchanged
    REV[("[NEW] Deal_Review__c<br/>Outcome__c, Picklist<br/>Notes__c, Long Text Area")]:::new
    RULE[("[NEW] Health_Rule__mdt<br/>Factor__c, Text<br/>Deduction__c, Number")]:::new
    LEG[("[DEL] Legacy_Score__c")]:::removed
    %% edges: 0 ACC-OPP, 1 OPP-OCR, 2 OPP-REV, 3 OPP-LEG
    ACC -->|"1 to many, lookup"| OPP
    OPP -->|"1 to many"| OCR
    OPP -->|"[NEW] 1 to many, master-detail"| REV
    OPP -.->|"[DEL] 1 to many, lookup"| LEG
    subgraph KEY["Key"]
        direction LR
        K1["[NEW] New"]:::new
        K2["[CHG] Changed"]:::changed
        K3["Unchanged"]:::unchanged
        K4["[DEL] Removed"]:::removed
    end
    classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
    classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
    classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
    classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
    linkStyle 2 stroke:#15803d,stroke-width:2px
    linkStyle 3 stroke:#b91c1c,stroke-width:2px,stroke-dasharray:2 2
```

*Caption: Opportunity gains two fields and one picklist value; deal reviews are a new child
object; the legacy score object is deleted (destructive change, data export required first).
`Health_Rule__mdt` holds configuration and has no relationship to the other objects.*

For a full attribute listing with no status, use `erDiagram` (pattern 4 in
`.claude/skills/sdlc-architecture-diagram/references/design/mermaid-patterns.md`) next to
this diagram, not instead of it.
