# ADR-{nnn}: {Decision title}

| Item | Details |
|---|---|
| Status | Proposed / Accepted / Superseded by ADR-{nnn} |
| Date | {YYYY-MM-DD} |
| Deciders | {names/roles} |
| Related | BR-{nn}, US-{nn-mm}, feasibility F{n}, Q-{nn} |

## Context
The problem, forces and constraints (limits, licences, NFRs, team skills, timeline).

## Options considered
| Option | Pros | Cons |
|---|---|---|
| A. Formula field with TODAY() | No code; always current | Not usable in roll-ups or triggers; not indexable |
| B. Stored field, recalculated on edit + nightly batch | Reportable; indexable | Up to 24 h stale for time-based factors; batch to monitor |
| C. Calculate on read only (LWC/Apex) | Always current; no storage | Not reportable; repeated CPU |

## Decision
The chosen option and why, in two or three sentences.

## Consequences
What becomes easier, what becomes harder, follow-up work (stories, monitoring, documentation).

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
