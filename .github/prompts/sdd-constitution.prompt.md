---
name: sdd-constitution
description: "Create or update the project's engineering constitution for spec-driven development (SDD phase 0)"
argument-hint: "[optional principles to add or change]"
agent: agent
---
<!-- Generated from .claude/commands/sdd-constitution.md by scripts/sync-platforms.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-spec-driven-development` skill, **Phase 0 — Constitution**.

Create `specs/constitution.md` from the skill's constitution template if it does not exist, detecting
project facts (API version, trigger framework, naming, coverage target, CI checks) from the
repository first. If it exists, apply these changes and bump its version: (the text the user typed after the command, if any)

Stop after showing the result.
