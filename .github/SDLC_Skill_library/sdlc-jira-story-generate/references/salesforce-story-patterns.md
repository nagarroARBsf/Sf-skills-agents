# Salesforce story patterns

## Story types and labels

| Story type | Typical work | Labels |
|---|---|---|
| Data model | Objects, fields, record types, relationships, picklists | `sf-data-model` |
| Configuration | Page layouts, Lightning pages, Path, list views, apps, Setup features | `sf-config` |
| Security and access | Permission sets/groups, custom permissions, OWD, sharing rules, roles | `sf-security` |
| Declarative automation | Record-triggered / scheduled / screen flows, validation rules, approvals | `sf-flow`, `sf-validation` |
| Apex | Triggers, services, batch/queueable/schedulable, invocables, REST | `sf-apex` |
| UI component | LWC, Dynamic Forms, custom actions | `sf-lwc` |
| Integration | Named Credentials, callouts, Platform Events, CDC, External Services | `sf-integration` |
| Reporting | Report types, reports, dashboards, Collaborative Forecasts | `sf-reporting` |
| Data migration | Mapping, load, de-duplication, validation reports | `sf-data-migration` |
| Agentforce | Agents, topics, actions, prompt templates | `sf-agentforce` |
| OmniStudio | OmniScripts, FlexCards, Integration Procedures, Data Mappers | `sf-omnistudio` |
| Enabler | DevOps, environments, frameworks, spikes | `enabler`, `spike` |

## Splitting seams

Split large requirements along these seams, in this order of delivery:

1. **Data model** — fields and objects the rest depends on.
2. **Security** — permission set that grants the new fields (so the UI can be tested by personas).
3. **Logic** — validation, automation, calculation.
4. **UI** — showing it to users.
5. **Persona variants** — role-specific visibility as its own story when it has its own rules.
6. **Reporting** — reports and dashboards that consume the data.
7. **Bulk / scheduled processing** — nightly jobs, data fixes.

Other good seams: by business rule (one story per complex rule), by record type, by channel
(desktop vs mobile), happy path first then exceptions.

Avoid splitting by technical layer only when no layer is demonstrable alone ("create Apex class"
as a story with no visible outcome). Prefer a thin vertical slice that a PO can accept.

## Example: one BR to stories

BR "Opportunity health and risk insight" becomes:

| Story | Type | Points |
|---|---|---|
| US-04-01 Health score fields and manager custom permission | Data model + Security | 2 |
| US-04-02 Calculate and store the health score | Apex | 5 |
| US-04-03 Show score, band and risk badges on the opportunity page | UI component | 5 |
| US-04-04 Show risk explanations to managers only | UI component | 3 |
| US-04-05 At-risk deals report and dashboard component | Reporting | 2 |

## Acceptance-criteria prompts by type

| Type | Make sure ACs cover |
|---|---|
| Data model | field type, length, default, required-ness, help text, visible to which personas |
| Validation | blocking message text and location, the exact boundary, bypass for integration/admin if required |
| Flow / Apex | each rule, combined rules, re-entry/recursion, 200+ records, failure handling |
| LWC | loading, empty, error states; persona visibility; mobile; accessibility (labels, contrast) |
| Integration | success, timeout, 4xx/5xx, retry, idempotency, logging |
| Reporting | filter logic, totals match underlying records, access for each persona |
| Data migration | counts reconcile, mandatory fields, owners mapped, duplicates handled |

## Estimation hints (adjust to the team)

| Points | Typical Salesforce work |
|---|---|
| 1 | A few fields / a picklist change / a list view |
| 2 | Permission set + layout + small validation rule |
| 3 | Simple record-triggered flow; simple LWC display |
| 5 | Apex service + trigger handler with tests; LWC with Apex controller |
| 8 | Integration callout with error handling; complex LWC; batch with scheduling |
| 13+ | Too big: split |
