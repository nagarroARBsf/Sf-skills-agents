---
description: Recommend, install, remove or update the Salesforce skills this project needs
argument-hint: "[recommend | install <names> | remove <names> | list | sync]"
---
<!-- Generated from .claude/commands/sdlc-skills.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sf-sdlc-setup` skill, section "Skill requests", in this conversation.

Request from the user: $ARGUMENTS

With no request, run `sf-sdlc skills recommend --json`, explain each recommendation
with its evidence, add skills that detection cannot see (org-only features, work planned in the BRD
or backlog) and wait for the user to confirm before installing. `sync` updates installed skills from
the library and reports locally modified ones without overwriting them. Finish with the installed
list and its listing size, and remind the user to restart the session so new skills load.
