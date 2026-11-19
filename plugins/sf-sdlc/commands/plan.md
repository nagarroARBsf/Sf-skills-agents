---
description: Write the implementation plan for an approved spec in the project's spec-driven format (SDD phase 3)
argument-hint: "[feature folder, story ID or ticket; default: most recent under specs/]"
---
<!-- Generated from .claude/commands/sdd-plan.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-spec-driven-development` skill, **Phase 3 — Plan**, in this conversation.

Feature or ticket from the user: $ARGUMENTS

Read `specs/constitution.md`, the spec, the story's LLD if one exists, the grounding files and the
code that will change; trace callers and dependencies in both directions; then write `plan.md` from
the plan template with all 12 sections in order, including the technical-flow diagram that marks new
and changed components. Discovery is read-only and no code is written. Stop for review with the
solution in one line, the highest-impact rows of the impact analysis and the open questions.
