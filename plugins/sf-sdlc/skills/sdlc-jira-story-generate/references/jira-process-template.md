# Jira process — {project.name}

> **This file is meant to be replaced by your team's own.** Copy it into the project with
> `sf-sdlc templates copy jira/jira-process-template.md` (it lands in
> `docs/sdlc/templates/jira/`, or under `paths.templates`), then edit it: your issue hierarchy, your
> workflow, your Definition of Ready and Done, your sprint cycle and your custom fields. The
> `sdlc-jira-story-generate` skill reads your copy before writing a backlog and follows it over its
> own defaults. You can describe any framework here — Scrum, Kanban, SAFe (Epic → Feature → Story),
> or a client's own — as long as it is written down.
>
> Rules for this file: values here describe *how the team works*. Project-specific identifiers
> (project key, field IDs, transition names the tools call) stay in `.claude/sf-sdlc.json` (`jira.*`)
> so the hooks and CLI can read them. When the two disagree, the skill stops and asks.

## 1. Framework
| Item | Value |
|---|---|
| Framework | Scrum <!-- Scrum, Kanban, SAFe, Scrumban, client framework: name it --> |
| Sprint length | 2 weeks <!-- or "n/a" for Kanban --> |
| Release cadence | Every 2 sprints <!-- or per Salesforce release window, monthly, on demand --> |
| Estimation | Story points, Fibonacci 1, 2, 3, 5, 8 (13 = must split) <!-- or T-shirt, hours, none --> |
| Max story size | 8 points |

## 2. Issue hierarchy
Top to bottom. The skill creates the levels marked **Created by the kit**; the others are referenced
when they already exist.

| Level | Jira issue type | Created by the kit | Kit ID | Parent link |
|---|---|---|---|---|
| Initiative / Theme | Initiative | No | — | — |
| Epic | Epic | Yes | `EPIC-nn` | Initiative (optional) |
| Feature <!-- SAFe only; delete the row otherwise --> | Feature | No | — | Epic |
| Story | Story | Yes | `US-nn-mm` | Epic (or Feature) |
| Technical enabler | Task <!-- or "Story with label Enabler" --> | Yes | `US-nn-mm` + label `Enabler` | Epic |
| Sub-task | Sub-task | No <!-- the team breaks stories down in refinement --> | — | Story |
| Bug | Bug | By the QA stage, after a yes | `DEF-nnn` | Story |

## 3. Workflow (statuses and transitions)
| Status | Meaning | Entered by | Exit rule |
|---|---|---|---|
| Backlog | Written, not refined | Kit (on create) | Refined, estimated |
| Ready for Dev | Definition of Ready met | Product owner | Developer picks it up |
| In Progress | Being built | Developer | PR opened |
| In Review | Code review | Developer | Review verdict Approve |
| Ready for QA | Deployed to the QA org | Release engineer | QA run complete |
| In QA | Being tested | QA | Exit criteria met, or defect raised |
| Done | Definition of Done met | Product owner | — |

Transition names the tools call are in `jira.transitions` in `.claude/sf-sdlc.json`. The kit never
transitions an issue without a preview and an explicit yes.

## 4. Definition of Ready (a story may be marked Ready only when all hold)
- [ ] Persona, outcome and benefit stated; traces to `BR-nn / FR-nn.m` or labelled `Enabler`.
- [ ] At least 3 Gherkin acceptance criteria, including 1 negative, with concrete values.
- [ ] No open question (`Q-nn`) blocks it; feasibility notes resolved or accepted by the architect.
- [ ] Estimated; ≤ max story size.
- [ ] Dependencies linked (`is blocked by`).
- [ ] Test data and personas known.

## 5. Definition of Done
- [ ] Spec, plan and tasks approved (`specs/<story>/`), or "trivial change, no spec" recorded.
- [ ] Code reviewed: verdict Approve (or conditions met) in `review.md`.
- [ ] Code Analyzer clean at the project's blocking severity; coverage at or above the target.
- [ ] Deployed to QA with a `DEP-nnn` record; test cases passed in a `TR-…` run; no open Blocker/Major defect.
- [ ] Documentation and feature map updated; release notes entry written.
- [ ] Product owner accepted.

## 6. Story format
<!-- Replace with your house format if it differs; the skill keeps the kit's trace IDs in the summary
and labels so later stages can still find the issue. -->
- Summary: `US-nn-mm <short outcome>`
- Description sections, in order: User story · Context and business rules · Acceptance criteria ·
  Feasibility notes · Out of scope · Source
- Acceptance criteria: Gherkin (`Given / When / Then`), numbered `AC-1..n`
- Labels: trace IDs (`US-nn-mm`, `BR-nn`), Salesforce story type, plus the team's labels

## 7. Fields
| Field | Required on create | Source | Notes |
|---|---|---|---|
| Story points | Yes | backlog estimate | Field ID in `jira.fields.storyPoints` |
| Acceptance criteria | Yes | story ACs | Field ID in `jira.fields.acceptanceCriteria`, or in the description |
| Components | No | Salesforce story type | <!-- e.g. Apex, LWC, Flow, Data Model --> |
| Fix version | No | release slice | Set by the release stage, after a yes |
| Team / Squad | No | — | <!-- add custom fields your project requires, with their meaning --> |

## 8. Ceremonies and cycle (for planning the slices)
| Ceremony | When | What the kit's output feeds |
|---|---|---|
| Backlog refinement | Weekly | `backlog.md`: stories flagged Not Ready, feasibility hits |
| Sprint planning | Sprint start | Release slicing, dependency graph, estimates |
| Sprint review / demo | Sprint end | Test runs (`TR-…`), release notes draft |
| Retrospective | Sprint end | `DEF-nnn` "Constraint added" entries |
