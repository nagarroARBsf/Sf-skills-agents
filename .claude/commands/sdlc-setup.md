---
description: Set this project up for the Salesforce SDLC kit — tooling check, config, baseline and skill selection
argument-hint: "[optional: developer | admin | ba, or what to redo: config | skills | baseline]"
---
Use the **sdlc-project-scout-agent** subagent to set up this project.

Scope from the user: $ARGUMENTS

The agent follows the `sdlc-project-setup` skill: `node .claude/bin/sf-sdlc doctor`, `detect` and
`init`; fills `.claude/sf-sdlc.json` from what it detects and asks only for what it cannot detect
(production org aliases, Jira project key, promotion order, branch model); recommends skills with
the evidence for each and installs them after the user confirms; records the existing-state baseline
for projects that already have metadata. Stop after the report.
