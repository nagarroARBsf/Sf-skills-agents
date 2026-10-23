---
name: sdlc-solution-architecture-generate
description: "Design Salesforce solution architecture from a BRD and Jira backlog: a High-Level Design (system landscape, org/product footprint, capability-to-feature map, data model ERD, security and sharing model, automation and integration architecture, environments/DevOps) and one Low-Level Design per user story (metadata inventory, field specs, Flow/Apex/LWC design, sequence and class diagrams, governor-limit analysis, test and deployment notes), plus Architecture Decision Records. All diagrams in Mermaid. Applies Salesforce Well-Architected (Trusted, Easy, Adaptable) and declarative-vs-code decision rules. TRIGGER when: user asks for solution architecture, HLD, LLD, technical design, design document, ERD, sequence diagram, integration design, ADR, or to map user stories to technical design. DO NOT TRIGGER when: user wants requirements (sdlc-brd-generate), stories (sdlc-jira-story-generate), test cases (sdlc-qa-test-case-generate), or to write the code itself (use spec-driven development and the platform-* skills)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-solution-architecture-generate

Design first, at two levels:
- **HLD** — one document for the release: how the whole solution fits on the platform.
- **LLD** — one document per story: exactly which metadata changes and how the logic works,
  detailed enough that a developer (human or agent) can implement it with the spec-driven flow.

## Inputs
- BRD (`docs/sdlc/01-brd/BRD.md`) and backlog (`docs/sdlc/02-backlog/backlog.md`).
- The Salesforce project itself, if present (`sfdx-project.json`, `force-app/`): existing objects,
  fields, triggers, flows, frameworks and naming conventions. **Read it before designing.**
  Reuse what exists; do not design a second trigger framework.
- Optional: connected org (via `sf` CLI) for describe calls; client architecture standards.

## Outputs
- `docs/sdlc/03-architecture/HLD.md` — [references/hld-template.md](references/hld-template.md)
- `docs/sdlc/03-architecture/LLD/US-nn-mm.md` — [references/lld-template.md](references/lld-template.md)
- `docs/sdlc/03-architecture/ADR/ADR-nnn-{slug}.md` — [references/adr-template.md](references/adr-template.md)

Scope control: when asked for "architecture", produce the HLD and list which stories need an LLD.
Write LLDs for the stories the user names, or for all stories in the current release if asked.
For more than ~8 LLDs, write them in batches and report progress between batches.

## Workflow

### 1. Understand
- Index BRs, NFRs, constraints, integrations, personas and volumes from the BRD; stories, ACs,
  feasibility notes from the backlog.
- Inventory the existing project: objects/fields (`force-app/**/objects`), triggers and handler
  framework, flows per object, LWCs, permission sets, Named Credentials. Note conventions
  (prefixes, API version).

### 2. Decide
For each capability decide the implementation approach using
[references/decision-guides.md](references/decision-guides.md): standard feature → configuration →
declarative automation → Apex/LWC → AppExchange/off-platform. Record significant or contested
choices as ADRs (anything that is hard to reverse, affects several stories, or resolves a
feasibility hit).

### 3. Write the HLD
Fill every section of the HLD template. Diagrams: use
[references/mermaid-patterns.md](references/mermaid-patterns.md). Each diagram has a one-line
caption saying what question it answers. Keep the story-to-design map (HLD §16) complete: every
story in scope maps to components and an LLD (or "no LLD needed — configuration only").

### 4. Write LLDs
For each story: metadata inventory with exact API names (they become `package.xml` and the
spec-driven `plan.md`), field specs, logic design, diagrams, security, limits, tests, deployment.
Map every AC to the design element that satisfies it (LLD §2). An AC with no design element is a
gap: fix the design or raise a question.

### 5. Review against Well-Architected
Check the design with [references/well-architected-review.md](references/well-architected-review.md)
(Trusted, Easy, Adaptable plus governor limits). Record trade-offs in the HLD.

### 6. Report
Paths, the list of ADRs, decisions needing sign-off, stories whose design changed the story
(raise back to the PO), feasibility hits resolved and open. Next: tech-lead review, then
`/sdd-specify US-nn-mm` per story and the `sdlc-qa-test-agent`.

## Hand-off to implementation
LLD sections 3-9 are written so that `/sdd-plan` can reference them instead of re-designing. When a
developer runs spec-driven development for a story with an LLD, the plan must cite the LLD and
only record deviations.

## Diagrams: rules
- Mermaid only (renders in GitHub, GitLab, Azure DevOps wikis, VS Code, Cursor, Confluence with a
  plugin). For PNG/SVG deliverables use the `generating-visual-diagrams` /
  `external-diagram-mermaid-generate` skills.
- Quote every label containing spaces or punctuation: `A["Account (Customer)"]`.
- ≤ 25 nodes per diagram; split by domain otherwise.
- `erDiagram` for data models using API names; `sequenceDiagram` for interactions;
  `flowchart` for landscape, logic and pipelines; `classDiagram` for Apex structure;
  `stateDiagram-v2` for status lifecycles.
- Do not use `architecture-beta`, `C4Context` or other experimental types; renderers differ.
