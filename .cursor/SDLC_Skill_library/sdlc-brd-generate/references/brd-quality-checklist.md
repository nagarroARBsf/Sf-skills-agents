# BRD quality gate

Run before saving. Each failed item is fixed or turned into an open question.

## Completeness
- [ ] All 19 sections and Appendices A-C present; non-applicable ones say why.
- [ ] Every source in Appendix B was read and is cited at least once (or noted as not relevant).
- [ ] Every BR in §7 has a §8 subsection, and vice versa.
- [ ] Every BR has at least one FR, one acceptance criterion and one source.
- [ ] Every persona in §5.2 appears in at least one scenario or FR.
- [ ] Every objective in §3 is served by at least one BR (Appendix A).
- [ ] Out-of-scope items from the sources appear in §4.2 or §4.3.

## Correctness
- [ ] No invented numbers, names, dates, volumes or KPIs. Each number traces to a source.
- [ ] Conflicts are resolved with a cited decision or listed as open questions.
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

## Salesforce lens
- [ ] Feasibility checklist run; each hit recorded as a risk, assumption or question.
- [ ] Appendix C filled and marked indicative.
- [ ] Licences / edition, data volumes, sharing model and integrations either known or raised as
      questions.

## Readiness for the next stage
- [ ] Delivery notes captured (story slicing instructions from stakeholders).
- [ ] Open questions name who should answer them.
- [ ] Status is "Draft for review".
