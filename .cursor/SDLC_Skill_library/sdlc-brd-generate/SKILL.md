---
name: sdlc-brd-generate
description: "Generate a Business Requirements Document (BRD) from unstructured inputs — meeting notes, stakeholder interview transcripts, emails, workshop outputs, RFP extracts — using a standard BABOK-aligned structure with traceable IDs (BR/FR/RULE/NFR), MoSCoW priorities, source citations, open questions and an indicative Salesforce capability fit. Works for Salesforce projects (Sales, Service, Experience, Platform, Agentforce) and falls back to a platform-neutral BRD for non-Salesforce work. TRIGGER when: user asks to write, draft, generate, update or review a BRD / business requirements / requirements document, or to turn meeting notes or transcripts into requirements. DO NOT TRIGGER when: user wants Jira epics or user stories (use sdlc-jira-story-generate), technical design (use sdlc-solution-architecture-generate), or test cases (use sdlc-qa-test-case-generate)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-brd-generate

Turn messy human input into a BRD that a business sponsor can sign and that the Jira story agent
can consume without re-reading the transcripts.

A BRD states **what** the business needs and **why**. It does not design the solution. Salesforce
knowledge is used to ask the right questions, to flag infeasible asks, and to fill an *indicative*
capability-fit appendix, never to write configuration into requirement statements.

## Inputs

- One or more source files or pasted text: meeting notes, transcripts, emails, existing
  documents. Default folder: `docs/sdlc/00-inputs/`.
- Optional: an existing BRD to update, a client BRD template that overrides this one, the project
  code (for example `ORION`) and the document version.

If no input is given, ask for it. Never generate a BRD from imagination.

## Output

- `docs/sdlc/01-brd/BRD.md` (or the path the user names), following
  [references/brd-template.md](references/brd-template.md) section for section.
- A short generation report in chat (see step 8).

## Workflow

### 1. Intake and source register
List every input and give it an ID: `SRC-01` meeting notes (date, author), `SRC-02` transcript,
and so on. Record type, date and author where known. This becomes BRD Appendix B.

### 2. Evidence extraction
Read every source completely. Build an evidence ledger (working notes, not in the BRD) by
classifying each relevant statement using
[references/extraction-guide.md](references/extraction-guide.md): objective, pain point and
metric, stakeholder, process step, requirement, business rule, data element, report need,
NFR, integration, constraint, assumption, decision, risk, open question.

Keep the speaker and the location (`SRC-02 ~12:40 Viktor (VP Sales)` or `SRC-01 §3`).

### 3. Reconcile
- Merge duplicates. Keep the most specific wording.
- Conflicts: a later explicit decision beats an earlier idea; a sponsor beats a contributor. If
  still unclear, keep both and raise `Q-nn`.
- Tag anything you derived rather than read as `[Inferred]`. Inferred items need a reason.
- Never invent numbers, names, dates, volumes or KPIs. Missing values become `[TBD]` plus a `Q-nn`.

### 4. Structure
Group requirements into business capabilities, one `BR-nn` per capability (typically 4-12 for a
phase). Under each BR write atomic functional requirements `FR-nn.m` and business rules
`RULE-nn.m`. Assign MoSCoW priority with a one-line rationale tied to an objective (`OBJ-nn`).

### 5. Write
Fill [references/brd-template.md](references/brd-template.md). Requirement statements:
- "The system shall …" for FRs; one testable behaviour each; no "and/or" bundles.
- No vague words without a measure: *fast, easy, user-friendly, real-time, flexible, etc.*
  Replace with a number or raise a question ("real-time" -> "within 5 seconds? [TBD] Q-07").
- Business language. Put Salesforce mapping only in Appendix C.
- Each FR cites at least one source: `(SRC-01 §2; SRC-02 ~14:05)`.

### 6. Salesforce lens
- Run [../sdlc-workflow/references/salesforce-feasibility-checklist.md](../sdlc-workflow/references/salesforce-feasibility-checklist.md).
  A hit becomes a risk, assumption or open question, worded for a business reader.
- Use [references/salesforce-discovery-questions.md](references/salesforce-discovery-questions.md)
  to find gaps the sources did not cover (licences, volumes, security model, integrations, data
  migration, reporting) and raise them as `Q-nn`. Ask only what matters for this scope.
- Fill Appendix C (capability fit) as *indicative*: Standard / Configuration / Declarative
  automation / Custom code / AppExchange / Out of platform.
- If the work is not Salesforce, drop Appendix C and the Salesforce questions and say so in the
  report.

### 7. Quality gate
Run [references/brd-quality-checklist.md](references/brd-quality-checklist.md). Fix what you can;
list what you cannot under Open Questions. Do not skip this step.

### 8. Save and report
Save the file, then reply with:
- Path, version, status (`Draft for review`, never `Approved`).
- Counts: BRs, FRs, rules, NFRs, open questions, assumptions, inferred items.
- The 3-7 open questions that block the next stage, with the stakeholder who should answer.
- Next step: review and sign-off, then the `sdlc-jira-story-agent`.

## Updating an existing BRD
Read it first. Keep IDs stable; add new items with the next free number. Withdrawn items stay,
struck through, with a reason. Bump the version (1.0 -> 1.1 for clarifications, 2.0 for scope
changes) and add a row to Version History describing what changed and why.

## Client templates
If the user supplies their own BRD template, it wins on structure and headings. Map this
template's content into it, and keep the ID scheme unless the client template defines its own.

## Example
[examples/example-brd-excerpt.md](examples/example-brd-excerpt.md) shows one fully written BR
(objective, scenario, FRs, rules, data, acceptance criteria, sources, open questions).
