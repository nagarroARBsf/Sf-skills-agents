---
name: sdlc-architecture-diagram
description: "Draw Salesforce architecture diagrams to Salesforce's own standard (Salesforce Diagrams): header with title, description and key; cards with icon, title, attributes and footer; containers; elbow connectors with pills; the data model notation. Each diagram is an editable draw.io file generated from a JSON spec with draw.io's built-in Salesforce icons, exported to PNG, SVG (animated connectors) or PDF, plus a Mermaid text version. Covers capability map, system landscape, solution architecture, roadmap, interaction/process/flow and data model, and marks every component NEW, CHANGED, UNCHANGED or REMOVED from components.json. TRIGGER when: user asks for an architecture, landscape, solution, data model, ERD, process, capability or roadmap diagram, a draw.io diagram, a before/after or impact diagram, or runs /sf-sdlc:diagram; or another sdlc-* skill needs a diagram. DO NOT TRIGGER when: the user wants the design document itself (use sdlc-solution-architecture-generate) or a chart of numeric data."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-architecture-diagram

A diagram in this lifecycle answers two questions at once: **how does it fit together** and
**what does this change touch**. It is drawn the way Salesforce architects draw (the Salesforce
Diagrams standard), it carries a change-status overlay, and every status comes from a checked
component model, never from memory.

## Inputs
- The component model `docs/sdlc/03-architecture/components.json` (under `paths.docs`).
  If it is missing, build it first (section 4).
- The scope: a release, an epic, a story (`US-nn-mm`) or a domain, and the question the diagram
  must answer.
- For brownfield work: `docs/sdlc/03-architecture/baseline/inventory.md`.

## Outputs (per diagram)
1. **The Salesforce-standard diagram** in `docs/sdlc/03-architecture/diagrams/`:
   `<name>.diagram.json` (the spec: the editable source), `<name>.drawio` (generated, opens in
   draw.io), `<name>.png` (for documents, Jira, Confluence) and, when asked, `<name>.svg`
   (animated connectors) or `<name>.pdf` (screen readers; sharing outside the team).
2. **In the Markdown document** (HLD, LLD, plan section 5): the PNG
   (`![<title>](diagrams/<name>.png)`), the one-sentence caption, a link to the `.drawio`, and a
   Mermaid block as the text version (renders on GitHub, diffs in review, and is the fallback when
   no image could be exported).
3. An updated `components.json` when the diagram exposed a missing or wrong entry.

## 1. Choose the diagram type

Pick the type from the question, not from habit. One message per diagram; if it needs two
sentences to state, draw two diagrams. Salesforce orders the types from big picture to detail
(levels 1 to 4); never mix levels in one diagram.

| Type (`type`) | Answers | Audience | Level | Mermaid text version |
|---|---|---|---|---|
| Capability map (`capability-map`) | What can the business do, and which capabilities does this work add or improve? | Sponsors, BAs | 1 | `flowchart TB`, subgraph per domain |
| System landscape (`system-landscape`) | Which systems exist and what flows between them? | Architects, integration and security teams | 1 | `flowchart LR` |
| Solution architecture (`solution-architecture`) | Which platform components deliver this and how do they depend on each other? | Tech lead, developers, reviewers | 2 | `flowchart LR`, subgraph per layer |
| Roadmap (`roadmap`) | When does each capability or component land, and what does it depend on? | Sponsors, release owner | — | `flowchart LR`, subgraph per release |
| Interaction / process / flow (`process`) | What happens, in what order, between whom? | Developers, QA, BAs | 3 | `sequenceDiagram` or `flowchart` |
| Data model (`data-model`) | Which objects and relationships exist, and which fields change? | Developers, data and reporting teams | 4 | `flowchart LR` with status; `erDiagram` otherwise |

The rules, layouts and notation Salesforce uses for each type:
[references/salesforce-diagram-standard.md](references/salesforce-diagram-standard.md).

## 2. Look at the picture references first

Before drawing a type for the first time in a session, open its example render with the Read tool
(it is an image) and its spec:

| Type | Picture | Spec |
|---|---|---|
| Capability map | [examples/capability-map.png](examples/capability-map.png) | [capability-map.diagram.json](examples/capability-map.diagram.json) |
| System landscape | [examples/system-landscape.png](examples/system-landscape.png) | [system-landscape.diagram.json](examples/system-landscape.diagram.json) |
| Solution architecture | [examples/solution-architecture.png](examples/solution-architecture.png) | [solution-architecture.diagram.json](examples/solution-architecture.diagram.json) |
| Roadmap | [examples/roadmap.png](examples/roadmap.png) | [roadmap.diagram.json](examples/roadmap.diagram.json) |
| Interaction / process | [examples/process.png](examples/process.png) | [process.diagram.json](examples/process.diagram.json) |
| Data model | [examples/data-model.png](examples/data-model.png) | [data-model.diagram.json](examples/data-model.diagram.json) |

