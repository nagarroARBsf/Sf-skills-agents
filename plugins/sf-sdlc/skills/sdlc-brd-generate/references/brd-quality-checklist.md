# BRD quality gate

Run before saving. Each failed item is fixed or turned into an open question.

## Completeness
- [ ] All 19 sections and Appendices A-E present; non-applicable ones say why.
- [ ] Every source in Appendix B was read and is cited at least once (or noted as not relevant).
- [ ] Every BR in §7 has a §8 subsection, and vice versa.
- [ ] Every BR has at least one FR, one acceptance criterion and one source.
- [ ] Every persona in §5.2 appears in at least one scenario or FR.
- [ ] Every objective in §3 is served by at least one BR (Appendix A).
- [ ] Out-of-scope items from the sources appear in §4.2 or §4.3.

## Correctness
- [ ] No invented numbers, names, dates, volumes or KPIs. Each number traces to a source.
- [ ] Every contradiction between speakers or sources is logged as a `Q-nn` naming both
      positions and the rule applied (recency, authority) — including the ones that were resolved.
- [ ] Decisions in Appendix E had an explicit close by someone with decision rights; discussion
      without a close produced no requirement.
- [ ] No statement from an unknown speaker, cross-talk or an inaudible passage is used as the
      only evidence for a requirement or number.
- [ ] `[Inferred]` items have a stated reason.
- [ ] Numbering is continuous (no "§7 then §12"); IDs are unique.
- [ ] No duplicated sections (for example two "Business Background" sections).

## Requirement quality (per FR)
- [ ] Atomic: one behaviour; no "and/or".
- [ ] Testable: a tester can say pass or fail.
- [ ] Unambiguous: no unmeasured *fast, easy, real-time, flexible, user-friendly, etc.*
- [ ] Business language: no object API names, class names or component names in the statement
      (those live in Appendix C).
- [ ] Prioritised (MoSCoW) with an objective link.

## Transcript and data hygiene
- [ ] Every speaker label maps to a stakeholder in §5.1 or is recorded as unknown; no identity
      was guessed.
- [ ] No customer or employee personal data, record-level data, credentials, org IDs or internal
      hostnames appear anywhere in the BRD. Search the draft for `@`, phone-number patterns,
      "password", "token", "key" and any customer name heard in the sources.
- [ ] Each occurrence in the sources is flagged in Appendix B by kind and locator, not by value.
- [ ] Action items have an owner (or `[TBD]`) and are not written as requirements.

## Salesforce lens
- [ ] Feasibility checklist run; each hit recorded as a risk, assumption or question.
- [ ] Appendix C filled and marked indicative.
- [ ] Appendix D: all ten subsections present; every row has a basis tag (`[Stated]`,
      `[Inferred]`, `[TBD]`) and a citation, reason or `Q-nn`.
- [ ] Appendix D contains signals and candidates only: no invented API names, no flow or class
      designs.
- [ ] Sections 1-19 contain no Salesforce object, field, class or component names.
- [ ] Licences / edition, data volumes and growth, sharing expectations, integrations (direction,
      frequency, volume, authentication, error handling), migration and environments are either
      known or raised as questions.

## Readiness for the next stage
- [ ] Delivery notes captured (story slicing instructions from stakeholders).
- [ ] Open questions name who should answer them.
- [ ] Status is "Draft for review"; §19 is empty. The agent has not recorded any approval.
