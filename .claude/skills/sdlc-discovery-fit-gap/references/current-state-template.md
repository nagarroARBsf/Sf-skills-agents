# Current-state assessment — {org alias / org name}

| Item | Details |
|---|---|
| Document reference | DISC-CSA-{PROJECTCODE}-{NNN} |
| Version / date | {0.1} / {YYYY-MM-DD} |
| Status | Draft for review |
| Org | {alias} — {org kind}, org ID {id}, {edition} |
| Snapshot | `00-discovery/snapshots/{alias}-{YYYYMMDD}/` taken {time}; {n} queries not available ({names}) |
| Discovery pack | {n} sources; claim register `claim-register.md` |

## 1. Summary
Five lines: what the org is used for, how healthy it is, the three biggest risks, what the discovery
pack got wrong, what still needs a person.

## 2. At a glance
| Domain | Measure | Value |
|---|---|---|
| Data model | Custom objects (unmanaged) / custom fields / record types | {n} / {n} / {n} |
| Automation | Active flows by type / Process Builder / Workflow Rules / validation rules | {…} |
| Code | Apex classes / triggers / LWC / Aura | {…} |
| Security | Profiles / custom permission sets / permission set groups / roles (depth) | {…} |
| Integrations | Named credentials / remote sites / connected apps | {…} |
| Packages | Installed packages | {list} |
| Licences | Used / total per licence | {…} |
| Volumes | Largest objects | {…} |
| Adoption | Reports not run in a year / setup changes in 180 days | {…} |

## 3. Findings
| # | Domain | Finding | Severity | Pillar (Trusted / Easy / Adaptable) | Evidence | Recommendation |
|---|---|---|---|---|---|---|
| 1 | Automation | 3 active triggers on Case | High | Adaptable | `apexTriggers.json` | One trigger + handler; move simple logic to flows |

## 4. Per domain
### 4.1 Data model
### 4.2 Automation (per key object: triggers, flows, validation rules, in execution order where known)
### 4.3 Code
### 4.4 Security and access (org-wide defaults, role hierarchy, profiles and permission sets, personas)
### 4.5 Integrations
### 4.6 Packages and licences
### 4.7 Limits and volumes
### 4.8 Adoption and recent change

## 5. What metadata could not tell us
Rationale, usage without Event Monitoring, data quality, external systems, anything a missing
permission hid. One line each with the `Q-nn` and who can answer.

## Approval record
| Role | Name | Decision | Date |
|---|---|---|---|
| Solution architect |  |  |  |
| Org owner / admin lead |  |  |  |
