---
description: Implement the approved tasks one by one, tests first, checking each off with evidence (SDD phase 5)
argument-hint: "[task range like T001-T006, default: next open tasks]"
---
Use the **sdlc-developer-agent** subagent to implement the approved tasks.

Tasks to do: $ARGUMENTS

The agent follows the `sdlc-spec-driven-development` skill, **Phase 5 — Implement**: works in order,
re-reads each task and its plan section, uses the installed Salesforce skill for the file type,
writes the test before the code, runs the narrowest useful check, and ticks the task with a one-line
evidence note. If the plan is wrong it stops and proposes a plan update. It deploys only to the
development or scratch org, never to shared orgs or production.
