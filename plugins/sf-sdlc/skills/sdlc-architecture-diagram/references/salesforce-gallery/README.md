# Salesforce reference diagrams (picture references)

Nine reference diagrams from Salesforce's Architecture Center
(https://architect.salesforce.com/diagrams), downloaded as published, original size. They show how
Salesforce's own architects apply the Salesforce Diagrams standard. Open the ones for the type you
are drawing with the Read tool before writing the spec, and match their structure: header, key,
grouping, card anatomy, connector style.

These images are Salesforce material, included as references for drawing; they are not templates
to copy into client documents. Salesforce publishes them without a stated licence (see `NOTICE`).

## Capability maps

| File | Shows | Take from it |
|---|---|---|
| [capability-map/business-capability-map.png](capability-map/business-capability-map.png) | The base template: "Business Drivers" band of collapsed cards, a row of capability-category cards (icon placeholder circle, title, three capabilities), a "Salesforce Customer 360" band with a row of product icons, then Data 360, Einstein Trust Layer and Hyperforce cards | Reading order top to bottom = why → what → how. Bands are wide containers; cards inside are equal width with equal gaps. No connectors. Key = icon + product name in even rows of three |
| [capability-map/data-360-technical-capability-map.png](capability-map/data-360-technical-capability-map.png) | "Technical Capability" band (five collapsed cards) over five detailed cards (Storage, Big Data Engine, Connectors & Ingress, Data Transformation, CDP Processing) whose footer icons are AWS services; Lightning Platform card; Data Visualization and Activation Channels cards | Detailed cards line up under the capability they implement. Footer icons tag the technology; every footer icon is in the key |
| [capability-map/loyalty-management-capability-map.png](capability-map/loyalty-management-capability-map.png) | Product cards (Marketing, Experience & Engagement, Service) with footer-icon rows; a "Loyalty Management Capabilities" container with three detailed cards and a grey "Platform Services" footer band with icons; Integrations; Industry Data Sources (row of 16 industry icons); Supplier & Partner Ecosystem | A container's footer band ("Platform Services") with a centred icon row. Large key (21 icons, three rows of seven). Card widths vary to fit content while rows stay aligned |
| [capability-map/center-of-excellence-operating-model.png](capability-map/center-of-excellence-operating-model.png) | Operating model: Executive Steering Committee band; Center of Excellence container with a left text list (functional and technical leadership) and three "App Team" cards with a "Delivery Team Capabilities" footer band and four footer icons; IT band with four icon cards | A capability map for an organisation, not technology. Indented attribute lists. Repeated cards (App Team 1, 2, n) show a pattern without listing every instance |

## Solution architecture

| File | Shows | Take from it |
|---|---|---|
| [solution-architecture/loyalty-management-solution-architecture.png](solution-architecture/loyalty-management-solution-architecture.png) | Commerce (left) ↔ "Salesforce" container with Loyalty, Sales, Service and Customer Data Platform cards in a 2×2 grid ↔ Marketing (right); Tableau; MuleSoft as a full-width bus at the bottom; Industry Data Sources and Supplier & Partner Ecosystem | **Pills say what flows**, several lines each ("Order on behalf / Order history / Seamless identity / Loyalty status, points"). Two-way arrows. The integration platform drawn as a bus that the other systems drop lines into |
| [solution-architecture/zero-copy-data-360-aws.png](solution-architecture/zero-copy-data-360-aws.png) | Data 360 Home Org in the centre; Slack, Sales and Service orgs above; AWS sources on the left; activation targets on the right; Salesforce apps at the bottom | **Line colour = owner** (orange AWS, blue Salesforce, black others) and **clock badges on lines = latency** (batch, streaming, real time), all in the key. Cards with coloured borders by owner. Many pills ("Out of the box connector", "Zero Copy (Query & File Federation)") |
| [solution-architecture/data-360-actions-activations.png](solution-architecture/data-360-actions-activations.png) | Dark-background variant of the same pattern: lakehouses (Snowflake, Databricks, GCP, AWS) on the left feeding Data 360; actions and activations (Marketing Cloud, Platform Event, Webhook, ads platforms) on the right | The hub-and-spoke solution layout: sources left, hub centre, targets right, consumers top, inputs bottom. Connector labels name the pattern ("Data Activation", "Data Action") |
| [solution-architecture/data-360-customer-zero-implementation.png](solution-architecture/data-360-customer-zero-implementation.png) | Enterprise-scale view in **horizontal layers**, each labelled on the left in a coloured column: Application/Agentic, Business Intelligence, Data 360 Platforms, External Data Platforms, Source Layer | Layer bands with a left-hand label column for very large scopes. Orgs as containers with nested cards and footer icon rows. Pills on long vertical connectors |

## Interaction / process / flow

| File | Shows | Take from it |
|---|---|---|
| [process/customer-personalization-flow.png](process/customer-personalization-flow.png) | Experience (with nested Microsites and Salesforce CMS cards) → Interaction Studio → Salesforce (with a nested Customer Data Platform card) → Marketing Cloud, Integration, Slack; connectors numbered 1–8 | **Numbered circles on the connectors** give the order. Nested cards inside a product card. Footer bands with a capability title and footer icons on every product card |

## What our generator takes from these

- Header: white panel with a curved right edge on a grey band; navy title; description at least half
  the title size; key as a white rounded panel on the right with even rows.
- Cards: white, rounded, grey outline, icon in a circle, bold title, grey rule, attribute list, grey
  footer band, centred footer icons.
- Containers: the same card at full width with child cards in even rows.
- Connectors: elbow lines with capsule pills; numbered for processes; line style or colour explained
  in the key.

Not reproduced (draw by hand in draw.io if a client wants it): latency clock badges on lines, a
dark-background theme, and colour-by-owner lines.
