---
name: sdlc-test-cases
description: "Design Salesforce test cases, CSV import and traceability matrix for stories (SDLC stage 5)"
argument-hint: "[story IDs like US-04-02 | epic EPIC-04 | all]"
agent: sdlc-qa-test-agent
---
<!-- Generated from .claude/commands/sdlc-test-cases.md by scripts/sync-platforms.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Design test cases.

Scope from the user: (the text the user typed after the command, if any)

With no scope, cover every story in `docs/sdlc/02-backlog/backlog.md` that has an LLD, and list the
ones without. The agent follows the `sdlc-qa-test-case-generate` skill and writes under
`docs/sdlc/04-qa/`. Stop after the report.
