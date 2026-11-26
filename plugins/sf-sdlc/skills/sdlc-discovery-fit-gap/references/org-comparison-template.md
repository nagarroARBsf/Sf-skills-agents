# Org comparison — {source org} into {target org}

| Item | Details |
|---|---|
| Document reference | DISC-CMP-{PROJECTCODE}-{NNN} |
| Version / date | {0.1} / {YYYY-MM-DD} |
| Status | Draft for review |
| Target (survives) | {alias} ({org kind}) — snapshot `{folder}` taken {time} |
| Source (moves) | {alias} ({org kind}) — snapshot `{folder}` taken {time} |
| Produced with | `sf-sdlc discover compare {target} {source} --json` |
| Programme rule | {for example "no source-only processes: the source adopts the target's process"} |

## 1. Summary
| Type | Only target | Only source | Same | Different |
|---|---|---|---|---|
| Objects | {n} | {n} | {n} | {n} |
| Custom fields | | | | |
| Record types | | | | |
| Flows | | | | |
| Apex triggers / classes | | | | |
| Profiles / permission sets / groups | | | | |
| Roles / queues | | | | |
| Packages | | | | |
| Integrations (named credentials, remote sites, connected apps) | | | | |

Org-wide defaults that differ: {list}.

## 2. Conflicts
| # | Conflict | Target | Source | Impact | Decision | Owner |
|---|---|---|---|---|---|---|
| 1 | Same API name, different meaning | `Case.Market__c` (text) | `Case.Market__c` (picklist, 9 values) | Data mapping, reports | Merge — picklist in target | Data lead |
| 2 | Two automations on Case before update | Flow `Case_Before_Save` | Trigger `CaseTrigger` | Order not guaranteed | Keep target flow; rebuild source logic in it | Tech lead |

## 3. Decisions per component
Decision values: **Keep target**, **Bring from source**, **Merge**, **Retire**, **Decide** (with `Q-nn`).

| Type | Component | In | Difference | Decision | Fit-gap item | Note |
|---|---|---|---|---|---|---|
| CustomObject | `Complaint__c` | source only | — | Retire | FG-002 | becomes Case with record type |

## 4. Access model
Profiles in each org, the personas they serve, and the target permission set groups (one per persona).

| Persona | Source profile(s) | Target profile | Permission set group | Note |
|---|---|---|---|---|

## 5. Integrations to re-point
| Integration | Source org endpoint / credential | Target | Action |
|---|---|---|---|

## 6. Data
| Object | Source records | Target records | Duplicate risk | Migration note |
|---|---|---|---|---|

## Approval record
| Role | Name | Decision | Date |
|---|---|---|---|
| Solution architect |  |  |  |
| Business owner |  |  |  |
