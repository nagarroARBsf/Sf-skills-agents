---
name: sdlc-solution-architecture-generate
description: "Design Salesforce solution architecture from a BRD and Jira backlog: establish the baseline first (greenfield or brownfield inventory), then a High-Level Design (system landscape, org footprint, capability map, data model, security and sharing, automation and integration architecture, environments) and one Low-Level Design per user story (metadata inventory, field specs, Flow/Apex/LWC design, diagrams, governor-limit analysis, test and deployment notes), plus Architecture Decision Records. Every component carries a change status (New, Changed, Unchanged, Removed) held in a component model. Applies Salesforce Well-Architected and declarative-vs-code rules. TRIGGER when: user asks for solution architecture, HLD, LLD, technical design, ERD, integration design, ADR, a baseline inventory, or to map stories to design. DO NOT TRIGGER when: user wants requirements, stories, test cases or code (use the matching sdlc-* skill), or a single diagram (sdlc-architecture-diagram)."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-solution-architecture-generate

Design first, at two levels:
- **HLD** — one document for the release: how the whole solution fits on the platform.
- **LLD** — one document per story: exactly which metadata changes and how the logic works,
  detailed enough that a developer (human or agent) can implement it with the spec-driven flow.

Both say, for every component, whether it is **New, Changed, Unchanged or Removed**. That status
is only as good as the baseline it is measured against, so the baseline comes first.

## Inputs
- BRD (`docs/sdlc/01-brd/BRD.md`, including Appendix D, the indicative Salesforce solution
  outline) and backlog (`docs/sdlc/02-backlog/backlog.md`). Check their approval records; if
  either is not approved, say so and continue only if the user confirms.
- Project config (`sf-sdlc config show --json`): `salesforce.apiVersion`,
  `salesforce.packageDirectories`, `salesforce.namespacePrefix`, `salesforce.componentPrefix`,
  `orgs.*`, `deploy.pipeline`, `git.*`, `quality.*`. Never hard-code these in a design.
- The Salesforce project itself, if present. **Read it before designing.** Reuse what exists; do
  not design a second trigger framework.
- Optional: a connected non-production org (through the `sf` CLI) for describe calls; client
  architecture standards.

## Outputs
- `docs/sdlc/03-architecture/baseline/inventory.md` — [references/baseline-template.md](references/baseline-template.md)
- `docs/sdlc/03-architecture/components.json` — schema in
  `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-architecture-diagram/references/components-schema.md`
- `docs/sdlc/03-architecture/HLD.md` — [references/hld-template.md](references/hld-template.md)
- `docs/sdlc/03-architecture/LLD/US-nn-mm.md` — [references/lld-template.md](references/lld-template.md)
- `docs/sdlc/03-architecture/ADR/ADR-nnn-{slug}.md` — [references/adr-template.md](references/adr-template.md)

Scope control: when asked for "architecture", produce the baseline and the HLD and list which
stories need an LLD. Write LLDs for the stories the user names, or for all stories in the current
release if asked. For more than ~8 LLDs, write them in batches and report progress between batches.

## Workflow

### 1. Establish the baseline (mandatory, before any design)
Do not write a design sentence until `baseline/inventory.md` exists and is current.

1. Run `sf-sdlc detect --json` and `sf-sdlc inventory --json`.
   Read `00-grounding/ontology.yaml` and `feature-map.md` when present. Source misses what was
   built in Setup: when the Metadata Grounding MCP tools are connected, search the org by meaning
   (`search_metadata`, `describe_metadata`) before marking anything New, and say whether grounding
   was used (`sdlc-workflow`, section Grounding).
2. Classify the scope:
   - **Greenfield** — no Salesforce source for this scope and a new or empty org. Evidence: the
     inventory lists no custom components in the affected area. Everything designed is `New`;
     standard objects and platform services used as-is are `Unchanged`; standard objects that
     receive fields, rules or record types are `Changed`.
   - **Brownfield** — existing source or an existing org. The inventory is the baseline; every
     planned component is looked up in it.
   - A project can be brownfield overall and greenfield for one domain. Say which.
3. Write `baseline/inventory.md` from the template: baseline reference (branch and commit, date),
   counts by metadata type, the components in the affected area by name, the conventions found
   (trigger framework, naming prefix, test data factory, logging, API version), automation per
   object (triggers, record-triggered flows, validation rules) and known gaps.
