---
description: Implement the approved tasks one by one, tests first, checking each off with evidence (SDD phase 5)
argument-hint: "[task range like T001-T006, default: next open tasks]"
---
Follow the `sdlc-spec-driven-development` skill, **Phase 5 — Implement**, in this conversation.

Tasks to do: $ARGUMENTS

Check the plan's approval record, then work in order on a feature branch: re-read each task and its
plan section, load the installed Salesforce skill for the file type, follow the project rules in
`.claude/rules/`, write the failing test before the code, run the narrowest useful check
(`node .claude/bin/sf-sdlc check`, `analyze --changed`, the related Apex or Jest test), and tick the
task with a one-line evidence note. If the plan is wrong, stop and propose a plan update. Deploy only
to the development or scratch org, never to shared orgs or production. Finish with the tasks done,
blocked and deviated, and the next step (`/sdd-verify`).
