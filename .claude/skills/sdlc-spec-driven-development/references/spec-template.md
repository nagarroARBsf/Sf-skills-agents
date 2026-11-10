# Feature specification: {Feature name}

| Item | Details |
|---|---|
| Feature folder | `specs/{id}-{slug}/` |
| Source | {US-nn-mm / Jira key / user request "…"} |
| Traces to | {BR-nn, FR-nn.m, RULE-nn.m} |
| Created | {YYYY-MM-DD} |
| Status | Draft |

## 1. Problem and outcome
Who has which problem today, and what changes for them when this ships (two to four sentences).

## 2. User scenarios
### Scenario 1 — {title} (priority P1)
{Plain-language journey of one persona.}
**Independently testable by**: {how to demonstrate this alone}

### Scenario 2 — … (P2)

## 3. Acceptance scenarios
Copy story ACs verbatim; keep numbering.
- **AC-1** Given … When … Then …
- **AC-2** …

## 4. Functional requirements
- **FR-1** The system must …
- **FR-2** …
- **FR-3** The system must notify [NEEDS CLARIFICATION: who receives the alert — owner, manager, or both?]

## 5. Business rules and data
| Rule / data | Definition |
|---|---|
| Discount threshold | Above 20% counts as high discount (configurable) |

Key entities in business terms (what they represent, key attributes, relationships) — no API names.

## 6. Personas and access
| Persona | Can see | Can do | Cannot |
|---|---|---|---|

## 7. Edge cases
- What happens when {boundary}?
- What happens when {record closed / user lacks access / 10,000 records updated at once}?

## 8. Non-functional requirements
Performance, volume, accessibility, mobile — with numbers.

## 9. Success criteria
Measurable, technology-agnostic: "Managers identify all critical deals for a review from one report".

## 10. Out of scope

## 11. Assumptions

## 12. Clarifications
| Date | Question | Answer | By |
|---|---|---|---|

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.

---
### Spec checklist (run before stopping)
- [ ] No implementation detail (class, field API, flow, component names).
- [ ] Every AC is testable with concrete values.
- [ ] Every persona's access stated.
- [ ] Edge cases include: permission denied, bulk, empty/null, closed/locked records.
- [ ] ≤ 5 `[NEEDS CLARIFICATION]` markers.
- [ ] Traces to its source story/requirement.
