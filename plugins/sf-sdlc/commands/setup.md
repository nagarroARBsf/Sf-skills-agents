---
description: Set this project up for the Salesforce SDLC kit in one go — files, skills chosen from the code, tools, Salesforce, Jira and GitHub connections — and show a checklist of what is done and what is left
argument-hint: "[optional: developer | admin | ba, or an org alias]"
---
<!-- Generated from .claude/commands/sdlc-setup.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Set this project up by following the `sf-sdlc-setup` skill **yourself, in this conversation**.

From the user: $ARGUMENTS

1. If the `sf-sdlc-setup` skill is not available in this session, the plugin was installed after
   the session started. Say so in one line, ask the person to run `/reload-plugins` (or restart Claude
   Code) and then run this command again, and stop.
2. Run `sf-sdlc setup --json` **first, before asking anything**. It creates the
   project files (`.env` and `.env.sample` among them), installs the mandatory core skills (`drawio-skill`
   and every Salesforce `platform-*` skill) plus the on-demand skills the code needs, checks every tool
   and connection — including Python 3 and draw.io desktop for the architecture diagrams and the
   Playwright browser for UI tests — and returns the checklist.
3. Show the checklist, ask the few questions it marks (in one batch), do what the person agrees to,
   and finish with the final checklist — exactly as the skill describes. On a yes, missing tools
   (Python 3 and draw.io desktop among them) are installed with
   `sf-sdlc setup --install-tools --json`.

Do not hand setup to a subagent and do not run it in the background: a subagent cannot ask the person
anything, and they cannot see its progress. For an existing codebase, the deeper study (baseline and
grounding drafts, the skill's "Explore an existing codebase" section) follows once the checklist is
on screen. Never ask for or read a credential.
