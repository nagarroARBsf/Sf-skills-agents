# Diagram specs: Salesforce-standard draw.io diagrams from JSON

A diagram spec is a small JSON file (`<name>.diagram.json`) that says **what** is on the diagram:
header, groups, cards, connectors. The generator decides **where**: it lays the diagram out in the
Salesforce Diagrams style (see [salesforce-diagram-standard.md](salesforce-diagram-standard.md)),
routes connectors through the gaps between columns, and writes an editable `.drawio` file.
Never place coordinates by hand, and never hand-write the XML of a new diagram.

```bash
node .claude/bin/sf-sdlc diagram drawio docs/sdlc/03-architecture/diagrams/landscape.diagram.json
node .claude/bin/sf-sdlc diagram drawio docs/sdlc/03-architecture/components.json --story US-04-02
node .claude/bin/sf-sdlc diagram drawio docs/sdlc/03-architecture/components.json --type data-model
node .claude/bin/sf-sdlc diagram check  docs/sdlc/03-architecture/diagrams/landscape.drawio
node .claude/bin/sf-sdlc diagram export docs/sdlc/03-architecture/diagrams/landscape.drawio --format png
node .claude/bin/sf-sdlc diagram export docs/sdlc/03-architecture/diagrams/landscape.drawio --format svg
```

- From a spec, the `.drawio` is written next to it (`landscape.diagram.json` → `landscape.drawio`).
- From `components.json` (a JSON array), solution-architecture (default) and data-model diagrams are
  generated, and both the spec and the `.drawio` go to `03-architecture/diagrams/`
  (`solution-architecture-US-04-02.diagram.json` and `.drawio`). Edit that spec to add pills,
  icons or attributes, then generate again from the spec.
- `export` needs draw.io desktop (free). Without it, say so; the `.drawio` file still opens in draw.io
  on the web, in draw.io desktop, and in the VS Code "Draw.io Integration" extension.
- PNG and PDF are static. SVG keeps the animated connectors.

## Top level

