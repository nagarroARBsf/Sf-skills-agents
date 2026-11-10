---
name: sdlc-brd-generate
description: "Generate a Business Requirements Document (BRD) from raw, unstructured inputs — meeting transcripts, notes, interviews, emails, workshop outputs — using a BABOK-aligned structure with traceable IDs (BR/FR/RULE/NFR), MoSCoW priorities, source citations, decisions, action items and open questions. Handles transcript noise, speaker attribution, contradictions and personal data. Keeps requirements solution-neutral and adds an indicative Salesforce solution outline (data model, automation, UI, integrations, security, migration, reporting, licences and limits). Falls back to a platform-neutral BRD for non-Salesforce work. TRIGGER when: user asks to write, draft, update or review a BRD / business requirements / requirements document, or to turn transcripts or meeting notes into requirements. DO NOT TRIGGER when: user wants Jira epics or stories (use sdlc-jira-story-generate), technical design (use sdlc-solution-architecture-generate), or test cases (use sdlc-qa-test-case-generate)."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-brd-generate

Turn messy human input into a BRD that a business sponsor can sign and that the Jira story agent
can consume without re-reading the transcripts.

A BRD states **what** the business needs and **why**. It does not design the solution.
Requirement statements (sections 1-19) stay solution-neutral. Salesforce knowledge is used to ask
the right questions, to flag infeasible asks, and to fill two *indicative* appendices (C capability
fit, D solution outline) that give the architect a head start. Nothing in an appendix is a design
decision.

## Inputs

- One or more source files or pasted text. The usual input is a raw meeting transcript: unedited,
  with speaker labels, timestamps, filler and cross-talk. Notes, emails and existing documents also
  work. Default folder: `docs/sdlc/00-inputs/` (under `paths.docs` in the project config).
- Project name, code and client: read `project.name`, `project.code`, `project.client` with
  `sf-sdlc config show --json`. Ask only if the config has no value.
- Optional: an existing BRD to update, a client BRD template that overrides this one, the document
  version.

If no input is given, ask for it. Never generate a BRD from imagination. Never edit a source file.

## Output

- `docs/sdlc/01-brd/BRD.md` (or the path the user names), following
  [references/brd-template.md](references/brd-template.md) section for section.
- A short generation report in chat (see step 9).

## Workflow

### 1. Intake and source register
List every input and give it an ID: `SRC-01`, `SRC-02`, and so on. Record type, date, author or
participants, and whether it is raw (verbatim transcript) or edited (notes, minutes). This becomes
BRD Appendix B.

### 2. Prepare transcripts
Follow [references/transcript-handling.md](references/transcript-handling.md) before extracting:
- Build the speaker map (label -> name, role, organisation, decision rights). Unknown speakers stay
  `Speaker 3 (role unknown)`; never guess an identity.
- Strip filler, false starts, small talk and repeated phrases from your working notes, not from
  the source.
- Mark cross-talk and inaudible passages; a statement you could not attribute or fully read is
  not evidence.
- Screen for personal and sensitive data (step 4) before anything is copied.

### 3. Evidence extraction
Read every source completely. Build an evidence ledger (working notes, not in the BRD) by
classifying each relevant statement using
[references/extraction-guide.md](references/extraction-guide.md): objective, pain point and
metric, stakeholder, process step, requirement, business rule, data element, report need,
NFR, integration, constraint, assumption, decision, action item, risk, open question.

Separate **decisions** from **discussion**. An idea that was floated, debated and left is
discussion, however long it ran. A decision needs an explicit close ("agreed", "let's go with",
no objection after a proposal by someone with decision rights). Keep the speaker and the locator
for every ledger entry (`SRC-02 ~12:40 VP Sales` or `SRC-01 §3`).

### 4. Personal and sensitive data
Do not copy into the BRD: customer or employee personal data (names of customers' contacts, email
addresses, phone numbers, account numbers, health or financial details), record-level data read
out in a meeting, passwords, API keys, tokens, org IDs, login URLs with credentials.
- Replace with a neutral description ("a named enterprise customer", "an integration credential").
- Stakeholders taking part in the project are named in section 5.1 by name and role; that is the
  only personal data the BRD holds.
