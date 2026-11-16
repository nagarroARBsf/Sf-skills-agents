# The Salesforce Diagrams standard

Salesforce publishes one standard for architecture diagrams, the Salesforce Diagrams framework, in
the Architecture Center: https://architect.salesforce.com/docs/architect/reference-diagrams/guide/introduction.html
(kit of parts: `.../guide/kit-of-parts.html`; data model notation: `.../guide/data-model-notation.html`).
This file is a working summary for drawing diagrams that follow it. Quotes are Salesforce's wording.
Salesforce draws its own diagrams in Lucidchart; this kit draws the same conventions in draw.io.

Read with: [drawio-spec.md](drawio-spec.md) (how the generator expresses each rule) and the example
renders in [../examples/](../examples/).

## 1. Rules for every diagram

"Diagrams should always:
- Read left to right and top to bottom, as closely as possible
- Convey a message concisely, with an appropriate scope of information for readability
- Utilize Salesforce Diagrams Standard Components, including Cards and a Header with a clear
  description describing the content, scope and purpose of the diagram"

Scope: "The scope of a diagram should be limited to only the critical information to convey for a
specific topic. Anything that is not required to capture the message you intend to communicate
should be excluded. Multiple diagrams can (and should) be created to capture varying concepts."

Steps Salesforce gives for every diagram:
1. Define the scope of the message: audience, what to show, what to leave out.
2. A Header with a clear Title and a concise Description of purpose, scope and message.
3. Cards for the properties (systems, concepts, entities).
4. Card Attributes for property details or key capabilities.
5. Connectors for relationships between cards.
6. Card Icons where useful.
7. Footers and Footer icons for other key aspects of a property.

### Levels of detail (2021 framework, still linked by Salesforce)
"As you move from Level 1 → Level 4 you zoom into greater levels of detail, finer granularity, and
reduced surface area or scope." Never mix levels in one diagram.

| Level | Scope | Audience | Diagram types |
|---|---|---|---|
| 1 Big picture | Landscape, solution overview, capabilities | Business, executives, architects | Capability map, system landscape |
| 2 Piece of the whole | One capability or subsystem | Product owners, architects, delivery leads | Solution architecture |
| 3 Process / interaction | Time-based steps, data flows | Architects, delivery team | Interaction / process / flow |
| 4 Double click | Fine-grained detail | Technical team | Data model, per-story LLD views |

Roadmaps sit outside the levels: they plan delivery over time.

## 2. Kit of parts

### Header
"The Header should be present on all diagrams and include: a title that can be quickly understood
by your audience; a clear description of what the diagram covers, its purpose and intent;
(optional) your logo or company name; (optional) a Key to clarify icons, designs or symbols used as
classifications." "The size should take up at least 10% of the diagram height and 100% of the
width." "The font size of the description should be at least half the size of the title."
"A Key should be included when Icons, connectors, colors, etc. are used that are not specified with
titles on the diagram itself. The key should be grouped into even rows when possible."

