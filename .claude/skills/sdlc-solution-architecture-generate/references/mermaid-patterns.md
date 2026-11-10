# Mermaid patterns for Salesforce architecture

Copy and adapt. All patterns use diagram types that render on common Git hosts, wikis and editor
previews.

These patterns show structure only. Any diagram that shows components of the solution must also
show what is New, Changed, Unchanged and Removed: for that, use the `sdlc-architecture-diagram`
skill and its templates (`.claude/skills/sdlc-architecture-diagram/references/diagram-templates.md`),
which add the status classes, label prefixes and the Key to patterns 1, 3, 4, 6 and 7. Patterns 2
(sequence), 5 (state), 8 (pipeline) and 9 (timeline) carry status through label prefixes only,
or not at all.

## Syntax rules that avoid broken renders
- Quote labels with spaces, parentheses, slashes, colons or `#`: `A["Apex (async)"]`.
- Node IDs: letters and digits only (`US0402`, not `US-04-02`). Put the readable ID in the label.
- Do not use `end` as a node ID (it closes subgraphs).
- Line breaks inside labels: `<br/>`.
- Edge labels: `A -->|"label"| B` (flowchart) or `A -- "label" --> B`.
- `erDiagram` attribute lines are `type name "comment"`; types cannot contain spaces or
  parentheses (`Number`, not `Number(3,0)`). Put precision in the comment.
- Keep each diagram under ~25 nodes.

## 1. System landscape (Level 1: what talks to what)
```mermaid
flowchart LR
    subgraph EXT["External systems"]
        ERP["ERP"]
        MKT["Marketing platform"]
    end
    subgraph SF["Salesforce"]
        SC["Sales Cloud"]
        EXP["Experience Cloud<br/>partner portal"]
    end
    MW["Middleware"]
    IDP["Identity provider (SSO)"]
    ERP <-->|"orders, products (batch)"| MW
    MW <-->|"Bulk / REST API"| SC
    MKT -->|"leads (real time)"| SC
    IDP -.->|"SAML"| SC
    SC --- EXP
```

## 2. Integration sequence (request and reply with error path)
```mermaid
sequenceDiagram
    autonumber
    participant LWC as LWC creditCheck
    participant AX as CreditCheckController
    participant NC as Named Credential
    participant BUR as Credit bureau API
    LWC->>AX: checkCredit(accountId)
    AX->>NC: HTTP POST /score
    NC->>BUR: OAuth client credentials
    alt 200 OK
        BUR-->>AX: score JSON
        AX-->>LWC: CreditResult
    else timeout or 5xx
        BUR-->>AX: error
        AX->>AX: log to Integration_Log__c
        AX-->>LWC: AuraHandledException (friendly message)
    end
```

## 3. Event-driven (Platform Event fan-out)
```mermaid
flowchart LR
    T["Opportunity trigger<br/>(Closed Won)"] -->|"publish"| PE[["Order_Requested__e"]]
    PE --> F["Flow: create onboarding tasks"]
    PE --> AP["Apex subscriber:<br/>callout to ERP"]
    PE --> MW["Middleware via<br/>Pub/Sub API"]
```

## 4. Data model (ERD)
```mermaid
erDiagram
    Account ||--o{ Contact : "employs"
    Account ||--o{ Opportunity : "owns"
    Opportunity ||--|{ OpportunityLineItem : "contains"
    Product2 ||--o{ OpportunityLineItem : "priced in"
    Opportunity ||--o{ Deal_Review__c : "master-detail"
    Deal_Review__c {
        Id Id
        MasterDetail Opportunity__c "to Opportunity"
        Picklist Outcome__c "Approved, Rejected"
        LongTextArea Notes__c "32k"
    }
```
Cardinality: `||--o{` one to many (optional), `||--|{` one to many (required), `}o--o{` many to
many (show the junction object explicitly in Salesforce).

## 5. Status lifecycle
```mermaid
stateDiagram-v2
    [*] --> Prospecting
    Prospecting --> Qualification
    Qualification --> Proposal
    Proposal --> Negotiation
    Negotiation --> ClosedWon: won
    Negotiation --> ClosedLost: lost, reason required
    Qualification --> ClosedLost
    ClosedWon --> [*]
    ClosedLost --> [*]
```

## 6. Automation order on one object
```mermaid
flowchart TD
    SAVE["Opportunity save"] --> BF["Before-save flows"]
    BF --> BT["Before triggers"]
    BT --> VR["Validation rules"]
    VR --> AT["After triggers"]
    AT --> AF["After-save flows"]
    AF --> CMT["Commit"]
    CMT --> ASYNC["Async: queueables, platform events"]
```

## 7. LWC component tree
```mermaid
flowchart TD
    PAGE["Opportunity record page"] --> PANEL["c-opportunity-intelligence-panel"]
    PANEL --> SCORE["c-health-score-badge"]
    PANEL --> RISKS["c-risk-indicator-list"]
    PANEL --> INS["c-insight-messages<br/>(managers only)"]
    PANEL -.->|"@wire getHealth (cacheable)"| APEX["OpportunityIntelligenceController"]
```

## 8. Deployment pipeline
```mermaid
flowchart LR
    FB["feature/US-04-02"] -->|"PR: Code Analyzer, Apex tests, Jest"| DEV["develop -> Integration sandbox"]
    DEV -->|"release branch"| UAT["UAT sandbox"]
    UAT -->|"validated deploy + quick deploy"| PROD["Production"]
```

## 9. Release timeline
```mermaid
gantt
    title Release 1
    dateFormat YYYY-MM-DD
    section Build
    Sprint 1 data model and security :s1, 2026-11-02, 14d
    Sprint 2 automation and UI       :s2, after s1, 14d
    section Test
    SIT and UAT                      :t1, after s2, 10d
    section Release
    Go-live                          :milestone, after t1, 0d
```