Then open Salesforce's own diagrams of that type: nine of them are in
[references/salesforce-gallery/](references/salesforce-gallery/README.md) (capability maps,
solution architectures, a process flow), with notes on what to take from each. They are references
for structure and style; do not paste them into project documents.

For work the spec generator does not cover — editing an existing `.drawio` someone drew by hand,
turning a screenshot or whiteboard photo into a diagram, diagrams from Terraform, SQL or OpenAPI —
use the `drawio-skill` when it is installed in `.claude/skills/` (setup installs it; it needs
Python 3). A person starts it with `/drawio-skill`; an agent reads its `SKILL.md` and references and
runs its scripts directly. Salesforce diagrams still go through the spec and `sf-sdlc diagram drawio`.

## 3. Draw it

1. **Update the model first.** Statuses come from `components.json` (section 4). Never set a status
   in a spec that the model does not support.
2. **Write the spec** in `docs/sdlc/03-architecture/diagrams/<name>.diagram.json`, following
   [references/drawio-spec.md](references/drawio-spec.md):
   - Solution architecture and data model: generate it from the model, then refine it:
     `sf-sdlc diagram drawio docs/sdlc/03-architecture/components.json --story US-04-02`
     (`--type data-model` for the ERD). Add pills that say what flows, connector kinds, icons,
     logical names and relationship kinds, then generate again from the spec.
   - Capability map, landscape, roadmap and process: write the spec, starting from the example of
     that type.
3. **Generate**: `sf-sdlc diagram drawio docs/sdlc/03-architecture/diagrams/<name>.diagram.json`.
   Fix every error it reports; read every warning.
4. **Check**: `sf-sdlc diagram check docs/sdlc/03-architecture/diagrams/<name>.drawio`.
5. **Export and look**: `sf-sdlc diagram export docs/sdlc/03-architecture/diagrams/<name>.drawio --format png`,
   then open the PNG with the Read tool and check it against the review checklist: text cut off,
   pills on top of cards, lines crossing cards, a crowded column. Fix the spec (split the diagram,
   reorder groups so connectors join neighbouring columns, shorten labels, move a card to another
   group) and generate again. Stop after two rounds and report what is left.
   If draw.io desktop is not installed, `export` says so: report "image not exported", keep the
   `.drawio` and the Mermaid block, and suggest installing draw.io (free) or opening the file in
   the VS Code Draw.io extension.
6. **Put it in the document** as described in Outputs, with the caption and the text version.

Do not hand-write the XML of a new diagram and do not place coordinates. Hand edits to a `.drawio`
are lost when it is generated again; put lasting changes in the spec
([references/drawio-authoring.md](references/drawio-authoring.md) covers the rare exception).

## 4. Salesforce diagram rules (both forms)

1. **Header.** A title that reads at a glance, and a one-sentence description of message, scope
   and purpose. The spec's `title`/`description`; in Mermaid the `title` front matter, `accTitle`,
   `accDescr` and the caption.
2. **Reading order.** Left to right, top to bottom. Users and entry points first, data and external
   systems last.
3. **Cards.** Every property is a card with a title; attributes for details; the footer for
   package, owner or capability. Icons from draw.io's Salesforce library only (no logos pasted in
   as images, no emoji). Mermaid nodes stay text-only.
4. **Connectors.** Elbow lines; the line style says the kind of connection, and the key explains
   every style used. Pills say what flows, in a few words. Process steps are numbered.
5. **Key.** Whenever colour, line style, icons or a badge carry meaning — in this kit always.
6. **Contrast.** Text and its background at least 50 points apart in the Salesforce colour system
   (4.5:1). The generator's palette meets this; do not override colours.
7. **One level of detail.** Do not mix systems and fields, or capabilities and classes.
8. **Real names.** Components by API name; systems by the name the client uses; capabilities in
   business words. Never "Controller", "Service" or "Component" on its own.
9. **Size.** At most 25 cards per diagram. Above that, split by domain, layer or story and add an
   overview diagram.

## 5. The change-status overlay

Status is carried several ways at once, so it survives greyscale printing, colour-blind readers,
screen readers and renderers that drop styles:

| Status | draw.io card | Badge (card footer) | Mermaid class | Mermaid prefix |
|---|---|---|---|---|
| New | Green border | `NEW · US-nn-mm` | `new` | `[NEW]` |
| Changed | Amber dashed border | `CHANGED · US-nn-mm` | `changed` | `[CHG]` |
| Unchanged | Grey border, no badge | — | `unchanged` | none |
| Removed | Red dotted border, title struck through | `REMOVED · US-nn-mm` | `removed` | `[DEL]` |

In a data model the border shows the entity kind (the Salesforce notation), so status is carried by
the badge, the strike-through and the relationship colour (relationships the change adds are drawn
in the focus-cloud colour).