- Record each occurrence in the Appendix B "Sensitive content" column (what kind, where; never
  the value) and tell the user in the report. A credential spoken or pasted in a source is a
  security incident for the user to act on: say so plainly.

### 5. Reconcile
- Merge duplicates. Keep the most specific wording.
- Contradictions between speakers: resolve by **recency** (a later explicit statement beats an
  earlier one, within or across meetings) and **authority** (the person with decision rights for
  that topic beats a contributor). Log **every** contradiction as a `Q-nn` in section 17, with both
  positions, the resolution applied and who should confirm it, even when the rule gave a clear
  answer. If neither rule decides, keep both positions and leave the item `[TBD]`.
- Tag anything you derived rather than read as `[Inferred]`. Inferred items need a reason.
- Never invent numbers, names, dates, volumes or KPIs. Missing values become `[TBD]` plus a `Q-nn`.

### 6. Structure and write
Group requirements into business capabilities, one `BR-nn` per capability (typically 4-12 for a
phase). Under each BR write atomic functional requirements `FR-nn.m` and business rules
`RULE-nn.m`. Assign MoSCoW priority with a one-line rationale tied to an objective (`OBJ-nn`).
Fill the template. Requirement statements:
- "The system shall …" for FRs; one testable behaviour each; no "and/or" bundles.
- No vague words without a measure: *fast, easy, user-friendly, real-time, flexible, etc.*
  Replace with a number or raise a question ("real-time" -> "within 5 seconds? [TBD] Q-07").
- Business language. No object, field, class or component names outside Appendices C and D.
- Each FR cites at least one source: `(SRC-01 §2; SRC-02 ~14:05)`.
Record decisions and action items in Appendix E (`DEC-nn`, `ACT-nn`).

### 7. Salesforce lens
- Run the feasibility checklist
  (`${CLAUDE_PLUGIN_ROOT}/skills/sdlc-workflow/references/salesforce-feasibility-checklist.md`). A hit becomes a
  risk, assumption or open question, worded for a business reader.
- Use [references/salesforce-discovery-questions.md](references/salesforce-discovery-questions.md)
  to find gaps the sources did not cover and raise them as `Q-nn`. Ask only what matters for this
  scope.
- Fill Appendix C (capability fit) and Appendix D (Salesforce solution outline). Every Appendix D
  row carries a basis tag and a citation: `[Stated]` (a source says it; cite it), `[Inferred]`
  (derived; give the reason and the requirement it derives from), `[TBD]` (unknown; link the
  `Q-nn`). Appendix D lists signals and candidates ("approval with thresholds: declarative
  signal"), never designs (no flow names, class names or field API names for things that do not
  exist yet). Existing org components named in a source may be cited by their real name.
- If the work is not Salesforce, drop Appendices C and D and the Salesforce questions and say so
  in the report.

### 8. Quality gate
Run [references/brd-quality-checklist.md](references/brd-quality-checklist.md). Fix what you can;
list what you cannot under Open Questions. Do not skip this step.

### 9. Save and report
Save the file, then reply with:
- Path, version, status (`Draft for review`, never `Approved`; section 19 is left for people).
- Counts: BRs, FRs, rules, NFRs, decisions, action items, open questions, assumptions, inferred
  items, contradictions logged.
- Sensitive content found in the sources (kind and location only).
- The 3-7 open questions that block the next stage, with the stakeholder who should answer.
- Next step: review and sign-off, then `/sf-sdlc:stories`.

## Updating an existing BRD
Read it first. Keep IDs stable; add new items with the next free number. Withdrawn items stay,
struck through, with a reason. Bump the version (1.0 -> 1.1 for clarifications, 2.0 for scope
changes) and add a row to Version History describing what changed and why. A new transcript that
contradicts an approved requirement does not overwrite it: raise a `Q-nn` and mark the
requirement `Under review`.

## Client templates
If the user supplies their own BRD template, it wins on structure and headings. Map this
template's content into it, and keep the ID scheme unless the client template defines its own.

## Example
[examples/example-brd-excerpt.md](examples/example-brd-excerpt.md) shows a raw transcript passage
and what it becomes: one fully written BR, the logged contradiction, and the matching Appendix C,
D and E rows.