4. Org-only components: source does not show what was built in Setup and never retrieved. When
   the user names a non-production org, enrich with
   `sf org list metadata --metadata-type <Type> --target-org <alias>`,
   `sf sobject describe --sobject <ApiName> --target-org <alias>` and
   `sf package installed list --target-org <alias>`. Record what was checked. If no org is
   available, list "org-only components not verified" as a gap; do not assume there are none.
5. If the inventory is older than the latest commit on the integration branch
   (`git.integrationBranch`), refresh it before designing.

### 2. Understand
Index BRs, NFRs, constraints, integrations, personas and volumes from the BRD; stories, ACs and
feasibility notes from the backlog. Treat BRD Appendix D as leads to confirm or overturn, with
the reason recorded, not as decisions.

### 3. Decide
For each capability decide the implementation approach using
[references/decision-guides.md](references/decision-guides.md): standard feature → configuration →
declarative automation → Apex/LWC → AppExchange/off-platform. Record significant or contested
choices as ADRs (anything that is hard to reverse, affects several stories, or resolves a
feasibility hit).

### 4. Build the component model
Create or update `components.json`: one entry per component the solution creates,
changes, removes or shows for context, with `apiName`, `type`, `status`, `story`, `layer`,
`dependsOn` and `note`.
- Planned and absent from the baseline = `new`. Planned and present = `changed`. Present, shown
  for context, verified = `unchanged`. Present and to be deleted = `removed`.
- **Never mark a component Unchanged without having found it in the inventory or the org.**
- A parent is `changed` when any child is new, changed or removed.
- Once code exists, reconcile with `sf-sdlc delta --from <git-ref> --json`; the
  delta wins, and the documents are corrected.

### 5. Write the HLD
Fill every section of the HLD template. Component tables carry the **Change** column, copied
from the model. Diagrams follow the `sdlc-architecture-diagram` skill: generated from
`components.json`, with the new/changed/unchanged/removed overlay and the Key. Each diagram has a
one-line caption saying what question it answers. Keep the story-to-design map (HLD §16)
complete: every story in scope maps to components and an LLD (or "no LLD needed — configuration
only").

### 6. Write LLDs
For each story: metadata inventory with exact API names and change status (they become
`package.xml`, the destructive manifest and the plan's Metadata Scope), field specs, logic
design, diagrams, security, limits, tests, deployment. For every `Changed` component state what
exactly changes and what must keep working; for every `Removed` component state the replacement,
the data consequence and the destructive-change step. Map every AC to the design element that
satisfies it (LLD §2). An AC with no design element is a gap: fix the design or raise a question.

### 7. Review against Well-Architected
Check the design with [references/well-architected-review.md](references/well-architected-review.md)
(Trusted, Easy, Adaptable plus governor limits). Record trade-offs in the HLD.

### 8. Report
Paths; greenfield or brownfield and the baseline reference; counts of New / Changed / Unchanged /
Removed components; the list of ADRs; decisions needing sign-off; stories whose design changed
the story (raise back to the PO); feasibility hits resolved and open; gaps in the baseline. All
documents are `Draft for review`. Next: tech-lead review, then `/sf-sdlc:specify US-nn-mm` per story
and `/sf-sdlc:test-cases`.

## Hand-off to implementation
LLD sections 3-9 are written so that `/sf-sdlc:plan` can reference them instead of re-designing. The
plan's Metadata Scope takes its rows and Change values from the LLD metadata inventory; the plan
only records deviations.

## Diagrams: rules
- Follow the `sdlc-architecture-diagram` skill for every diagram that shows components: type
  selection, the status overlay, the Key, limits and accessibility.
- [references/mermaid-patterns.md](references/mermaid-patterns.md) holds additional patterns
  (sequence, ERD with attributes, state, class, pipeline) for views that carry no change status.
- Mermaid only. Quote every label; ≤ 25 nodes per diagram; split by domain otherwise.
- `flowchart` for landscape, solution, process and any data model that shows status;
  `erDiagram` for attribute-level data models; `sequenceDiagram` for interactions;
  `classDiagram` for Apex structure; `stateDiagram-v2` for status lifecycles.
- Do not use `architecture-beta`, `C4Context` or other experimental types; renderers differ.
- For Jira, Confluence or slides, render SVG with `sf-sdlc diagram render <file>`.

## Technical skills
Design uses knowledge of Flow, Apex, LWC, security and integration. If an installed skill under
`.claude/skills/` covers the area (data model, permission sets, Flow, Apex, LWC, integration),
use it for the detail; if it is missing, design from the references here and tell the user that
`/sf-sdlc:skills` can install it.