Connectors: `removed` if either end is removed; otherwise `new` if either end is new; otherwise
`changed` only when the dependency itself is what changes (recorded in the component's `note`);
otherwise unchanged. Labelled connectors get the prefix in their pill; new and changed lines are
drawn thicker.

Mermaid palette (use exactly; the Key subgraph with all four statuses is mandatory in flowcharts):

```text
classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
```

Mermaid edges: a new, changed or removed relationship carries the prefix in its label and a
`linkStyle` (zero-based, in written order; `A --> B --> C` is two edges; recount after every edit):

```text
linkStyle <n> stroke:#15803d,stroke-width:2px
linkStyle <n> stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3
linkStyle <n> stroke:#b91c1c,stroke-width:2px,stroke-dasharray:2 2
```

`sequenceDiagram` has no classes: prefix participants and messages, put a `rect` with the status
fill around new or changed interactions, and a `Note over` line as the Key. Subgraphs and groups
(layers, systems, releases) are containers and carry no status.

## 6. Determine status

Never assign a status from the story text alone.

**Greenfield** (no existing Salesforce source for this scope, new org): every component the
design creates is `new`. Standard objects, standard fields and platform services the solution
uses but does not modify (for example `Account`, the standard `Name` field, Lightning Data
Service) are `unchanged`; a standard object that receives custom fields, validation rules or
record types is `changed`. Record "greenfield" and the evidence in `baseline/inventory.md`.

**Brownfield** (an existing project or org):
1. Baseline: `sf-sdlc inventory --json` lists what the source tree contains
   today. Its summary is saved as `baseline/inventory.md`.
2. Design time (nothing built yet): for each planned component, look it up in the inventory.
   Planned and absent = `new`. Planned and present = `changed`. Present, not planned to change,
   but shown for context = `unchanged`. Planned for deletion and present = `removed`.
3. Once code exists: `sf-sdlc delta --from <git-ref> --json` buckets components
   as new, changed and removed against the ref (the integration branch from `git.integrationBranch`,
   or the release baseline tag). Reconcile `components.json` with it; where they disagree, the
   delta is right and the design document is corrected.
4. Org-only components (created in Setup, never retrieved) do not appear in the inventory. When
   an org is connected, enrich with `sf org list metadata --metadata-type <Type> --target-org <alias>`
   and `sf sobject describe --sobject <ApiName> --target-org <alias>`. Record the source of each
   such entry in its `note`. Never query a production org without the user naming it.
5. **Never mark a component `unchanged` without having found it in the inventory or the org.**
   If it could not be checked, it is not drawn as unchanged: ask, or state the gap in the caption.

A parent takes `changed` when a child changes: adding a field to `Opportunity` makes the
`Opportunity` card changed, with the new fields listed as attributes (`+ Field__c`).

## 7. The component model

`components.json` is the single source of truth for status. Diagrams, the HLD component tables,
the LLD metadata inventory and the plan's Metadata Scope all read from it. Schema and example:
[references/components-schema.md](references/components-schema.md). Each entry: `apiName`,
`type` (Metadata API type name), `status`, `story`, `layer`, `dependsOn[]`, `note`.

Update the model first, then the specs, then regenerate; never hand-edit a status in a diagram.

## 8. The Mermaid text version

Worked Mermaid examples for all six types, with the overlay:
[references/diagram-templates.md](references/diagram-templates.md). Syntax rules:
- Quote every label: `A["[NEW] Deal_Review__c"]`; line breaks with `<br/>`.
- Node IDs: letters and digits, starting with a letter, derived from the API name; never `end`.
- Edge labels quoted: `A -->|"[NEW] publishes"| B`.
- No `architecture-beta`, `C4Context` or other experimental types; no `click`, no HTML other than
  `<br/>`, no icons or images.
- `classDef` lines after nodes and edges; `linkStyle` lines last.
- `erDiagram`, `classDiagram`, `stateDiagram-v2` and `gantt` cannot carry the overlay: use them only
  for views with no change status
  (`${CLAUDE_PLUGIN_ROOT}/skills/sdlc-solution-architecture-generate/references/mermaid-patterns.md`).
- SVG of a Mermaid block: `sf-sdlc diagram render <file>` (needs mermaid-cli).

## 9. Accessibility

- Colour is never the only signal: the badge, prefix and border style repeat it.
- Under every diagram, the caption and, for diagrams with more than a few changes, a short text
  list of what is new, changed and removed. A reader who cannot see the diagram gets the same
  message; the Mermaid block is the text version.
- For sharing outside the team, export a PDF as well (Salesforce: PDF is the best format for
  screen readers).

## 10. Check before delivering

Run [references/diagram-review-checklist.md](references/diagram-review-checklist.md). Report what
was generated, checked and exported, and what was not ("image not exported: draw.io desktop not
installed" is acceptable; implying an image that does not exist is not).
