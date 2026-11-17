# Change status: overlay and how to determine it

Every component on every diagram and in every design table carries one status: New, Changed,
Unchanged or Removed. This file says how each form shows it and how to decide it.

## The overlay

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

## Determine status

Never assign a status from the story text alone.

**Greenfield** (no existing Salesforce source for this scope, new org): every component the
design creates is `new`. Standard objects, standard fields and platform services the solution
uses but does not modify (for example `Account`, the standard `Name` field, Lightning Data
Service) are `unchanged`; a standard object that receives custom fields, validation rules or
record types is `changed`. Record "greenfield" and the evidence in `baseline/inventory.md`.

**Brownfield** (an existing project or org):
1. Baseline: `node .claude/bin/sf-sdlc inventory --json` lists what the source tree contains
   today. Its summary is saved as `baseline/inventory.md`.
2. Design time (nothing built yet): for each planned component, look it up in the inventory.
   Planned and absent = `new`. Planned and present = `changed`. Present, not planned to change,
   but shown for context = `unchanged`. Planned for deletion and present = `removed`.
3. Once code exists: `node .claude/bin/sf-sdlc delta --from <git-ref> --json` buckets components
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

