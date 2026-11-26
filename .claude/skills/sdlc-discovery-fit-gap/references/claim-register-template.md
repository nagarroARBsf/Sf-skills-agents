# Discovery claim register — {Project}

| Item | Details |
|---|---|
| Document reference | DISC-CLM-{PROJECTCODE}-{NNN} |
| Version / date | {0.1} / {YYYY-MM-DD} |
| Status | Draft for review |
| Discovery pack | `{docs}/00-inputs/discovery/` ({n} sources) |
| Orgs and snapshots | {alias} ({org kind}) — `00-discovery/snapshots/{alias}-{YYYYMMDD}/` taken {time} |

## 1. Summary
| Verdict | Count |
|---|---|
| Confirmed | {n} |
| Partly holds | {n} |
| Contradicted | {n} |
| Stale | {n} |
| Not verifiable from metadata | {n} |

What changes the scope: {one line per Contradicted or Stale claim that matters}.

## 2. Sources
| ID | Source | Type | Date | Owner (role) |
|---|---|---|---|---|
| SRC-01 | {file} | {workshop notes / call transcript / current-state deck / process map} | {date} | {role} |

## 3. Claims
| ID | Claim (one fact) | Source | Org | Verdict | Evidence | Note / question |
|---|---|---|---|---|---|---|
| CLM-001 | Cases are routed to one queue per market | SRC-02 00:14:20 | {alias} | Partly holds | `queues.json`: 6 market queues; `flows.json`: `Case_Routing` routes 4 of them | Q-03: who owns markets 5 and 6? |
| CLM-002 | Letters are produced with S-Docs | SRC-01 §4 | {alias} | Confirmed | `packages.json`: S-Docs (`SDOC`) |  |
| CLM-003 | There are about 40 profiles | SRC-03 | {alias} | Contradicted | `profiles.json`: 112 profiles (78 custom) |  |
| CLM-004 | Market users cannot see other markets' accounts | SRC-02 | {alias} | Not verifiable from metadata | `organization.json`: Account OWD Private; sharing rules not in the snapshot | Q-04: confirm with the security lead; check sharing rules |

## 4. Questions only a person can answer
| ID | Question | Raised by | Who can answer | Blocks |
|---|---|---|---|---|
| Q-03 | {question} | CLM-001 | {role} | FG-007 |

## Approval record
| Role | Name | Decision | Date |
|---|---|---|---|
| Delivery lead |  |  |  |
| Business owner |  |  |  |
