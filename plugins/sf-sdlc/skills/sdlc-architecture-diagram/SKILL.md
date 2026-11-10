---
name: sdlc-architecture-diagram
description: "Draw Salesforce architecture diagrams in Mermaid that show which components are NEW, CHANGED, UNCHANGED or REMOVED. Covers the six Salesforce diagram types (capability map, system landscape, solution architecture, roadmap, interaction/process/flow, data model), Salesforce diagram rules (one message per diagram, title and description, consistent flow, a Key, contrast, text-only cards), a change-status overlay carried by class, label prefix and a mandatory Key, and a component model (components.json) that diagrams are generated from. Explains how to determine status for greenfield and brownfield projects and how to render SVG for Jira or Confluence. TRIGGER when: user asks for an architecture, landscape, solution, data model, process or roadmap diagram, a before/after or impact diagram, or runs /sf-sdlc:diagram; or another sdlc-* skill needs a diagram. DO NOT TRIGGER when: the user wants the design document itself (use sdlc-solution-architecture-generate) or a chart of numeric data."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-architecture-diagram

A diagram in this lifecycle answers two questions at once: **how does it fit together** and
**what does this change touch**. Every diagram therefore carries a change-status overlay, and
every status comes from a checked component model, never from memory.

## Inputs
- The component model `docs/sdlc/03-architecture/components.json` (under `paths.docs`).
  If it is missing, build it first (see "Determine status").
- The scope: a release, an epic, a story (`US-nn-mm`) or a domain, and the question the diagram
  must answer.
- For brownfield work: `docs/sdlc/03-architecture/baseline/inventory.md`.

## Outputs
- A Mermaid block inside the document that asked for it (HLD, LLD, plan section 5, release notes).
- Optionally an SVG next to the document: `sf-sdlc diagram render <file>`.
- Updated `components.json` when the diagram exposed a missing or wrong entry.

## 1. Choose the diagram type

Pick the type from the question, not from habit. Salesforce's diagram guidance orders them from
big picture to detail.

| Type | Answers | Audience | Mermaid type | Nodes are |
|---|---|---|---|---|
| Capability map | What can the business do, and which capabilities does this work add or improve? | Sponsors, BAs | `flowchart TB`, one subgraph per domain | Business capabilities (no API names) |
| System landscape | Which systems exist and what flows between them? | Architects, integration and security teams | `flowchart LR` | Systems, orgs, clouds, user groups |
| Solution architecture | Which platform components deliver this and how do they depend on each other? | Tech lead, developers, reviewers | `flowchart TB` or `LR`, one subgraph per layer | Metadata components by API name |
| Roadmap | In which release does each change land? | Sponsors, release owner | `flowchart LR`, one subgraph per release | Capabilities or components |
| Interaction / process / flow | What happens, in what order, between whom? | Developers, QA, BAs | `sequenceDiagram` (who calls whom) or `flowchart` (business steps) | Participants or steps |
| Data model | Which objects and relationships exist, and which fields change? | Developers, data and reporting teams | `flowchart LR` when status is shown; `erDiagram` otherwise | Objects (changed fields listed in the label) |

`erDiagram`, `classDiagram`, `stateDiagram-v2` and `gantt` cannot carry the full overlay. Use
them only for views with no change status (patterns in
`${CLAUDE_PLUGIN_ROOT}/skills/sdlc-solution-architecture-generate/references/mermaid-patterns.md`), and use
`flowchart` whenever status styling is needed.

## 2. Salesforce diagram rules

1. **One message per diagram.** State the question it answers in one sentence. If it needs two
   sentences, draw two diagrams.
2. **Header.** A title and a one-sentence description: Mermaid `title` front matter plus
   `accTitle` / `accDescr`, and the same sentence as a caption under the block.
3. **Consistent flow.** Left-to-right or top-to-bottom, one direction per diagram. Users and
   entry points first, data last.
4. **Key.** Whenever colour, line style or a prefix carries meaning, the diagram has a Key. In
   this skill that is always.
5. **Contrast.** Text must be readable on its fill in light and dark themes: use the palette
   below unchanged, with its explicit text colours.
6. **Text-only cards.** Plain rectangles with names. No Salesforce logos, product icons, clouds
   or emoji. Shapes may distinguish kinds (`[("…")]` data store, `[["…"]]` event), never status.
7. **One level of detail.** Do not mix systems and fields in one diagram.
8. **Real names.** Components are labelled with their API name; systems with the name the client
   uses. Never "Controller", "Service" or "Component" on its own.

## 3. The change-status overlay

