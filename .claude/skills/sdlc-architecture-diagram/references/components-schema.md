# components.json: the component model

Location: `docs/sdlc/03-architecture/components.json` (under `paths.docs`).

One JSON array. One entry per component that the solution creates, changes, removes, or shows
for context. It is the only place where change status is decided; HLD tables, LLD metadata
inventories, the plan's Metadata Scope and every diagram are derived from it.

## Schema

| Field | Type | Required | Rules |
|---|---|---|---|
| `apiName` | string | yes | The component's API name, unique in the file. Child components use the Metadata API full name: `Opportunity.Deal_Health_Score__c` (field), `Opportunity.Enterprise` (record type), `Opportunity.Discount_Requires_Reason` (validation rule). Include the namespace prefix when `salesforce.namespacePrefix` is set. |
| `type` | string | yes | Metadata API type name, exactly as used in `package.xml`. See the list below. Two pseudo-types exist for diagram nodes that are not metadata: `ExternalSystem` and `PlatformService`. |
| `status` | string | yes | `new`, `changed`, `unchanged` or `removed` (lower case). Determined as described in the skill's "Determine status" section. |
| `story` | string | yes | The `US-nn-mm` that introduces the status. Several stories: comma-separated, in delivery order. Empty string for `unchanged` context components. |
| `layer` | string | yes | `ui`, `automation`, `data`, `security`, `integration` or `external`. Drives subgraph grouping. |
| `dependsOn` | string[] | yes (may be empty) | `apiName` values of components this one uses or requires at deploy time. Every value must exist as an entry. Direction: from the user towards the data (page -> component -> class -> object). |
| `note` | string | yes (may be empty) | What changes and why, in one sentence. For `changed`: what exactly changes. For `unchanged`: how it was verified ("in inventory at <commit>", "org describe on <date>"). For `removed`: what replaces it and whether data is lost. |

No other fields. Unknown values are not guessed: leave the component out and raise an open item.

## Common `type` values

| Layer | Types |
|---|---|
| `ui` | `FlexiPage`, `LightningComponentBundle`, `AuraDefinitionBundle`, `ApexPage`, `Layout`, `CustomApplication`, `CustomTab`, `QuickAction`, `ExperienceBundle` |
| `automation` | `ApexClass`, `ApexTrigger`, `Flow`, `ValidationRule`, `ApprovalProcess`, `PlatformEventChannel`, `CustomLabel` |
| `data` | `CustomObject` (standard objects too, for example `Account`), `CustomField`, `RecordType`, `CustomMetadata`, `GlobalValueSet`, `ReportType`, `Report`, `Dashboard` |
| `security` | `PermissionSet`, `PermissionSetGroup`, `CustomPermission`, `SharingRules`, `Profile` (context only; grant access through permission sets) |
| `integration` | `NamedCredential`, `ExternalCredential`, `ConnectedApp`, `ExternalServiceRegistration`, `RemoteSiteSetting`, `CustomObject` for platform events (`Order_Requested__e`) |
| `external` | `ExternalSystem`, `PlatformService` |

## Example

```json
[
  {
    "apiName": "Opportunity_Record_Page",
    "type": "FlexiPage",
    "status": "changed",
    "story": "US-04-03",
    "layer": "ui",
    "dependsOn": ["healthPanel"],
    "note": "Adds the healthPanel component to the right-hand region."
  },
  {
    "apiName": "healthPanel",
    "type": "LightningComponentBundle",
    "status": "new",
    "story": "US-04-03",
    "layer": "ui",
    "dependsOn": ["OpportunityHealthController"],
    "note": "Shows score, band and risk indicators."
  },
  {
    "apiName": "OpportunityHealthController",
    "type": "ApexClass",
    "status": "new",
    "story": "US-04-03",
    "layer": "automation",
    "dependsOn": ["OpportunityHealthService"],
    "note": "Cacheable read method for the panel."
  },
  {
    "apiName": "OpportunityTrigger",
    "type": "ApexTrigger",
    "status": "unchanged",
    "story": "",
    "layer": "automation",
    "dependsOn": ["OpportunityTriggerHandler"],
    "note": "In inventory; already delegates to the handler."
  },
  {
    "apiName": "OpportunityTriggerHandler",
    "type": "ApexClass",
    "status": "changed",
    "story": "US-04-02",
    "layer": "automation",
    "dependsOn": ["OpportunityHealthService"],
    "note": "afterUpdate now calls OpportunityHealthService.recalculate; the dependency is new."
  },
  {
    "apiName": "OpportunityHealthService",
    "type": "ApexClass",
    "status": "new",
    "story": "US-04-02",
    "layer": "automation",
    "dependsOn": ["Opportunity", "Health_Rule__mdt"],
    "note": "Calculates and stores the score."
  },
  {
    "apiName": "Opportunity",
    "type": "CustomObject",
    "status": "changed",
    "story": "US-04-01",
    "layer": "data",
    "dependsOn": [],
    "note": "Standard object; gains Deal_Health_Score__c and Discount_Percentage__c."
  },
  {
    "apiName": "Opportunity.Deal_Health_Score__c",
    "type": "CustomField",
    "status": "new",
    "story": "US-04-01",
    "layer": "data",
    "dependsOn": ["Opportunity"],
    "note": "Number(3,0), system-calculated."
  },
  {
    "apiName": "Health_Rule__mdt",
    "type": "CustomObject",
    "status": "new",
    "story": "US-04-02",
    "layer": "data",
    "dependsOn": [],
    "note": "Custom metadata type holding deduction rules; records deploy as CustomMetadata."
  },
  {
    "apiName": "Sales_Manager_Access",
    "type": "PermissionSet",
    "status": "changed",
    "story": "US-04-01",
    "layer": "security",
    "dependsOn": ["Opportunity.Deal_Health_Score__c"],
    "note": "Adds read access to the new field."
  },
  {
    "apiName": "Legacy_Score__c",
    "type": "CustomObject",
    "status": "removed",
    "story": "US-04-06",
    "layer": "data",
    "dependsOn": [],
    "note": "Replaced by Deal_Health_Score__c. Destructive change: export records first."
  }
]
```

## Maintenance rules

1. **Create** the file when the baseline is established (design stage). Greenfield: start with
   the standard objects and platform services the solution uses, as `unchanged`.
2. **Update at design time** whenever an HLD or LLD adds, drops or re-scopes a component. Edit
   the model first, then the tables and diagrams.
3. **Reconcile after build** with `node .claude/bin/sf-sdlc delta --from <git-ref> --json`:
   - in the delta but not in the model: add it and flag the design gap;
   - `new` in the model but `changed` in the delta (or the reverse): the delta wins; correct the
     model and the documents that quote it;
   - in the model as `new`/`changed` but not in the delta: not built yet, or built differently —
     report it, do not silently delete it.
4. **After a release**, statuses are relative to the new baseline. Start the next release by
   re-running the inventory; components shipped in the previous release become `unchanged`
   until a new story touches them, and `removed` entries are deleted from the file.
5. A parent is `changed` whenever one of its children is `new`, `changed` or `removed`.
6. Keep the file valid JSON (no comments, no trailing commas), two-space indentation, entries
   grouped by layer in the order `ui`, `automation`, `data`, `security`, `integration`,
   `external`.

## Validation before use

- Every `apiName` unique; every `dependsOn` value resolves to an entry.
- `status` and `layer` use only the allowed values.
- Every `unchanged` entry has a verification note.
- Every `removed` entry states the replacement and the data consequence.
- No entry is `new` if the inventory contains it; no entry is `changed` or `removed` if neither
  the inventory nor the org contains it.
