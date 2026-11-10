---
description: Write the implementation plan for an approved spec in the project's spec-driven format (SDD phase 3)
argument-hint: "[feature folder, story ID or ticket; default: most recent under specs/]"
---
<!-- Generated from .claude/commands/sdd-plan.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-plan-agent** subagent to write the implementation plan.

Feature or ticket from the user: $ARGUMENTS

The agent follows the `sdlc-spec-driven-development` skill, **Phase 3 — Plan**: reads
`specs/constitution.md`, the spec, the story's LLD if one exists and the code that will change,
traces callers and dependencies in both directions, and writes `plan.md` from the plan template with
every section in order, including the technical-flow diagram that marks new and changed components.
No code is written. Stop for review.
