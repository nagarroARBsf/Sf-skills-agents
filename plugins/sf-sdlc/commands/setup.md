---
description: Set this project up for the Salesforce SDLC kit — environment, connections (Salesforce, Jira, GitHub), .env, config, code baseline and skills
argument-hint: "[optional: developer | admin | ba, or what to redo: environment | connections | config | skills | baseline]"
---
<!-- Generated from .claude/commands/sdlc-setup.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-project-scout-agent** subagent to set up this project.

Scope from the user: $ARGUMENTS

The agent follows the `sdlc-project-setup` skill. It asks who is running setup (developer, admin, or
business analyst / manager) and speaks to match. It runs `sf-sdlc doctor` and offers
the install command for each missing tool; runs `init` (project settings with the plugin on at project
scope, coding rules in `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/`, `.gitignore`, and a git-ignored `.env` template); helps
connect the Salesforce org (`sf org login web`), the hosted MCP servers, Jira/Confluence (browser
sign-in, or API tokens the person fills into `.env` in their editor) and GitHub; explores the code with
`detect`; fills `.claude/sf-sdlc.json` from what it detects and asks only for what it cannot detect;
installs the core skills plus the ones the project needs after the user confirms; records the
baseline for projects that already have metadata. It never asks for or reads a credential. Stop after
the report.
