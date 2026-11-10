---
name: sdlc-jira-story-generate
description: "Convert an approved BRD (or any requirements document) into a Jira-ready backlog: epics, INVEST user stories with Gherkin acceptance criteria, Salesforce story types and labels, dependencies, story-point estimates, a Mermaid dependency graph, release slicing, and a Jira CSV import file. Reads the Jira project key, issue types, field IDs, labels and transitions from the project config. Creates issues through a connected Jira/Atlassian MCP tool only after a preview and an explicit yes, searches first so nothing is duplicated, and records the created keys in the backlog. TRIGGER when: user asks to create epics, user stories, a backlog, Jira tickets, story splitting, acceptance criteria, or a Jira import from a BRD/requirements. DO NOT TRIGGER when: user wants the BRD itself (use sdlc-brd-generate), technical design (use sdlc-solution-architecture-generate), or test cases (use sdlc-qa-test-case-generate)."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-jira-story-generate

Produce a backlog that a Salesforce team can estimate and build from, where every story traces to
a BRD requirement and every acceptance criterion can become a test case.

## Inputs
- BRD (default `docs/sdlc/01-brd/BRD.md`). Other requirement documents work; IDs then start fresh
  and the trace uses section numbers.
- Project config: run `sf-sdlc config show --json` and read `project.code`,
  `project.name` and the whole `jira` block. Never hard-code or guess a project key, issue type
  name, custom field ID, label or transition name. A value missing from the config is asked for
  once, and the user is told to save it with `/sf-sdlc:setup`.
- Optional: epic naming convention, an existing backlog (update it, do not duplicate), team
  velocity, sprint length.

Check the BRD approval record (section 19). If it is not approved, say so and continue only if
the user confirms; note "built on unapproved BRD v{x}" in the backlog header.

## Outputs
- `docs/sdlc/02-backlog/backlog.md` using [references/backlog-template.md](references/backlog-template.md)
- `docs/sdlc/02-backlog/jira-import.csv` using [references/jira-csv-import.md](references/jira-csv-import.md)
- Jira issues, only if `jira.enabled` is true, a Jira/Atlassian MCP tool is connected **and** the
  user answers yes to the preview (step 8)

## Workflow

