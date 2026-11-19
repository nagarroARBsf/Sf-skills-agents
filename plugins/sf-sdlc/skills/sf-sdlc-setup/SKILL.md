---
name: sf-sdlc-setup
description: "Setup skill for the sf-sdlc kit itself, not a lifecycle stage. Sets a Salesforce project up in one run: runs sf-sdlc setup first (project files, .env, core skills plus those the code needs, checks of tools, org, MCP servers, browser, Jira, GitHub), shows a checklist of what is done, what Claude can do on a yes and what needs the person, asks only what cannot be detected, then installs tools, signs in and fills .claude/sf-sdlc.json. Also adds, removes and syncs skills, manages project templates, and studies an existing codebase (baseline, ontology, feature map). Runs in the main conversation; never reads a credential. TRIGGER when: user asks to set up, onboard, upgrade or configure the kit or a project, connect Salesforce, Jira or GitHub, add or remove skills, explore or re-scan the code, reports a failing doctor check, or runs /sf-sdlc:setup, /sf-sdlc:doctor or /sf-sdlc:skills. DO NOT TRIGGER when: the user wants design work or a deployment."
metadata:
  version: "4.0"
  author: "Nagarro Salesforce CoE"
---

# sf-sdlc-setup

The setup skill for the kit itself. It is not one of the lifecycle stages: it prepares the project so
the stages (BRD, stories, design, spec-driven build, review, deploy, test, release) can run.

Do the work first, then show a checklist, then ask only what nobody could detect. The person running
setup may never have used a terminal. **Do everything you can; tell them exactly what is left.**

## How setup runs (read this before anything else)
- **Run it yourself, in the main conversation.** Never hand setup to a subagent and never run it in the
  background: a subagent cannot ask the person anything and they cannot see its progress.
- **One command does the detectable work:** `sf-sdlc setup --json`. Run it before
  asking a single question. It is safe to run again at any time.
- **Never ask what can be detected.** Not which skills, not which MCP servers, not the project type,
  not the branch. Setup decides from the code and says what it chose and why.
- **Always show the checklist** (format below) after the first run and again at the end. Never replace
  it with paragraphs.
- **Plain words.** Say what a step does for the person ("lets Claude read your Jira backlog"), not how
  it works. Show a command only as something Claude will run for them, or inside "Your turn".

## Ground rules
- Read-only towards orgs and source: setup does not deploy, retrieve into the source tree, change an
  org, or edit Salesforce metadata.
- Never read, print or write a credential: not CLI auth (`.sf/`, `.sfdx/`, auth URLs, access tokens)
  and not `.env`. Never ask for a token in the chat. If one is pasted, tell the person to revoke it.
- Addresses and user names are not secrets: write them with
  `sf-sdlc env set JIRA_URL=… JIRA_USERNAME=…`. It refuses tokens.
- Installing software and opening a sign-in window happen only after the person says yes — asked
  once, for everything together.
- Never guess which org is production. Treat an org that cannot be classified as production.
- Never invent an MCP server, a URL or a config key. The Salesforce servers the kit supports are the
  ones `sf-sdlc mcp list` prints; anything else is "not supported by the kit yet".

## 1. Run setup
`sf-sdlc setup --json` (add `--profile developer|admin|ba` only when the person
already said who they are; add `--org <alias>` when they already named the org).

In one run it:
- creates a git repository when there is none;
- writes the project files: `.claude/sf-sdlc.json`, `.gitignore` entries, `.env` (git-ignored) and
  `.env.sample` (the same keys with no values, committed: Salesforce login address, user name and
  alias; optional hosted MCP address overrides; Jira, Confluence and GitHub tokens), `code-analyzer.yml`, and for plugin users `.claude/settings.json` (plugin on for the whole team) and
  the coding rules in `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/`;
- installs the **mandatory core set** into `.claude/skills/` for every project, whatever it contains:
  `drawio-skill` and the other diagram skills, org management and **every official Salesforce
  `platform-*` skill** (Apex, objects, fields, permissions, SOQL, metadata, deploy, documentation…).
  The `sdlc-*` skills come with the kit itself. Then it explores the code and adds the **on-demand**
  skills it calls for (LWC, Flow, OmniStudio, Experience Cloud, integration…) — as many as fit the
  skill listing budget, which applies to on-demand skills only. The rest are listed, not installed;
- checks every tool, the Salesforce org, the hosted MCP servers, the browser for UI tests
  (Playwright), Jira and GitHub;
- returns `steps[]`, each with `area`, `item`, `state`, `detail`, and where relevant `url`, `command`,
  `ask`, `choices`.

`state` is one of: `done`; `claude` (Claude can do it on a yes); `you` (only the person can, with the
link or command); `optional`; `skipped`.

## 2. Show the checklist
Print this, filled from `steps[]`, and nothing longer:

