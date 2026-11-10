---
description: Set this project up for the Salesforce SDLC kit — tooling check, config, baseline and skill selection
argument-hint: "[optional: developer | admin | ba, or what to redo: config | skills | baseline]"
---
<!-- Generated from .claude/commands/sdlc-setup.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-project-scout-agent** subagent to set up this project.

Scope from the user: $ARGUMENTS

The agent follows the `sdlc-project-setup` skill: `sf-sdlc doctor`, `detect` and
`init`; fills `.claude/sf-sdlc.json` from what it detects and asks only for what it cannot detect
(production org aliases, Jira project key, promotion order, branch model); recommends skills with
the evidence for each and installs them after the user confirms; records the existing-state baseline
for projects that already have metadata. Stop after the report.
