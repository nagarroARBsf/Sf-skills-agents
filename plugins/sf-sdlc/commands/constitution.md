---
description: Create or update the project's engineering constitution for spec-driven development (SDD phase 0)
argument-hint: "[optional principles to add or change]"
---
<!-- Generated from .claude/commands/sdd-constitution.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-spec-driven-development` skill, **Phase 0 — Constitution**.

Create `specs/constitution.md` from the skill's constitution template if it does not exist, detecting
project facts (API version, trigger framework, naming, coverage target, CI checks) from the
repository first. If it exists, apply these changes and bump its version: $ARGUMENTS

Stop after showing the result.