```
## Setup checklist — <project>
<n> done · <n> need you · <n> I can do for you · <n> optional

| | Step | Status |
|---|---|---|
| ✅ | <item> | <detail, short> |
| 🔧 | <item> | I can do this — say yes |
| 👉 | <item> | Needs you (see below) |
| ➖ | <item> | Optional / Skipped |

### 👉 Your turn
1. **<item>** — <one plain sentence: what to do and why>. Link: <url>

### 🔧 I can do these for you
1. **<item>** — <what happens, e.g. "a browser window opens and you sign in">
```
Keep every ✅ row (people want to see what was done). Put the links in the chat exactly as returned;
never tell the person to "find" a page. Group the optional rows into one line when there are many.

## 3. Ask once, only what is marked
Use one AskUserQuestion batch (at most four questions), each with a recommended first option. Ask
only what applies:
- **Which org is this project for?** — only when a step has `ask: "org"`; the options are its
  `choices` (alias and kind). Never ask when setup already found the org.
- **Shall I install and sign in to what is missing?** — only when there are `claude` steps. One yes
  covers all of them.
- **Do you use Jira?** — only when a step has `ask: "jira"`: "Yes, sign in through the browser"
  (recommended), "Yes, with an API token", "No".
- **What will you mostly do here?** (build / configure / write requirements) — only when the project
  has no Salesforce source to detect from.
Do not ask about skills, MCP servers, branch names, API versions or anything in `detail`.

## 4. Do what was agreed
Run each of these yourself and say in one line what happened:
- **Org chosen:** `sf-sdlc setup --org <alias> --json`. It records the org for the
  project and for the MCP servers; a production org goes to `orgs.production` and stays protected.
- **No org signed in:** ask for the login address (production/Developer Edition, sandbox, or My
  Domain) and alias, write them with `sf-sdlc env set SF_LOGIN_URL=… SF_ORG_ALIAS=…`
  (add `SF_USERNAME=…` when they give it), then run `sf-sdlc org login`. Tell the
  person a browser window opens. Then `setup --org <alias>`.
- **Missing tools:** `sf-sdlc setup --install-tools --json` installs the Salesforce
  CLI, Code Analyzer and the optional CLI plugins, and — for the architecture diagrams — Python 3 and
  draw.io desktop where that needs no administrator password (Homebrew on macOS, winget on Windows).
  Tools that need an administrator password (Node.js, git, Java, GitHub CLI; Python and draw.io on
  Linux) stay under "Your turn" with the command for their system. Under WSL, draw.io installed on
  Windows is found automatically.
- **GitHub:** `gh auth login --web --git-protocol https`.
- **Jira, browser sign-in:** the person types `/mcp`, chooses `atlassian` (plugin users see
  `plugin:sf-sdlc:atlassian`), chooses **Authenticate**. Claude cannot do this step; say so.
- **Jira, API token:** ask for the site address and the Atlassian e-mail (not secrets), write them with
  `env set`, then give the token link and ask the person to type the token into `.env` as
  `JIRA_API_TOKEN` in their editor. Fill `jira.site` and `jira.projectKey` in the config from the
  address or board link they gave.
- **No Jira:** `sf-sdlc setup --no-jira --json`.
- **Values the person volunteers** (project code, client, which org is UAT): write them to
  `.claude/sf-sdlc.json` and run `sf-sdlc config validate`. Keys:
  [references/config-reference.md](references/config-reference.md).

## 5. Salesforce MCP servers: state the defaults, offer the rest
Do not ask "which servers do you want". Say:
- **On by default:** the servers in `mcp.servers` (Metadata Experts and Metadata Grounding).
- **Also available:** the rest of `sf-sdlc mcp list` with its one-line summary —
  SObject Reads (read records and schema), SObject All (read and change records), Headless 360,
  Data 360. Add one with `sf-sdlc mcp enable <name>`; remove with `mcp disable`.
- Each server must also be switched on in the org. That is the person's step: give the Setup link from
  the checklist (`url`) and "type MCP in Quick Find → MCP Servers → turn on <name>".
- In `/mcp` a Salesforce server showing "no tools" means it is not switched on in the org yet. That
  is normal, not an error.
- A server the kit does not list cannot be added through the kit. Say that plainly; do not guess a URL.
Details: [references/environment-setup.md](references/environment-setup.md).

## 5b. Browser for UI tests
Say it in one line: "Claude can test your org in a real browser. The first time, a window opens at your
org and you sign in yourself; the sign-in is kept for later sessions, even after a restart." Nothing
to ask: setup already set the browser up to keep it. If the row is
👉, it needs Node.js (npx). Never ask for or type the Salesforce password; never read
`.sf-sdlc/browser-profile/`. Details: section 5 of
[references/environment-setup.md](references/environment-setup.md).

## 6. Skills
Setup already installed them. Report in two lines: how many (the mandatory core set — draw.io and every
Salesforce platform skill — plus the on-demand ones), and the reason for the on-demand ones in plain
words ("your project has Lightning components and Flows"). Then:
- skills left out for space are in the step's `availableLater`; install one when the work needs it:
  `sf-sdlc skills install <name>`;
