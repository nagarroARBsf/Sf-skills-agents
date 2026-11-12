---
description: Show the setup checklist — what is done, what Claude can do for you, and what still needs you
allowed-tools: Bash(node .claude/bin/sf-sdlc setup*), Bash(node .claude/bin/sf-sdlc doctor*), Bash(node .claude/bin/sf-sdlc config*), Bash(node .claude/bin/sf-sdlc env status*)
---
Run `node .claude/bin/sf-sdlc setup` and show its output as it is: the checklist table, then
"Your turn", then "Claude can do these", then "Optional". It is safe to run at any time; it only
creates what is missing.

Then add, only if they say something the checklist does not:
- errors and warnings from `node .claude/bin/sf-sdlc config validate`, each with the key to change;
- failed required checks from `node .claude/bin/sf-sdlc doctor`.

Do not install anything or sign in to anything here; offer `/sdlc-setup` for that. If nothing needs
the person, say so in one line.
