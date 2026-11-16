# Diagram review checklist

Run on every diagram before it goes into a document. A failed item is fixed, not explained away.

## Message and type
- [ ] The diagram answers one question, stated in its description and caption in one sentence.
- [ ] The type matches the question (capability map, system landscape, solution architecture,
      roadmap, interaction/process/flow, data model).
- [ ] One level of detail: systems are not mixed with fields, capabilities not with classes.
- [ ] The header has a short title and a one-sentence description (spec `title`, `description`;
      Mermaid `title`, `accTitle`, `accDescr`).

## Salesforce standard (draw.io diagram)
- [ ] Generated from a spec in `docs/sdlc/03-architecture/diagrams/`; no hand-placed coordinates.
- [ ] `sf-sdlc diagram drawio` reported no errors; every warning was read and either fixed or is
      stated in the report.
- [ ] `sf-sdlc diagram check` reports no problems.
- [ ] Reads left to right, top to bottom; users and entry points first, data and external systems
      last; groups ordered so most connectors join neighbouring columns.
- [ ] At most 25 cards. Larger scopes are split, with an overview diagram.
- [ ] Groups are layers, systems, domains, periods or lanes — never statuses.
- [ ] Every connector has the right kind (sync, async, data, user, flow, dependency; lookup,
      lookup-required, master-detail, many-to-many in data models), and its direction runs from
      the caller, publisher, source or child.
- [ ] Pills say what flows in a few words. Process steps are written in order (they are numbered).
- [ ] Roadmap: no connectors; dependencies are written on the cards; every card sits in its period
      and lane.
- [ ] Data model: logical name as title, API name as subtitle, `#` key and `•` other attributes,
      entity kinds set (cloud object, related, extended, external, record type, conceptual).
- [ ] Icons only from the Salesforce icon list; footer icons explained in `legend`.
- [ ] Exported and **looked at** (PNG opened with the Read tool): no text cut off, no pill on top of
      a card, no line through a card, no crowded column. If draw.io desktop is missing, the report
      says "image not exported".

## Change-status overlay
- [ ] Every card's `status` comes from `components.json`; the diagram and the model agree.
- [ ] New, changed and removed cards carry the story in their badge (`story`).
- [ ] The key shows the four statuses (the generator adds it when any card is not unchanged).
- [ ] Mermaid: every node has exactly one of the classes `new`, `changed`, `unchanged`, `removed`,
      and the matching prefix (`[NEW]`, `[CHG]`, `[DEL]`; none for unchanged).
- [ ] Mermaid: the Key subgraph is present with all four statuses; the four `classDef` lines match
      the standard palette character for character.
- [ ] Mermaid: new, changed and removed edges have the prefix in their label and a `linkStyle`;
      indices were recounted after the last edit (zero-based, in written order, chained edges
      counted separately).
- [ ] In a `sequenceDiagram`: prefixes on participants and messages, `rect` around new or
      changed interactions, and a `Note over` Key.

## Truth of the statuses
- [ ] Every `unchanged` card was found in the baseline inventory or in the org. None is assumed.
- [ ] No component that exists in the inventory is marked `new`.
- [ ] A parent whose child changes is marked `changed`, and the changed children are listed.
- [ ] Every `removed` card appears in the deployment notes as a destructive change.
- [ ] Greenfield or brownfield is stated in the document, with the baseline reference
      (commit or date of the inventory).

## Names
- [ ] Components carry their real API names; systems carry the client's names; capabilities are in
      business words.
- [ ] No generic card such as "Controller", "Service" or "Database" on its own.
- [ ] Names match the HLD/LLD tables and the plan's Metadata Scope exactly, in both forms.

## Mermaid syntax
- [ ] Every label is quoted; line breaks are `<br/>`.
- [ ] Node IDs are letters and digits, start with a letter, and none is `end`.
- [ ] No experimental diagram types, no `click`, no HTML besides `<br/>`, no icons.
- [ ] `classDef` lines come after the nodes and edges; `linkStyle` lines are last.
- [ ] The block renders: preview it, or run `node .claude/bin/sf-sdlc diagram render <file>`.
      If it could not be rendered, say so in the report.

## In the document
- [ ] The PNG is embedded with the title as its alt text, followed by the caption and a link to the
      `.drawio` file; the Mermaid block follows as the text version.
- [ ] Status is readable without colour (badge, prefix and border style).
- [ ] For larger diagrams, a short text list of what is new, changed and removed follows the caption.
- [ ] For sharing outside the team, a PDF was exported as well.
