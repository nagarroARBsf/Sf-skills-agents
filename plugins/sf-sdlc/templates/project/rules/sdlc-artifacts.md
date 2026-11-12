---
description: Conventions for SDLC documents — IDs, traceability, status, diagrams
paths:
  - "docs/sdlc/**"
  - "specs/**"
---
<!-- Installed by `sf-sdlc init` from the sf-sdlc plugin (generated from .claude/rules/sdlc-artifacts.md). Re-running init updates this file while it is unchanged; once you edit it, it is yours and is kept. -->

# SDLC artifact conventions

- Use the shared ID scheme (`SRC`, `OBJ`, `BR`, `FR`, `RULE`, `NFR`, `Q`, `EPIC`, `US-nn-mm`,
  `AC-n`, `ADR-nnn`, `LLD-US-nn-mm`, `TC-US-nn-mm-nnn`, `TR-…`, `DEF-nnn`, `DEP-nnn`, `REL-<version>`,
  `DEC-nn`, `ACT-nn`, `INT-nn`) from the `sdlc-workflow` skill. Never
  renumber approved IDs; strike through withdrawn items with a reason.
- Every downstream item cites its upstream ID.
- Documents written by an agent have status `Draft for review`. Only a person fills in the approval
  record (status, approver, date); an agent never approves its own output.
- Unknowns are `[TBD]` with an open question, never invented values.
- Diagrams in Mermaid with quoted labels and ≤ 25 nodes; architecture diagrams mark components New,
  Changed, Unchanged or Removed and carry a Key (`sdlc-architecture-diagram` skill).
- When editing an approved document, bump its version and add a Version History row.
