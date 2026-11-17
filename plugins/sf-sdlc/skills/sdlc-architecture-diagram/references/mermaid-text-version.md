# The Mermaid text version

Every diagram in a document has a Mermaid block under its image: it renders on GitHub, diffs in
review, is the text alternative for readers who cannot see the image, and is the fallback when no
image could be exported. It carries the same status overlay ([change-status.md](change-status.md)).
Worked examples for all six types: [diagram-templates.md](diagram-templates.md); patterns for
views without change status: [design/mermaid-patterns.md](design/mermaid-patterns.md).

## Syntax rules

- Quote every label: `A["[NEW] Deal_Review__c"]`; line breaks with `<br/>`.
- Node IDs: letters and digits, starting with a letter, derived from the API name; never `end`.
- Edge labels quoted: `A -->|"[NEW] publishes"| B`.
- No `architecture-beta`, `C4Context` or other experimental types; no `click`, no HTML other than
  `<br/>`, no icons or images.
- `classDef` lines after nodes and edges; `linkStyle` lines last.
- `erDiagram`, `classDiagram`, `stateDiagram-v2` and `gantt` cannot carry the overlay: use them only
  for views with no change status ([design/mermaid-patterns.md](design/mermaid-patterns.md)).
- SVG of a Mermaid block: `sf-sdlc diagram render <file>` (needs mermaid-cli).