### 1. Read and index the BRD
List BRs, FRs, rules, NFRs, personas, delivery notes (§8.n.10), decisions (Appendix E) and open
questions. Delivery notes are binding instructions (for example "make only one detailed story for
this epic"). Appendix D (Salesforce solution outline) informs story types and splitting; it is
indicative and never becomes an acceptance criterion.

### 2. Epics
Default one epic per BR: `EPIC-nn` with the BR number. Split a BR into several epics only when it
spans clearly separate capabilities; merge only tiny BRs. Epic name: `{project.name} - {Capability}`
unless the user gives a convention. Add cross-cutting enabler epics when needed (security model,
data migration, integration foundation, DevOps) and mark them `Enabler`.

### 3. Stories
For each FR (and group of related rules), write stories with
[references/story-template.md](references/story-template.md):
- `As a {persona from BRD §5.2}, I want {capability}, so that {benefit tied to an objective}`.
- One persona and one outcome per story. Admin/configuration stories are fine as
  "As a System Administrator" only when the work is genuinely admin-facing; otherwise write it from
  the end user's point of view and put the configuration in the implementation notes.
- Classify the Salesforce story type and labels using
  [references/salesforce-story-patterns.md](references/salesforce-story-patterns.md). Split along
  the seams described there (data model -> automation -> UI -> security -> reporting).
- INVEST check: Independent, Negotiable, Valuable, Estimable, Small (fits a sprint, ≤ 8 points),
  Testable. Split anything bigger.

### 4. Acceptance criteria
Gherkin, numbered `AC-1..n`. Cover per story:
- the main positive path for each rule,
- at least one negative path (blocked, invalid, unauthorised),
- boundaries for any threshold (exactly 20%, 20.01%),
- persona/permission differences when the BRD defines them,
- data volume when relevant (bulk updates, large accounts).
Use concrete values. "Then the score shows 70", not "Then the score is correct".

### 5. Salesforce feasibility pass
Run the feasibility checklist
(`${CLAUDE_PLUGIN_ROOT}/skills/sdlc-workflow/references/salesforce-feasibility-checklist.md`) on every story.
Write hits into the story's *Feasibility notes* and propose the option the architect should
confirm. Do not write an AC that the platform cannot meet (for example "a validation rule warns
but allows save").

### 6. Dependencies, estimates, slicing
- `Blocked by` links: data model before automation before UI; permission sets before UI tests.
- Story points: Fibonacci (1, 2, 3, 5, 8). Mark as estimates; teams re-estimate in refinement.
- Release slicing: MVP slice first (Must items that deliver an end-to-end outcome), then Should,
  then Could.
- Mermaid dependency graph (flowchart, one node per story, ≤ 25 nodes; otherwise one per epic).

### 7. Quality gate
- [ ] Every Must/Should FR is covered by at least one story (coverage table in backlog.md).
- [ ] Every story has a source FR or is marked `Enabler` with a reason.
- [ ] Each story ≤ 8 points and has ≥ 3 ACs incl. ≥ 1 negative.
- [ ] No AC contradicts a feasibility hit.
- [ ] Open BRD questions affecting a story are linked in the story and the story is flagged
      `Not Ready` (Definition of Ready not met).
- [ ] No customer personal data or credentials in any story or AC; test values are synthetic.
- [ ] CSV parses: one header row, quoted fields, no raw line breaks outside quotes.
- [ ] No Jira value in the files is hard-coded: project key, issue types, field columns and labels
      match the config.

### 8. Jira creation (optional, never automatic)
Follow [references/jira-field-mapping.md](references/jira-field-mapping.md) exactly. In short:
1. **Preconditions**: `jira.enabled` is true, a Jira tool is connected, `jira.projectKey` is set.
   Otherwise go to the CSV path below.
2. **Verify the config against Jira**: the project exists; the issue types in `jira.issueTypes`
   exist in it; the field IDs in `jira.fields` exist on the create screen. Report mismatches and
   stop; do not substitute a guess.
3. **Search before create** (idempotency): for every `EPIC-nn` and `US-nn-mm`, search the project
   by the trace label and by the summary prefix. Classify each backlog item as `Create`,
   `Exists` (key found; record it) or `Conflict` (several matches, or a match whose content
   differs).
4. **Preview**: show the site and project key, counts per classification, the full field payload
   of the first epic and the first two stories exactly as they will be sent, and the list of
   every summary to be created.
5. **Explicit yes**: ask "Create {n} issues in {projectKey} on {site}? (yes/no)". Proceed only on
   an unambiguous yes given after this preview, in this session. Anything else, including a yes
   given earlier or a general "go ahead with the stage", is a no.
6. **Create**: epics first, then stories with the parent/epic link, then `is blocked by` links.
   At most 50 issues per batch; stop on the first unexpected error and report what was created.
7. **Record**: after each batch, write the returned keys into `backlog.md` (`Jira key` field of
   each story and the summary table) before creating the next batch, so an interrupted run
   resumes without duplicates.
8. Never update, transition or delete an existing issue in this step. `Exists` items are left as
   they are; content differences are listed for the user.

Without a Jira tool, or when the user says no: explain how to import the CSV (Jira: *Settings →
System → External System Import → CSV*, or the project's *Import issues*), mapping the columns as
in [references/jira-csv-import.md](references/jira-csv-import.md). After the import, ask for the
created keys (or search for them when a tool is connected) and record them in `backlog.md`.

### 9. Report
Path(s), counts (epics, stories, points per epic), FR coverage %, stories flagged Not Ready and
why, feasibility hits, Jira result (created / already existed / conflicts / not attempted), and
next step: PO review, then `/sf-sdlc:architecture`.

## Updating an existing backlog
Keep IDs. New stories take the next free `mm` in their epic. A changed AC gets a change note in the
story. Removed stories become `~~US-03-04~~ withdrawn (reason)`. Stories that already have a
`Jira key` are never re-created; a changed story is listed as "differs from {key}" for the user
to update in Jira, or updated through the tool only after its own preview and explicit yes.
