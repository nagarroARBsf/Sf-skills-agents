# Baseline inventory — {Project}

Save as `docs/sdlc/03-architecture/baseline/inventory.md`. It records what exists **before** the
designed change, so that every component in the design can be marked New, Changed, Unchanged or
Removed against evidence. Regenerate it at the start of each release.

| Item | Details |
|---|---|
| Classification | Greenfield / Brownfield / Brownfield with greenfield domain: {domain} |
| Baseline reference | branch `{git.integrationBranch}` @ `{commit}` on {YYYY-MM-DD} |
| Source | `sf-sdlc inventory --json` over {package directories} |
| Org checked | {alias and org type, or "none — org-only components not verified"} |
| API version | {sourceApiVersion from sfdx-project.json} (config: `salesforce.apiVersion`) |
| Status | Draft for review |

## 1. Classification evidence
Why this scope is greenfield or brownfield: what the inventory contains in the affected area,
whether the target org already has users, data and customisation.

Greenfield only: state "No existing custom components in scope. Everything designed is New.
Standard objects and platform services used without modification are Unchanged." and list those
standard components in section 3. Sections 4-7 then read "None".

## 2. Summary by metadata type
| Metadata type | Count | Notes |
|---|---|---|
| CustomObject (custom) | | |
| CustomObject (standard, customised) | | |
| CustomField | | |
| ApexClass (non-test) | | |
| ApexClass (test) | | |
| ApexTrigger | | |
| Flow | | record-triggered {n}, screen {n}, scheduled {n}, autolaunched {n} |
| LightningComponentBundle | | |
| AuraDefinitionBundle | | |
| FlexiPage | | |
| PermissionSet / PermissionSetGroup | | |
| Profile | | in source: yes / no |
| ValidationRule | | |
| NamedCredential / ExternalCredential | | |
| CustomMetadata (records) | | |
| Other | | |

## 3. Components in the affected area
Every existing component the stories in scope could touch or depend on. This table is what the
design is checked against.

| API name | Type | Layer | Used by / depends on | Last changed (commit or date) | Notes |
|---|---|---|---|---|---|
| `Opportunity` | CustomObject (standard) | data | — | — | 14 custom fields, 2 record types |
| `OpportunityTrigger` | ApexTrigger | automation | `OpportunityTriggerHandler` | {commit} | all events |

## 4. Automation per object
More than one automation on the same object and event is the main source of regressions. List
all of them for each object in the affected area, in execution order.

| Object | Event | Mechanism | Name | Order / notes |
|---|---|---|---|---|
| Opportunity | before save | Record-triggered flow | `Opp_BeforeSave_Defaults` | trigger order 10 |
| Opportunity | before/after insert, update | Apex trigger | `OpportunityTrigger` → `OpportunityTriggerHandler` | |
| Opportunity | — | Validation rules | {n} active | |

## 5. Conventions found
| Convention | Found | Evidence |
|---|---|---|
| Trigger framework | {name / one trigger per object + handler / none} | `{path}` |
| Naming prefix | {prefix or none} (config: `salesforce.componentPrefix`) | |
| Namespace | {prefix or none} (config: `salesforce.namespacePrefix`) | |
| Test data factory | {class or none} | |
| Logging / error handling | {utility or none} | |
| Selector / service / domain layering | {yes: pattern / no} | |
| Access model | permission sets / profiles / mixed | |
| LWC conventions | {base components, shared utilities, Jest present} | |
| Static analysis config | `code-analyzer.yml` present / absent | |

## 6. Installed packages and external dependencies
| Package / system | Namespace | Version | Touches the affected area? |
|---|---|---|---|

From `sf package installed list --target-org <alias>` when an org was checked; otherwise from
`sfdx-project.json` dependencies and namespaced references found in source.

## 7. Org-only components
Components that exist in the org but not in source (found through
`sf org list metadata --metadata-type <Type> --target-org <alias>` or
`sf sobject describe --sobject <ApiName> --target-org <alias>`).

| API name | Type | Found by | Action |
|---|---|---|---|
| | | | Retrieve into source before changing / leave / investigate |

## 8. Gaps and risks in the baseline
- What could not be verified (no org access, unreadable metadata, unpackaged Setup changes).
- Technical debt that the design must work around (several triggers on one object, logic in
  profiles, hard-coded IDs, low coverage on classes to be changed).
- Each gap has an owner and becomes an open item in the HLD (§17).

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
