---
description: Design the HLD, per-story LLDs and ADRs with Salesforce-standard diagrams (SDLC stage 3)
argument-hint: "[HLD | story IDs like US-04-02 | all]"
---
<!-- Generated from .claude/commands/sdlc-architecture.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-solution-architect-agent** subagent to design the solution.

Scope from the user: $ARGUMENTS

With no scope, write the HLD and list which stories need an LLD. With story IDs, write those LLDs
(creating or updating the HLD first if it does not exist). The agent follows the
`sdlc-solution-architecture-generate` skill and writes under `docs/sdlc/03-architecture/`; every
diagram is drawn with the `sdlc-architecture-diagram` skill as a draw.io diagram plus image in
`diagrams/`. Stop after the report.
