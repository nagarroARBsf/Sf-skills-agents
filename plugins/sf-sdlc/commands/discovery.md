---
description: Validate the discovery pack against the existing org(s), compare orgs, and draft the fit-gap and HLD (SDLC stage D)
argument-hint: "[org aliases or roles] [discovery pack folder] [snapshot | validate | compare | fit-gap | hld | all]"
---
<!-- Generated from .claude/commands/sdlc-discovery.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-discovery-design-agent** subagent to run discovery on the existing org(s), read-only.

Scope from the user: $ARGUMENTS

Orgs default to `discovery.orgs` in `.claude/sf-sdlc.json` and the discovery pack to
`docs/sdlc/00-inputs/discovery/` (under `paths.docs`); if neither gives an org, or the pack folder is
empty and the scope needs it, ask. With two or more orgs, ask which one is the target (the org that
survives) unless the user said so. With no phase named, run them all: snapshot, claim register and
validation, org comparison (two or more orgs), fit-gap, current state and HLD draft. The agent follows
the `sdlc-discovery-fit-gap` skill and writes under `docs/sdlc/00-discovery/` and
`docs/sdlc/03-architecture/`. It never changes an org. Stop after the report; do not start the next
stage.
