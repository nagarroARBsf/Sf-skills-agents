# Feature specification: {Feature name}

> Keep this to about one page. Record decisions, not a description of the code. For a small bug fix
> or one-file change, keep only the problem, the ACs, how each is verified and any section 7 decision.

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

## 7. Decisions the code can't show
The risk hides in what code does not reveal. State each decision in business terms, or write
"N/A — reason". An unknown is a `[NEEDS CLARIFICATION]` marker, not a guess.

| Decision | What was decided | Source |
|---|---|---|
| Sharing and access | Who sees which records and why (ownership, role, team, sharing rule); which personas edit what | {DEC-nn / Q&A / person} |
| Automation ownership | For each piece of data this feature writes, the one automation or process that owns it, and what must never write it | |
| Volume and limits | Records per transaction, per day and in total; peak load; bulk entry points (import, integration, mass update) | |
| Integration and timing | Synchronous or asynchronous, ordering, retries, what happens when the other system is down | |

## 8. Edge cases
- What happens when {boundary}?
- What happens when {record closed / user lacks access / 10,000 records updated at once}?

## 9. Non-functional requirements
Performance, volume, accessibility, mobile — with numbers.

## 10. Success criteria
Measurable, technology-agnostic: "Managers identify all critical deals for a review from one report".

## 11. Out of scope

## 12. Assumptions

## 13. Clarifications
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
- [ ] Section 7 decisions answered or marked as clarifications; terms match `00-grounding/ontology.yaml`.
- [ ] Edge cases include: permission denied, bulk, empty/null, closed/locked records.
- [ ] ≤ 5 `[NEEDS CLARIFICATION]` markers.
- [ ] Traces to its source story/requirement.
- [ ] Every requirement and AC can become a test; the plan's Unit Test Plan will name one each.
- [ ] About one page; nothing restates what the code will show.