- org-only features the source cannot show (Experience Cloud, OmniStudio, Agentforce, Data Cloud):
  add them only when the person mentions them — `sf-sdlc skills list --all --json`;
- never overwrite a locally modified skill (`skills sync` reports it); skills the kit did not install
  are never touched;
- after a kit upgrade: `sf-sdlc setup`, then `skills sync --dry-run`, then `skills sync`.
  `sf-sdlc doctor` lists files an older kit version left behind (for example agents
  that kit 3.0 replaced with skills); offer to delete exactly those files.

### Skill requests (`/sf-sdlc:skills`)
- **recommend** (default): `sf-sdlc skills recommend --json`; explain each with its
  evidence (the folder or config that triggered it), add what detection cannot see (org-only features,
  work planned in the BRD or backlog), and install only after the person confirms.
- **install / remove `<names>`**: `skills install` / `skills remove`; **list**: `skills list`;
  **sync**: `skills sync` (reports locally modified skills and never overwrites them).
- Finish with the installed list and its listing size, and say a restart (or `/reload-plugins`) loads
  new skills.

## Project templates
Teams that have their own document or Jira formats keep them in the project, not in the kit:
`sf-sdlc templates list` shows every template the kit uses and whether the project
overrides it; `sf-sdlc templates copy <id|all>` copies the kit's version into
`paths.templates` (default `docs/sdlc/templates/`) for the team to edit. Skills use the project's copy
when one exists. Mention this once at the end of setup for teams that have a Jira or document standard.

## Explore an existing codebase (baseline and grounding)
Sections 7 and 8 are the deeper study of an existing codebase, done in this conversation after the
checklist is on screen (or later, when the person asks to explore or re-scan the code). Tell the person
it is running and how long it may take; keep tool output out of the chat and report the result. Read
`git log`, the README, CI files and a sample of the source (trigger framework, a service class, a test
data factory, naming prefixes). Detect first; what cannot be detected becomes a question in the report,
never a guess. MCP lookups are read-only (Metadata Grounding `search_metadata`, `query_metadata`,
`describe_metadata`); never call a tool that changes an org. Finish with at most fifteen lines: what the
project is, the conventions found, the files written, and the open questions for the lead.

## 7. Baseline
For an existing project (detection shows metadata), record what exists so that later designs
can mark components New, Changed, Unchanged or Removed:
1. `sf-sdlc inventory --json`.
2. Write `docs/sdlc/03-architecture/baseline/inventory.md` (root from `paths.docs`) using the
   baseline template in
   `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-architecture-diagram/references/design/baseline-template.md`:
   classification, baseline commit, counts by metadata type, conventions found while reading the source (trigger
   framework, naming prefix, test data factory, logging), automation per object, gaps.
3. State what the source tree cannot show (components created in Setup and never retrieved)
   and list it as a gap. Check an org only when the user names a non-production one.

Greenfield: write the short greenfield statement in the same file. Requirements-only projects:
skip the baseline and say so.

## 8. Grounding
Draft the two grounding files described in the `sdlc-workflow` skill (section Grounding), under
`<paths.docs>/00-grounding/`. Never overwrite existing ones; propose additions instead.

1. **Hosted MCP status**: use the checklist (or `sf-sdlc mcp status --json`).
   If Metadata Grounding is off or inactive, say what it needs and continue without it.
2. **`feature-map.md`** from
   `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-workflow/references/feature-map-template.md`: group the baseline
   inventory by business capability (folder names, naming prefixes, object ownership, the BRD if
   one exists). When the grounding tools are connected, use `describe_metadata` and
   `search_metadata` to find org-only components (flows, fields, permission sets created in
   Setup) and mark them `(org only)`. Otherwise say "grounding not used: local source only".
3. **`ontology.yaml`** from `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-workflow/references/ontology-template.yaml`:
   only the terms that are ambiguous or project-specific (from the BRD, object labels that differ
   from API names, record types that split one object into several business things). Remove the
   template's example terms. Mark every inferred mapping `source: inferred` and list it as a
   question for the lead.
4. Greenfield or requirements-only projects: write the ontology from the BRD when one exists and
   an empty feature map with the header; say so.

Both files are drafts until the lead confirms the terms.

## 9. Finish
Run `sf-sdlc setup --json` once more and print the checklist from section 2 again —
this is the last thing the person sees. Under it, at most four lines:
- what is still theirs to do, in order, each with its link;
- "Restart Claude Code (or run `/reload-plugins`) so the new skills and connections load";
- what to commit: `.claude/`, `.gitignore`, `.env.sample`, `code-analyzer.yml` — never `.env` or
  `.sf-sdlc/`;
- the next step: `/sf-sdlc:brd` for new requirements, or `/sf-sdlc:specify` for build work.

A project lead who wants the full audit: [references/setup-checklist.md](references/setup-checklist.md).
Teammates who clone the repository run `claude plugin install sf-sdlc@nagarro-sf --scope project`
once. Do not start another stage.
