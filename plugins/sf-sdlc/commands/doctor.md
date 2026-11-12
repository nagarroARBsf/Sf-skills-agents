---
description: Show the setup checklist — what is done, what Claude can do for you, and what still needs you
allowed-tools: Bash(sf-sdlc setup*), Bash(sf-sdlc doctor*), Bash(sf-sdlc config*), Bash(sf-sdlc env status*)
---
<!-- Generated from .claude/commands/sdlc-doctor.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Run `sf-sdlc setup` and show its output as it is: the checklist table, then
"Your turn", then "Claude can do these", then "Optional". It is safe to run at any time; it only
creates what is missing.

Then add, only if they say something the checklist does not:
- errors and warnings from `sf-sdlc config validate`, each with the key to change;
- failed required checks from `sf-sdlc doctor`.

Do not install anything or sign in to anything here; offer `/sf-sdlc:setup` for that. If nothing needs
the person, say so in one line.
