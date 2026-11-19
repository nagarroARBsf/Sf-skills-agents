---
description: Convert the approved BRD into Jira epics, user stories and a CSV import, in your team's Jira format (SDLC stage 2)
argument-hint: "[BRD path] [Jira project key]"
---
Follow the `sdlc-jira-story-generate` skill in this conversation.

Inputs from the user: $ARGUMENTS

Default BRD: `docs/sdlc/01-brd/BRD.md`. First look for the team's own Jira process and templates in
the project templates folder (`paths.templates`, folder `jira/`) and follow them; without them use the
kit's templates and mention once that `node .claude/bin/sf-sdlc templates copy jira` lets the team add
their own. Write `docs/sdlc/02-backlog/backlog.md` and `jira-import.csv`, and create Jira issues only
if a Jira tool is connected and the user approves the preview. Stop after the report.