Status is carried **three ways at once**, so it survives greyscale printing, colour-blind
readers, screen readers and renderers that drop styles:

| Status | Class | Label prefix | Meaning |
|---|---|---|---|
| New | `new` | `[NEW]` | Does not exist before this change |
| Changed | `changed` | `[CHG]` | Exists and is modified by this change |
| Unchanged | `unchanged` | none | Exists, verified against the inventory, not modified; shown for context |
| Removed | `removed` | `[DEL]` | Exists and is deleted or retired by this change |

Use this palette exactly; do not adjust colours per diagram:

```text
classDef new fill:#dcfce7,stroke:#15803d,stroke-width:2px,color:#14532d
classDef changed fill:#fef3c7,stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3,color:#78350f
classDef unchanged fill:#f1f5f9,stroke:#94a3b8,color:#334155
classDef removed fill:#fee2e2,stroke:#b91c1c,stroke-dasharray:2 2,color:#7f1d1d
```

Rules:
- Every node has exactly one status class: `OPP["[CHG] Opportunity"]:::changed`.
- The **Key subgraph is mandatory** in every flowchart, with one sample node per status used in
  the project palette (all four; it is the same Key everywhere).
- Edges: a new, changed or removed relationship carries the prefix in its label and a
  `linkStyle` with the status stroke. `linkStyle` uses the zero-based order in which edges are
  written; a chained line `A --> B --> C` is two edges. Count again after every edit.

```text
linkStyle <n> stroke:#15803d,stroke-width:2px
linkStyle <n> stroke:#b45309,stroke-width:2px,stroke-dasharray:6 3
linkStyle <n> stroke:#b91c1c,stroke-width:2px,stroke-dasharray:2 2
```

- Edge status: `removed` if either end is removed; otherwise `new` if either end is new;
  otherwise `changed` only when the dependency itself is what changes (recorded in the
  component's `note`); otherwise unchanged and unstyled.
- `sequenceDiagram` has no classes: use the prefix on participants and messages, a `rect` with
  the status fill around new or changed interactions, and a `Note over` line as the Key.
- Subgraphs (layers, systems, releases) are containers and carry no status.

## 4. Determine status

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
`Opportunity` node changed, with the new fields listed in its label as `+ Field__c`.

## 5. The component model

`components.json` is the single source of truth for status. Diagrams, the HLD component tables,
the LLD metadata inventory and the plan's Metadata Scope all read from it. Schema and example:
[references/components-schema.md](references/components-schema.md).

Each entry: `apiName`, `type` (Metadata API type name), `status`, `story`, `layer`,
`dependsOn[]`, `note`.

To generate a diagram: filter entries by scope (story, layer or domain); add the unchanged
neighbours needed for context (direct dependencies only); create one node per entry with its
prefix and class; create one edge per `dependsOn`; group by `layer`; append the Key and the
`classDef` and `linkStyle` lines. Update the model first, then redraw; never hand-edit a status
in a diagram.

## 6. Limits and syntax

- At most 25 nodes per diagram, Key excluded. Above that, split by domain, layer or story and
  add an overview diagram that links them.
- Quote every label: `A["[NEW] Deal_Review__c"]`. Line breaks with `<br/>`.
- Node IDs: letters and digits only, starting with a letter. Derive from the API name
  (`Deal_Review__c` -> `DealReviewC`). Never `end`.
- Edge labels quoted: `A -->|"[NEW] publishes"| B`.
- No `architecture-beta`, `C4Context` or other experimental types; no `click`, no HTML other
  than `<br/>`, no icons or images.
- Keep the `classDef` lines at the end of the block, `linkStyle` lines last.

## 7. Accessibility

- Colour is never the only signal: the prefix and the border style repeat it.
- Add `accTitle` and `accDescr` so screen readers announce the diagram.
- Under every diagram, write the caption and, for diagrams with more than a few changes, a short
  text list of what is new, changed and removed. A reader who cannot see the diagram must get
  the same message.

## 8. Rendering

Mermaid in Markdown renders in most Git hosts and editors. For Jira, Confluence, slides or PDF:
`sf-sdlc diagram render <file>` writes an SVG per Mermaid block (it needs
mermaid-cli; if `doctor` reports it missing, say so and leave the Mermaid source in place).
Attach the SVG and keep the Mermaid block as the editable source. Never paste a screenshot.

## 9. Check before delivering

Run [references/diagram-review-checklist.md](references/diagram-review-checklist.md). Worked
examples for all six types, with the overlay:
[references/diagram-templates.md](references/diagram-templates.md).
