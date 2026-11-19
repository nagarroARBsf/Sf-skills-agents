---
name: sdlc-architecture-diagram
description: "The one Salesforce architecture skill, design and diagrams together: baseline, High-Level Design, a Low-Level Design per story or Jira ticket, and ADRs, with Well-Architected and declarative-first rules; a component model (components.json) marking every component NEW, CHANGED, UNCHANGED or REMOVED; and every diagram drawn to Salesforce's own standard (Salesforce Diagrams) as an editable draw.io file, exported to PNG, SVG or PDF, plus a Mermaid text version. Capability maps, system landscapes, role hierarchies, solution architecture, process flows, roadmaps, release plans and data models, with Salesforce's 25 reference diagrams as picture references. TRIGGER when: user asks for solution architecture, HLD, LLD, the design or impact of a story or ticket, an ADR, ERD or data model, integration design, a baseline inventory, any architecture or draw.io diagram, or runs /sf-sdlc:architecture or /sf-sdlc:diagram. DO NOT TRIGGER when: user wants requirements, stories, test cases or code."
metadata:
  version: "3.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-architecture-diagram

Salesforce architecture in one place: **design** (baseline, HLD, LLD, ADR) and **diagrams**, drawn
the way Salesforce's own architects draw them. Every component carries a change status — New,
Changed, Unchanged or Removed — decided from a checked component model, never from memory.

## What to produce for the request

| The person asks for | Produce | Section |
|---|---|---|
| "Architecture", an HLD, a release design | Baseline, `components.json`, HLD with its diagrams, the list of stories that need an LLD | 1–6, 8 |
| A design for one story or Jira ticket ("how do we build US-04-02", "impact of PROJ-123") | The LLD for it, its solution view and, when objects change, its data model view | Fast path |
| One diagram (`/sf-sdlc:diagram landscape`, "draw the data model") | The spec, the `.drawio`, the PNG and the Mermaid text version | 9–12 |
| A decision ("Flow or Apex?", "platform events or CDC?") | An ADR | 3 |

Scope control: "architecture" means the baseline and the HLD plus the list of stories that need an
LLD. Write LLDs for the stories named, or for the whole release when asked; above about eight, work
in batches and report between batches.

## Inputs
- BRD (`docs/sdlc/01-brd/BRD.md`, including Appendix D, the indicative Salesforce outline) and
  backlog (`docs/sdlc/02-backlog/backlog.md`). Check their approval records; if not approved, say so
  and continue only when the person confirms. For a single ticket, the story and its acceptance
  criteria are enough (from the backlog, or from Jira when connected).
- Project config: `sf-sdlc config show --json` (`salesforce.*`, `orgs.*`,
  `deploy.pipeline`, `git.*`, `paths.docs`). Never hard-code what it defines.
- The Salesforce project itself. **Read it before designing**; reuse its objects, trigger framework,
  naming and utilities.
- Grounding: `docs/sdlc/00-grounding/ontology.yaml` and `feature-map.md` when present; the Metadata
  Grounding MCP tools when connected (say whether they were used).

## Outputs (under `docs/sdlc/03-architecture/`)
- `baseline/inventory.md` — [design/baseline-template.md](references/design/baseline-template.md)
- `components.json` — [components-schema.md](references/components-schema.md)
- `HLD.md` — [design/hld-template.md](references/design/hld-template.md)
- `LLD/US-nn-mm.md` — [design/lld-template.md](references/design/lld-template.md)
- `ADR/ADR-nnn-{slug}.md` — [design/adr-template.md](references/design/adr-template.md)
- `diagrams/<name>.diagram.json` (spec), `.drawio` (editable), `.png` (and `.svg`/`.pdf` on request)

All documents are drafts for review; only a person fills in an approval record.

---

## Part A — Design

### 1. Establish the baseline (mandatory, before any design)
1. `sf-sdlc detect --json` and `sf-sdlc inventory --json`. When
   the Metadata Grounding tools are connected, search the org by meaning (`search_metadata`,
   `describe_metadata`) before calling anything New: source misses what was built in Setup.
2. Classify the scope. **Greenfield**: no Salesforce source for this scope and a new or empty org;
   everything designed is New, standard objects used as they are are Unchanged, standard objects
   that gain fields or rules are Changed. **Brownfield**: the inventory is the baseline and every
   planned component is looked up in it. A project can be brownfield overall and greenfield for one
   domain; say which.
3. Write `baseline/inventory.md`: baseline reference (branch, commit, date), counts by type, the
   components in the affected area, the conventions found (trigger framework, naming prefix, test
   data factory, logging, API version), automation per object, known gaps.
4. Org-only components: when the person names a non-production org, enrich with
   `sf org list metadata --metadata-type <Type> --target-org <alias>`,
   `sf sobject describe --sobject <ApiName> --target-org <alias>` (or the read-only `sf-sobject-reads`
   MCP server when connected) and
   `sf package installed list --target-org <alias>`. Without an org, list "org-only components not
   verified" as a gap. Never query production unless the person names it.
