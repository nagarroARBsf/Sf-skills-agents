---
description: Check that the tools, CLI plugins, config and org setup the SDLC kit needs are in place
allowed-tools: Bash(node .claude/bin/sf-sdlc doctor*), Bash(node .claude/bin/sf-sdlc config*)
---
Run `node .claude/bin/sf-sdlc doctor` and `node .claude/bin/sf-sdlc config validate`, then report:

1. Required items that failed, each with the exact fix command from the output.
2. Optional items that are missing and what stops working without each.
3. Config errors and warnings, and which key in `.claude/sf-sdlc.json` to change.

Do not install anything or change any file. If everything passes, say so in one line.
