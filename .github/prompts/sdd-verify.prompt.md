---
name: sdd-verify
description: "Verify the implementation against every acceptance criterion and quality gate (SDD phase 6)"
argument-hint: "[feature folder, default: most recent under specs/]"
agent: agent
---
<!-- Generated from .claude/commands/sdd-verify.md by scripts/sync-platforms.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-spec-driven-development` skill, **Phase 6 — Verify**, for: (the text the user typed after the command, if any)

Write `verification.md`: each AC with evidence, test and coverage results, Code Analyzer results,
a security review of the diff, deviations from spec/plan, and the hand-off to QA. Update the spec
status. Report any failing gate plainly.
