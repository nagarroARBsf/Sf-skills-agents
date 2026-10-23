---
name: sdlc-jira-story-generate
description: "Convert an approved BRD (or any requirements document) into a Jira-ready backlog: epics, INVEST user stories with Gherkin acceptance criteria, Salesforce story types and labels, dependencies, story-point estimates, a Mermaid dependency graph, release slicing, and a Jira CSV import file. Optionally creates the issues through a connected Jira/Atlassian MCP server after explicit approval. TRIGGER when: user asks to create epics, user stories, backlog, Jira tickets, story splitting, acceptance criteria, or a Jira import from a BRD/requirements. DO NOT TRIGGER when: user wants the BRD itself (use sdlc-brd-generate), technical design (use sdlc-solution-architecture-generate), or test cases (use sdlc-qa-test-case-generate)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-jira-story-generate

Produce a backlog that a Salesforce team can estimate and build from, where every story traces to
a BRD requirement and every acceptance criterion can become a test case.

## Inputs
- BRD (default `docs/sdlc/01-brd/BRD.md`). Other requirement documents work; IDs then start fresh
  and the trace uses section numbers.
- Optional: Jira project key, epic naming convention, existing backlog (to update instead of
  duplicate), team velocity, sprint length.

Check the BRD status. If it is not approved, say so and continue only if the user confirms.

## Outputs
- `docs/sdlc/02-backlog/backlog.md` using [references/backlog-template.md](references/backlog-template.md)
- `docs/sdlc/02-backlog/jira-import.csv` using [references/jira-csv-import.md](references/jira-csv-import.md)
- Jira issues, only if a Jira/Atlassian MCP tool is available **and** the user approves the
  preview (step 8)

## Workflow

### 1. Read and index the BRD
List BRs, FRs, rules, NFRs, personas, delivery notes (§8.n.10) and open questions. Delivery notes
are binding instructions (for example "make only one detailed story for this epic").

### 2. Epics
Default one epic per BR: `EPIC-nn` with the BR number. Split a BR into several epics only when it
spans clearly separate capabilities; merge only tiny BRs. Epic name: `{Project} - {Capability}`
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
Run [../sdlc-workflow/references/salesforce-feasibility-checklist.md](../sdlc-workflow/references/salesforce-feasibility-checklist.md)
on every story. Write hits into the story's *Feasibility notes* and propose the option the
architect should confirm. Do not write an AC that the platform cannot meet (for example "a
validation rule warns but allows save").

### 6. Dependencies, estimates, slicing
- `Blocked by` links: data model before automation before UI; permission sets before UI tests.
- Story points: Fibonacci (1, 2, 3, 5, 8). Mark as estimates; teams re-estimate in refinement.
- Release slicing: MVP slice first (Must items that deliver an end-to-end outcome), then Should,
  then Could.
- Mermaid dependency graph (flowchart, one node per story, ≤ 40 nodes; otherwise per epic).

### 7. Quality gate
- [ ] Every Must/Should FR is covered by at least one story (coverage table in backlog.md).
- [ ] Every story has a source FR or is marked `Enabler` with a reason.
- [ ] Each story ≤ 8 points and has ≥ 3 ACs incl. ≥ 1 negative.
- [ ] No AC contradicts a feasibility hit.
- [ ] Open BRD questions affecting a story are linked in the story and the story is flagged
      `Not Ready` (Definition of Ready not met).
- [ ] CSV parses: one header row, quoted fields, no raw line breaks outside quotes.

### 8. Jira creation (optional)
Only if a Jira/Atlassian MCP tool is connected:
1. Ask for the project key and confirm issue types available (Epic, Story, Task, Sub-task).
2. Search for existing issues with the same `US-nn-mm` / summary to avoid duplicates.
3. Show a preview: counts, and the first epic and two stories exactly as they will be created.
4. Create only after an explicit "yes". Create epics first, then stories with the parent link,
   then issue links (`is blocked by`). Max 50 issues per batch.
5. Write the returned keys back into backlog.md (column `Jira key`).

Without a Jira tool, explain how to import the CSV (Jira: *Settings → System → External System
Import → CSV*, or the project's *Import issues*), mapping the columns as in
[references/jira-csv-import.md](references/jira-csv-import.md).

### 9. Report
Path(s), counts (epics, stories, points per epic), FR coverage %, stories flagged Not Ready and
why, feasibility hits, and next step: PO review, then `sdlc-solution-architect-agent`.

## Updating an existing backlog
Keep IDs. New stories take the next free `mm` in their epic. A changed AC gets a change note in the
story. Removed stories become `~~US-03-04~~ withdrawn (reason)`.