| Field | Required | Meaning |
|---|---|---|
| `type` | yes | `capability-map`, `system-landscape`, `solution-architecture`, `roadmap`, `process`, `data-model` |
| `title` | yes | Short: read at a glance (aim under 40 characters) |
| `description` | yes | One sentence: the message, scope and purpose |
| `author` | no | Company or team name, shown above the title (the standard's "logo or company name") |
| `scope` | no | Story IDs, release or domain; shown under the description |
| `version`, `source` | no | Shown under the description (`source: "components.json"`) |
| `groups` | per type | Containers (columns or bands); periods for a roadmap; lanes for a process |
| `lanes` | roadmap | Swimlanes (rows) of a roadmap: `[{ "id", "label" }]` |
| `cards` | yes | The properties: at most 25 |
| `connectors` | no | Relationships, integrations or steps between cards |
| `legend` | no | Extra key rows for footer icons: `[{ "icon": "workflow", "label": "Approval process" }]` |
| `direction` | no | `LR` (default) or `TB` (default for capability maps: one band per group) |
| `columns` | no | Groups per row before wrapping (LR), or grid columns when there are no groups |
| `maxPerRow` | no | Cards per row inside a band (TB), default 5 |
| `cardWidth` | no | Card width in pixels (default 280; capability map 230; process 240) |
| `cloud` | data model | Focus cloud for entity colours: `custom` (default), `sales`, `service`, `platform`, `industries` |
| `animate` | no | `false` turns connector animation off |
| `showStatus` | no | `false` hides the status key; `true` shows it even when everything is unchanged |
| `autoOrder` | no | `false` keeps cards in the order written (default: callers before callees in a column) |
| `numbered` | no | `true` numbers connectors on any type (process diagrams are always numbered) |

## Groups

`{ "id": "org", "label": "Salesforce org", "subtitle": "Production, Enterprise Edition", "icon": "platform" }`

Rendered as a container card: icon, title, subtitle, rule, child cards. In a **roadmap** each group
is a time period, in order (`"label": "Q1 2027", "subtitle": "January 1 - March 31"`). In a
**process** each group is a lane (an actor or system), top to bottom.

## Cards

| Field | Meaning |
|---|---|
| `id` | Unique; connectors refer to it |
| `title` | Required. Components: the API name. Systems: the client's name. Capabilities: business words |
| `subtitle` | Small line under the title (metadata type, product). Data model: the API name (bold italic) |
| `group` | Group id (required when the spec has groups). Roadmap: the first period |
| `status` | `new`, `changed`, `unchanged` (default), `removed`, from `components.json` |
| `story` | ID shown in the status badge (`NEW · US-04-02`). Omit for unchanged |
| `attributes` | List of short lines: details, changed fields (`+ Field__c`, `~ Field__c`, `- Field__c`), "Depends on: …" |
| `footer` | Text in the grey footer band (package, owner, capability) |
| `footerIcons` | Icon names in a row under the footer; explain them in `legend` |
| `icon` | Icon name from the list below, or `false` for none. Default: from `metadataType` |
| `metadataType` | Metadata API type (`ApexClass`, `Flow`, `CustomObject`, …) — picks a default icon |
| `external` | `true` for a non-Salesforce system: grey-blue card, "External system" in the key |
| `step` | Process: column (0, 1, 2 …). Two cards with the same step stack in that column |
| `lane` | Roadmap: swimlane id |
| `span` | Roadmap: number of periods the card covers (default 1) |
| `entity` | Data model: `cloud`, `related`, `extended`, `external`, `record-type`, `conceptual` (default: `__c` objects `cloud`, others `related`) |

## Connectors

`{ "from": "sales", "to": "mule", "kind": "sync", "label": "Credit check", "bidirectional": true }`

| Kind | Draws | Use for |
|---|---|---|
| `sync` | Solid navy arrow | Request and response: REST, SOAP, Apex callout, `@wire`, LDS |
| `async` | Dashed purple arrow, animated | Platform events, CDC, Pub/Sub, outbound messages, queues |
| `data` | Dotted teal arrow, animated | ETL, batch jobs, nightly loads, Bulk API, file transfers |
| `user` | Grey arrow, open head | A person or channel using a system |
| `flow` | Solid navy arrow | The next step in a process |
| `dependency` | Thin grey arrow | Component uses or calls another (solution diagrams) |
| `lookup` | Crow's foot + circle → circle + bar | Data model: lookup, parent optional |
| `lookup-required` | Crow's foot + circle → double bar | Data model: lookup, parent required |
| `master-detail` | Crow's foot + circle → diamond on the master | Data model: master-detail |
| `many-to-many` | Crow's foot at both ends | Data model: through a junction object |

- Direction: `from` is the caller, publisher, source of data or the child (detail) object.
- `label` becomes a pill. Keep it to a few words: what flows ("Order history"), not how.
- `status` defaults from the cards: `removed` if either end is removed, `new` if either end is new.
  The status prefix (`[NEW]`, `[CHG]`, `[DEL]`) is added to the pill; new and changed lines are thicker.
- Process connectors are numbered in the order written: write them in step order.
- Roadmaps take no connectors (the generator refuses them). Capability maps normally have none.

## Icons (draw.io's built-in Salesforce library)

Use a name below for `icon`, `footerIcons`, a group `icon` or a `legend` row. The generator draws
the circle form (white glyph on a coloured circle) when there is one. A name not in this list is
rejected: a wrong shape name renders as an empty box.

- **Products**: `sales`, `service`, `marketing`, `commerce`, `platform`, `analytics`, `integration`,
  `employees`, `learning`, `industries`, `partners`, `success`, `inbox`, `field_service`, `iot`,
  `social_studio`, `customer_360`, `heroku`, `work_com`, `loyalty`
- **Platform capabilities**: `apps`, `web`, `channels`, `bots`, `automation`, `workflow`,
  `personalization`, `builders`, `data`, `stream`, `segments`, `privacy`
- **Industries**: `government`, `media`, `consumer_goods`, `transportation_and_technology`,
  `financial_services`, `automotive`, `energy`, `smb`, `communications`, `retail`, `manufacturing`,
  `health`, `philantrophy` (draw.io's spelling), `non_profit`, `education`, `sustainability`

Each also exists with a `2` suffix (the circle form, `sales2`). The library has no Agentforce,
Data Cloud, MuleSoft, Slack or Tableau logos: use `bots` for Agentforce, `customer_360` or `data`
for Data Cloud, `integration` for MuleSoft, `analytics` for Tableau, `channels` for Slack.

Default icons by metadata type: pages and components `apps`, Visualforce and sites `web`, Apex
classes `builders`, triggers and validation rules `automation`, flows and approvals `workflow`,
objects and fields `data`, platform events `stream`, permissions `privacy`, credentials and
connected apps `integration`, reports and dashboards `analytics`, agents `bots`.

## What each type needs

| Type | Groups | Cards | Connectors |
|---|---|---|---|
| Capability map | One per business domain (bands, top to bottom) | Capabilities in business words, `icon: false` or a product icon; status per capability | None |
| System landscape | Columns: external systems, integration hub, Salesforce org (or users / org / external) | Systems and clouds; `external: true` for non-Salesforce | `sync`, `async`, `data`, `user`; pills optional |
| Solution architecture | Layers: Experience, Automation and logic, Data, Security, Integration, External | Components by API name with `metadataType`; changed fields as attributes | `dependency` plus `sync`/`async`/`data` with pills saying what flows |
| Roadmap | Periods in order; plus `lanes` | Capabilities, components or features; `span`; "Depends on: …" attribute | None |
| Process | Lanes: actors and systems | Steps with `step` numbers | `flow`, `sync`, `async`; numbered automatically |
| Data model | None (grid; `columns` sets the width) | Objects: `title` logical name, `subtitle` API name, `#`/`•` attributes, `entity` | `lookup`, `lookup-required`, `master-detail`, `many-to-many`; pill = relationship name |

## Layout behaviour worth knowing

- Cards in a column are ordered so a caller sits above what it calls; set `autoOrder: false` to keep
  your order.
- A connector that would cross a card in a column it skips is routed below that column's cards.
  Fewer column-skipping connectors make a calmer diagram: order groups so most connectors join
  neighbouring columns (users → experience → logic → data → integration → external).
- Gaps between columns widen to fit the longest pill.
- The header is at least 10% of the height; the key lists only statuses, system kinds, entity kinds,
  connector kinds and legend icons that the diagram uses, in columns of at most five rows.

## Hand edits

The `.drawio` file can be polished in draw.io (move a card, add a note). Regenerating from the spec
overwrites hand edits, so put every lasting change in the spec. For edits that the spec cannot
express, follow [drawio-authoring.md](drawio-authoring.md) and run `diagram check` afterwards.
