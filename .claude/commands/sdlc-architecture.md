---
description: Design the HLD, per-story LLDs and ADRs with Salesforce-standard diagrams (SDLC stage 3)
argument-hint: "[HLD | story IDs like US-04-02 | all]"
---
Use the **sdlc-solution-architect-agent** subagent to design the solution.

Scope from the user: $ARGUMENTS

With no scope, write the baseline and the HLD and list which stories need an LLD. With story IDs or a
Jira key, write those LLDs (creating or updating the HLD first if it does not exist). The agent follows
the `sdlc-architecture-diagram` skill and writes under `docs/sdlc/03-architecture/`; every diagram is a
Salesforce-standard draw.io diagram with a PNG in `diagrams/`. Stop after the report.
