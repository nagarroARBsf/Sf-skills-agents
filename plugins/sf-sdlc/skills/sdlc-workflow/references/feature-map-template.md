# Feature map — {project}

Path: `<paths.docs>/00-grounding/feature-map.md` (default `docs/sdlc/00-grounding/feature-map.md`).

One section per business capability. Lists every component behind the feature so that an agent
changing it finds all of its parts, and a reviewer can see what a change touches. Use API names
exactly as in source. Mark components that exist only in the org (created in Setup, not
retrieved) with `(org only)`.

Drafted at setup from the baseline inventory, and from the Metadata Grounding MCP when connected
(say which). The developer updates the feature's section in the same change when a story adds,
renames or removes a component.

Sources: {baseline commit} · {grounding MCP used: yes/no} · last updated by {US-nn-mm}

## {Feature name} — {one-line purpose}

| Kind | Components |
|---|---|
| Objects and fields | `Asset`, `Asset.Install_Date__c` |
| Apex | `AssetService`, `AssetTriggerHandler`, trigger `AssetTrigger` |
| LWC | `assetSummary` |
| Flows | `Asset_After_Save_Notify` |
| Permission sets | `Field_Service_Agent` |
| Tests | `AssetServiceTest`, `assetSummary.test.js` |
| Integrations | `INT-01` (named credential `ERP`) |
| Stories | `US-04-01`, `US-04-02` |
| Terms | `device` (ontology) |

Notes: {automation that owns which field, known gaps, components shared with another feature}

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |
