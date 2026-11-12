---
description: Check that the tools, CLI plugins, config and org setup the SDLC kit needs are in place
allowed-tools: Bash(sf-sdlc doctor*), Bash(sf-sdlc config*), Bash(sf-sdlc env status*)
---
<!-- Generated from .claude/commands/sdlc-doctor.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Run `sf-sdlc doctor`, `sf-sdlc config validate` and
`sf-sdlc env status`, then report:

1. Required items that failed, each with the exact fix command from the output.
2. Optional items that are missing and what stops working without each.
3. Config errors and warnings, and which key in `.claude/sf-sdlc.json` to change.
4. Which `.env` groups (Jira, Confluence, GitHub) are configured, partial or empty — names only,
   never values.

Do not install anything or change any file. If everything passes, say so in one line.
