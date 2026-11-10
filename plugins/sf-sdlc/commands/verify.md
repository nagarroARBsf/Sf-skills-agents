---
description: Verify the implementation against every acceptance criterion and quality gate (SDD phase 6)
argument-hint: "[feature folder, default: most recent under specs/]"
---
<!-- Generated from .claude/commands/sdd-verify.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-spec-driven-development` skill, **Phase 6 — Verify**, for: $ARGUMENTS

Write `verification.md`: each AC with its evidence, test and coverage results against the project
targets, the Salesforce Code Analyzer result (`sf-sdlc analyze --changed`),
deviations from spec and plan, and the hand-off. Update the spec status. Report any failing gate
plainly, then point to the next step: an independent review with `/sf-sdlc:review`.