5. Refresh the inventory when it is older than the latest commit on `git.integrationBranch`.

### 2. Understand
Index BRs, NFRs, constraints, integrations, personas and volumes from the BRD; stories, acceptance
criteria and feasibility notes from the backlog. BRD Appendix D is a set of leads to confirm or
overturn (with the reason), not decisions.

### 3. Decide
Choose the approach per capability with [design/decision-guides.md](references/design/decision-guides.md):
standard feature → configuration → declarative automation → Apex/LWC → AppExchange or off-platform.
Record hard-to-reverse, cross-story or contested choices — and every resolved feasibility hit — as
ADRs with options and consequences.

### 4. Build the component model
`components.json` holds one entry per component the solution creates, changes, removes or shows for
context (`apiName`, `type`, `status`, `story`, `layer`, `dependsOn`, `note`). Statuses follow
[change-status.md](references/change-status.md): planned and absent = new; planned and present =
changed; present, verified and shown for context = unchanged; present and to be deleted = removed.
**Never mark a component unchanged without having found it in the inventory or the org.** Once code
exists, reconcile with `sf-sdlc delta --from <git-ref> --json`; the delta wins.

### 5. Write the HLD
Fill every section of the template. Component tables carry the Change column from the model. The
HLD carries at least the **system landscape**, the **solution architecture** and the **data model**
diagrams; add a **capability map** for business readers, a **roadmap** or **release plan** when
delivery is phased, **process** diagrams for the key flows, and the **role hierarchy** when sharing
depends on it. Keep the story-to-design map complete: every story maps to components and an LLD (or
"no LLD needed — configuration only").

