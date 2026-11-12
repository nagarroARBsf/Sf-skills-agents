---
description: Set this project up for the Salesforce SDLC kit in one go — files, skills chosen from the code, tools, Salesforce, Jira and GitHub connections — and show a checklist of what is done and what is left
argument-hint: "[optional: developer | admin | ba, or an org alias]"
---
Set this project up by following the `sdlc-project-setup` skill **yourself, in this conversation**.

From the user: $ARGUMENTS

1. If the `sdlc-project-setup` skill is not available in this session, the plugin was installed after
   the session started. Say so in one line, ask the person to run `/reload-plugins` (or restart Claude
   Code) and then run this command again, and stop.
2. Run `node .claude/bin/sf-sdlc setup --json` **first, before asking anything**. It creates the
   project files, explores the code, installs the skills the code needs, checks every tool and
   connection, and returns the checklist.
3. Show the checklist, ask the few questions it marks (in one batch), do what the person agrees to,
   and finish with the final checklist — exactly as the skill describes.

Do not hand setup to a subagent and do not run it in the background: a subagent cannot ask the person
anything, and they cannot see its progress. Only the deeper code study (baseline and grounding
drafts) goes to the **sdlc-project-scout-agent** subagent, after the checklist is on screen. Never ask
for or read a credential.
