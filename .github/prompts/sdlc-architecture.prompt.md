---
name: sdlc-architecture
description: "Design the HLD, per-story LLDs and ADRs with Mermaid diagrams (SDLC stage 3)"
argument-hint: "[HLD | story IDs like US-04-02 | all]"
agent: sdlc-solution-architect-agent
---
<!-- Generated from .claude/commands/sdlc-architecture.md by scripts/sync-platforms.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Design the solution.

Scope from the user: (the text the user typed after the command, if any)

With no scope, write the HLD and list which stories need an LLD. With story IDs, write those LLDs
(creating or updating the HLD first if it does not exist). The agent follows the
`sdlc-solution-architecture-generate` skill and writes under `docs/sdlc/03-architecture/`.
Stop after the report.
