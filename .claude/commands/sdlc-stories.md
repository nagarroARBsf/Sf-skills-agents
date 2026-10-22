---
description: Convert the approved BRD into Jira epics, user stories and a CSV import (SDLC stage 2)
argument-hint: "[BRD path] [Jira project key]"
---
Use the **sdlc-jira-story-agent** subagent to build the backlog.

Inputs from the user: $ARGUMENTS

Default BRD: `docs/sdlc/01-brd/BRD.md`. The agent follows the `sdlc-jira-story-generate` skill,
writes `docs/sdlc/02-backlog/backlog.md` and `jira-import.csv`, and creates Jira issues only if a
Jira tool is connected and the user approves the preview. Stop after the report.
