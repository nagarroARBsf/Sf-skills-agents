# Diagram review checklist

Run on every diagram before it goes into a document. A failed item is fixed, not explained away.

## Message and type
- [ ] The diagram answers one question, stated in its caption in one sentence.
- [ ] The type matches the question (capability map, system landscape, solution architecture,
      roadmap, interaction/process/flow, data model).
- [ ] One level of detail: systems are not mixed with fields, capabilities not with classes.
- [ ] It has a title (front matter or the Markdown heading above it) and a one-sentence
      description (`accDescr` and the caption).

## Layout
- [ ] One flow direction (left-to-right or top-to-bottom); users and entry points first, data last.
- [ ] At most 25 nodes, Key excluded. Larger scopes are split, with an overview diagram.
- [ ] Subgraphs group by layer, system, domain or release — not by status.
- [ ] Text-only cards: no logos, product icons, images or emoji.

## Change-status overlay
- [ ] Every node has exactly one of the classes `new`, `changed`, `unchanged`, `removed`.
- [ ] Every new, changed or removed node label starts with `[NEW]`, `[CHG]` or `[DEL]`;
      unchanged nodes have no prefix.
- [ ] Class and prefix agree on every node.
- [ ] The Key subgraph is present with all four statuses.
- [ ] The four `classDef` lines match the standard palette character for character.
- [ ] New, changed and removed edges have the prefix in their label and a `linkStyle` with the
      matching stroke.
- [ ] `linkStyle` indices were recounted after the last edit (zero-based, in written order,
      chained edges counted separately) and point at the intended edges.
- [ ] In a `sequenceDiagram`: prefixes on participants and messages, `rect` around new or
      changed interactions, and a `Note over` Key.

## Truth of the statuses
- [ ] Every status comes from `components.json`; the diagram and the model agree.
- [ ] Every `unchanged` node was found in the baseline inventory or in the org. None is assumed.
- [ ] No component that exists in the inventory is marked `new`.
- [ ] A parent whose child changes is marked `changed`, and the changed children are listed.
- [ ] Every `removed` node appears in the deployment notes as a destructive change.
- [ ] Greenfield or brownfield is stated in the document, with the baseline reference
      (commit or date of the inventory).

## Names
- [ ] Components carry their real API names; systems carry the client's names.
- [ ] No generic node such as "Controller", "Service" or "Database" on its own.
- [ ] Names match the HLD/LLD tables and the plan's Metadata Scope exactly.

## Syntax
- [ ] Every label is quoted; line breaks are `<br/>`.
- [ ] Node IDs are letters and digits, start with a letter, and none is `end`.
- [ ] No experimental diagram types, no `click`, no HTML besides `<br/>`.
- [ ] `classDef` lines come after the nodes and edges; `linkStyle` lines are last.
- [ ] The block renders: preview it, or run `sf-sdlc diagram render <file>`.
      If it could not be rendered, say so in the report.

## Accessibility
- [ ] Status is readable without colour (prefix and border style).
- [ ] `accTitle` and `accDescr` are present.
- [ ] The caption, plus a short text list of what is new, changed and removed for larger
      diagrams, gives a non-visual reader the same message.
- [ ] Text colours are the palette's; no pale text on pale fill, no theme overrides.
