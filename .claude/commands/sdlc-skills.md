---
description: Recommend, install, remove or update the Salesforce skills this project needs
argument-hint: "[recommend | install <names> | remove <names> | list | sync]"
---
Use the **sdlc-project-scout-agent** subagent to manage this project's skills.

Request from the user: $ARGUMENTS

With no request, run `node .claude/bin/sf-sdlc skills recommend --json`, explain each recommendation
with its evidence, add skills that detection cannot see (org-only features, work planned in the BRD
or backlog) and wait for the user to confirm before installing. `sync` updates installed skills from
the library and reports locally modified ones without overwriting them. Finish with the installed
list and its listing size, and remind the user to restart the session so new skills load.
