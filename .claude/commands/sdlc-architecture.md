---
description: Design the HLD, per-story LLDs and ADRs with Mermaid diagrams (SDLC stage 3)
argument-hint: "[HLD | story IDs like US-04-02 | all]"
---
Use the **sdlc-solution-architect-agent** subagent to design the solution.

Scope from the user: $ARGUMENTS

With no scope, write the HLD and list which stories need an LLD. With story IDs, write those LLDs
(creating or updating the HLD first if it does not exist). The agent follows the
`sdlc-solution-architecture-generate` skill and writes under `docs/sdlc/03-architecture/`.
Stop after the report.