Observed in every gallery diagram: a full-width light-grey band (#E5E5E5); on the left a white panel
whose right edge is a large convex curve, holding company name, title (large, dark navy) and
description (navy, two to four lines, about 60 characters wide); on the right, on the grey, the Key
as a white rounded panel. Titles under 20 characters read best (2021 guidance).

### Cards
"All properties of your diagram should be represented with a card." "The only required Card content
is the Title." Card anatomy, top to bottom:
- **Card icon**: "visual assets representing the card property" (a white glyph on a coloured circle).
- **Card title**: bold, left-aligned, vertically centred on the icon.
- **Separator rule**: a light-grey rule (#E5E5E5) under the title, from the title's left edge to the
  card's right edge.
- **Card attributes**: "text-based details about the property, represented as a list".
- **Card footer**: a grey band with "additional characteristics of the property. Examples include:
  Package/ Object/ API names, Ownership, Capabilities".
- **Footer icons**: a centred row of small icons ("channels, shared services, capabilities").
  "Footer icons should be included / explained in your diagram key."

Variations: collapsed card (title and rule), detailed card (with attributes), detailed with footer
and footer icons. Rounded rectangle, white fill, grey-50 (#747474) outline in the kit; gallery
diagrams use darker outlines and a faint shadow.

### Containers
"Cards can also act as containers i.e. groupings for multiple properties. You can nest cards inside
of another card to represent hierarchical relationships or classify related properties as needed."
A container has its own icon, title and rule, a heavier border, and child cards in even rows.

### Connectors and pills
"Connectors should always utilize elbow connection lines, and be straight whenever possible for
greater readability." "Connectors represent a relationship, integration, or process step between two
cards. Line styles indicate a different type of connection and should be represented in your diagram
key. Endpoints indicate direction of an integration or process connector. Endpoints also indicate
cardinality and ordinality on a relationship connector."
"Pills are utilized to provide details about the connections." Pills are capsules (fully rounded),
white fill, the connector's line style as their border, bold text the size of card body text.
Salesforce assigns no fixed meaning to solid versus dashed: each diagram defines its line styles in
its key (for example solid = publish, dashed = subscribe; dashed = batch sync). This kit fixes one
vocabulary so every diagram in a project reads the same way (see drawio-spec.md, connector kinds).

### Icons
"Salesforce Diagrams provide a basic set of Salesforce Product Logos as well as additional icons to
represent properties and other areas in your diagram." For more, the Lightning Design System icons.
This kit uses draw.io's built-in Salesforce library (products, platform capabilities, industries),
referenced by shape name; it does not copy logo artwork into documents.

### Colour and accessibility
"Each color in the Salesforce color system has a number, between 0 and 100 … make sure the
background color behind the text is at least 50 points greater than or less than the color of the
text." That keeps the WCAG minimum contrast of 4.5:1. Published greys: 50 = #747474 (outlines),
80 = #C9C9C9, 90 = #E5E5E5 (header band, rules, footers). "The best format for screen reader
compatibility is PDF": export a PDF when sharing outside the team.

## 3. The six diagram types

| Type | Salesforce's purpose | Layout in Salesforce's gallery | Connectors |
|---|---|---|---|
| Capability map | "Capture the property mix and relevant, key capabilities included in a solution. Focus on functionality, business drivers and values." | Horizontal bands top to bottom: business drivers → business capabilities → products and platform services | None |
| System landscape | "Capture the products and/or technical systems involved in a given implementation. Focus on the properties, specific property aspects, and connections across properties." | Three columns: external systems left, integration or data hub centre, Salesforce clouds right. External systems grey-blue, Salesforce systems white, shown in the key | Elbow arrows into the hub, mostly without pills |
| Solution architecture | "Include products or technologies with integration, behavior and/or functionality. Focus on the detailed connections and/or communication aspects across properties." | Salesforce platform as a container of org-level products; systems around it | Pills that say what flows ("Order history", "Loyalty status, points") |
| Roadmap | "Help organizations plan and visualize the strategic implementation of capabilities, components, features, and systems over time. Provide a clear view of implementation order, dependencies, and priorities." | Time grid: periods across the top, swimlanes down the left, alternating column shading; a card spans its start to end period | None. Dependencies are written on the card ("Dependencies: …") |
| Interaction / process / flow | "Capture time-based steps, data flows, or interactions required to support a process. Focus on and clarify (with sequenced numbering) the order of aspects/properties." | Participants as columns or lanes; flow left to right | Every step numbered (numbered pills or circles) |
| Data model / ERD | "Capture entities (objects), relationships and concepts for metadata implementations." | Entity boxes; straight horizontal or vertical relationship lines | Crow's foot notation (below) |

Roadmaps drill down: capability roadmap → component roadmap ("a detail view of one box in a
Capability Roadmap") → feature roadmap.

## 4. Data model notation

- **Entities**: rounded boxes with the logical name (bold) and the API name (bold italic) under it.
  Attributes: "#" marks part of the logical unique key, "•" a non-key attribute.
- **Entity formatting carries meaning** ("The color scheme of the diagram reflects the cloud in focus"):

| Entity | Formatting |
|---|---|
| Object of the cloud in focus | Tinted fill and border in the cloud colour |
| Related object (other licence) | White fill, black border |
| Related object extended by the focus cloud | Light grey fill, black border |
| External object (Salesforce Connect, API) | No border |
| Record type | Dashed border; second line "RT: Record Type Name" |
| Conceptual (no object, no record type) | Dotted border |

Cloud colours (fill / border, measured): Sales #CFF8F2 / #276663; Service #F6D2DE / #B35172;
Platform #DFDEEE / #463C6E; Industries #EFE8F0 / #744885.

- **Relationships**: "A crow's foot on an end indicates that many entity occurrences on that end can
  relate to each occurrence on the opposite end." "A diamond on the singular side of a relationship
  means that the entity on that side plays the master role" (master-detail). Optionality: a circle
  (optional) or bar (required) at each end; "On the many (that is, crow's foot) side of the
  relationship, there is almost always a circle on the line."
- "Relationships added by the cloud in focus for the diagram are drawn in a color. Black lines
  represent a relationship that comes with a different license than the focus cloud." This kit draws
  relationships added by the change in the cloud colour.
- "Relationship lines should always be straight." "Relationship lines should be drawn vertically or
  horizontally." Keep crow's feet consistently on one side (left/top, or right/bottom) in one ERD.
- Relationship wording reads as a sentence: "Each Contact must be primarily a contact for one and
  only one Account."

## 5. Salesforce's reference gallery (look before you draw)

Nine of these are included as images, with notes on what to take from each:
[salesforce-gallery/README.md](salesforce-gallery/README.md). Open them with the Read tool. For the
others, open the page in a browser. Do not paste Salesforce's images into project documents: the site
states no licence for reuse.

| Type | Examples (https://architect.salesforce.com/docs/architect/reference-diagrams/guide/<slug>.html) |
|---|---|
| Capability map | `business-capability-map`, `loyalty-management-capability-map`, `data-360-technical-capability-map` |
| System landscape | `retail-system-landscape`, `data-360-marketing`, `einstein-system-landscape`, `single-org-architecture` |
| Solution architecture | `loyalty-management-solution-architecture`, `aws-data-360` |
| Roadmap | `capability-roadmap`, `component-roadmap`, `feature-roadmap`, `system-roadmap` |
| Interaction / process / flow | `claim-check`, `customer-personalization-flow`, `hospitality-loyalty-management-process`, `asynchronous-processing-via-platform-events` |
| Data model | https://developer.salesforce.com/docs/platform/data-models/guide/get-started.html (gallery by cloud) |

Section index pages: `.../guide/section-capability-map.html`, `section-system-landscape`,
`section-solution-architecture`, `section-roadmap`, `section-interaction-process-flow`.

## 6. What this kit adds to the standard

- **Change status** on every card (New, Changed, Unchanged, Removed): border colour and line style,
  a badge in the card footer, and a key entry. Salesforce's standard has no change overlay; the key
  explains it, as the standard asks for any symbol it does not define.
- **A fixed connector vocabulary** (sync, async, data, user, flow, dependency and the four
  relationship kinds) so diagrams of one project read alike.
- **Animated connectors** for asynchronous and data flows in draw.io and SVG exports (static in PNG
  and PDF).