### 6. Write LLDs
Per story: metadata inventory with exact API names and status (they become `package.xml`, the
destructive manifest and the plan's Metadata Scope), field specs, logic design, diagrams, security,
limits, tests, deployment. For every Changed component say what changes and what must keep working;
for every Removed one the replacement, the data consequence and the destructive step. Map every
acceptance criterion to the design element that satisfies it; an AC without one is a gap.

### 7. Review against Well-Architected
Check with [design/well-architected-review.md](references/design/well-architected-review.md)
(Trusted, Easy, Adaptable, governor limits). Record trade-offs in the HLD.

### 8. Report
Paths; greenfield or brownfield and the baseline reference; counts of New, Changed, Unchanged and
Removed components; ADRs needing sign-off; stories whose design changes the story (raise them to the
PO); feasibility hits resolved and open; baseline gaps; diagrams generated, checked and exported (or
"image not exported" and why). Next: tech-lead review, then `/sf-sdlc:specify US-nn-mm` per story and
`/sf-sdlc:test-cases`. LLD sections 3–9 are written so `/sf-sdlc:plan` references them instead of
re-designing.

### Fast path: one story or Jira ticket
1. Read the story and its acceptance criteria (backlog, or Jira when connected) and the code it
   touches; make sure the baseline exists (step 1, at least for the affected objects).
2. Add or update the story's entries in `components.json`.
3. Generate its solution view:
   `sf-sdlc diagram drawio docs/sdlc/03-architecture/components.json --story US-nn-mm`,
   then refine the spec (pills that say what flows, connector kinds, attributes) and generate again.
   Add a data model view (`--type data-model`) when objects or fields change, and a process diagram
   when the story is an interaction between systems or people.
4. Write `LLD/US-nn-mm.md` (step 6) with the diagrams, and report (step 8).

---

## Part B — Diagrams

### 9. Choose the type
One message per diagram; if it needs two sentences, draw two. Never mix levels of detail.

| Salesforce type (`type`) | Answers | Level | Salesforce layout | Picture references |
|---|---|---|---|---|
| Capability map (`capability-map`) | What can the business do; which capabilities does this add, improve or retire? | 1 | Bands top to bottom: drivers → capabilities → products and platform | [capability-map/](references/salesforce-gallery/capability-map/) |
| System landscape (`system-landscape`) | Which systems exist and how do they connect? | 1 | Columns: external systems → integration hub → Salesforce; external systems shaded | [system-landscape/](references/salesforce-gallery/system-landscape/) |
| Role hierarchy (`system-landscape`, `layout: tree`) | Who reports to whom; who sees whose records? | 1–2 | Org chart, parents above children | [salesforce-role-hierarchy.png](references/salesforce-gallery/system-landscape/salesforce-role-hierarchy.png) |
| Solution architecture (`solution-architecture`) | Which components deliver this and what flows between them? | 2 | Products as containers; pills say what flows | [solution-architecture/](references/salesforce-gallery/solution-architecture/) |
| Interaction / process flow (`process`) | What happens, in what order, between whom? | 3 | Participants as tall columns; numbered steps; publish solid, subscribe dashed | [interaction-process-flow/](references/salesforce-gallery/interaction-process-flow/) |
| Roadmap (`roadmap`) | When does each capability, component or feature land, and on what does it depend? | — | Time grid with swimlanes; cards span their dates; dependencies written on cards | [roadmap/](references/salesforce-gallery/roadmap/) |
| Release plan (`roadmap`, `layout: stages`) | Who is involved in each delivery stage, in which environment? | — | Stage cards left to right with an environment footer | [generative-ai-release-plan.png](references/salesforce-gallery/roadmap/generative-ai-release-plan.png) |
| Data model (`data-model`) | Which objects and relationships exist; which fields change? | 4 | Entities with crow's-foot notation, coloured by focus cloud | Salesforce Data Model Gallery (link in the standard) |

The rules and notation behind each type: [salesforce-diagram-standard.md](references/salesforce-diagram-standard.md).

### 10. Look before you draw
Before drawing a type for the first time in a session, open with the Read tool (they are images):
1. **Salesforce's own diagrams of that type** — 25 in
   [salesforce-gallery/](references/salesforce-gallery/README.md), with notes on what to take from each.
2. **Our worked example of that type** — the render and its spec in [examples/](examples/):
   `capability-map`, `system-landscape`, `role-hierarchy`, `solution-architecture`, `process`,
   `roadmap`, `release-plan`, `data-model` (`.png` to look at, `.diagram.json` to start from).

Match their structure: header and key, grouping, card anatomy, connector style. Do not paste
Salesforce's images into project documents.

### 11. Draw it
1. **Model first.** Statuses come from `components.json`; never set one the model does not support.
2. **Write the spec** `docs/sdlc/03-architecture/diagrams/<name>.diagram.json` per
   [drawio-spec.md](references/drawio-spec.md). Solution and data model views start from the model
   (`diagram drawio components.json --story …` / `--type data-model`); the other types start from
   the example of that type.
3. **Generate**: `sf-sdlc diagram drawio docs/sdlc/03-architecture/diagrams/<name>.diagram.json`.
   Fix every error; read every warning.
4. **Check**: `sf-sdlc diagram check docs/sdlc/03-architecture/diagrams/<name>.drawio`.
5. **Export and look**: `sf-sdlc diagram export docs/sdlc/03-architecture/diagrams/<name>.drawio --format png`,
   open the PNG with the Read tool and compare it with the Salesforce reference and the
   [review checklist](references/diagram-review-checklist.md): text cut off, a pill on a card, a line
   through a card, a crowded column. Fix the spec (split the diagram, reorder groups so connectors join
   neighbouring columns, shorten pills) and generate again; stop after two rounds and report what is left.
   Without draw.io desktop, `export` says so: report "image not exported", keep the `.drawio` and the
   Mermaid block, and suggest installing draw.io (free) or opening the file in the VS Code Draw.io extension.
6. **Put it in the document**: `![<title>](diagrams/<name>.png)`, the one-sentence caption, a link to
   the `.drawio`, then the Mermaid text version ([mermaid-text-version.md](references/mermaid-text-version.md)).

Never hand-place coordinates or hand-write the XML of a new diagram: the generator lays out, routes
connectors through the gaps between columns and applies Salesforce's styling. Lasting changes go in
the spec. To polish or repair a `.drawio` someone drew by hand, or to turn a screenshot, Terraform,
SQL or OpenAPI into a diagram, use the `drawio-skill` when installed (`/drawio-skill`; agents read
its `SKILL.md` and run its scripts with Python 3) and [drawio-authoring.md](references/drawio-authoring.md).

### 12. Salesforce rules every diagram follows
1. **Header**: a title read at a glance and a one-sentence description of message, scope and purpose;
   at least 10% of the height and the full width; description at least half the title size.
2. **Reading order**: left to right, top to bottom; users and entry points first, data and external
   systems last.
3. **Cards** for every property: title, then a rule, attributes, footer (package, owner, capability,
   environment) and footer icons. Containers are cards that hold cards.
4. **Connectors**: elbow lines, straight where possible; the line style names the kind of connection
   and the key explains it; pills say what flows in a few words; process steps are numbered.
5. **Key** whenever colour, line style, icons, shading or a badge carry meaning, in even rows.
6. **Icons** only from draw.io's Salesforce library; footer icons explained in the key.
7. **Contrast**: text and background at least 50 points apart in the Salesforce colour system (4.5:1).
8. **Real names**: components by API name, systems by the client's name, capabilities in business
   words. Never "Controller", "Service" or "Component" alone.
9. **Size**: at most 25 cards; split by domain, layer or story and add an overview.
10. **Change status** on every card, from the model ([change-status.md](references/change-status.md)).

### 13. Accessibility
Colour is never the only signal (badge, prefix and border repeat it). Under every diagram, the caption
and, for larger changes, a short list of what is new, changed and removed; the Mermaid block is the
text version. Export a PDF when sharing outside the team (Salesforce: best for screen readers).

### 14. Check before delivering
Run [diagram-review-checklist.md](references/diagram-review-checklist.md). Report what was generated,
checked and exported, and what was not.

## Technical skills
Design draws on Flow, Apex, LWC, security and integration knowledge. When an installed skill under
`.claude/skills/` covers the area (data model, permission sets, Flow, Apex, LWC, integration), use it
for the detail; when it is missing, design from the references here and say `/sf-sdlc:skills` can install it.
