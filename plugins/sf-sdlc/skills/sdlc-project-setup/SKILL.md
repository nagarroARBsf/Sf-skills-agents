---
name: sdlc-project-setup
description: "Set a Salesforce project up for the SDLC kit, for technical and non-technical users: check the environment and offer installs (Node.js, git, Salesforce CLI, Code Analyzer, Java, gh, uv), connect the Salesforce org, hosted MCP servers, Jira/Confluence (browser sign-in or API token in .env) and GitHub, create the git-ignored .env template without reading its values, install the project files (plugin on at project scope, coding rules), explore the code, fill .claude/sf-sdlc.json from detection first and questions second, install the core skills plus those the project needs, record the baseline and draft the grounding files. TRIGGER when: user asks to set up, onboard or configure a project, connect Salesforce, Jira or GitHub, which skills to install, what a config key means, reports a failing doctor check, or runs /sf-sdlc:setup, /sf-sdlc:doctor or /sf-sdlc:skills. DO NOT TRIGGER when: the user wants architecture work (use sdlc-solution-architecture-generate) or a deployment (use sdlc-deploy-release)."
metadata:
  version: "2.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-project-setup

Get the person's environment working, connect what they use, then find out what the project holds
before anyone designs or builds. **Detect first, ask second, never guess.**

Sequence: who is running setup → environment → project files → connections and `.env` → explore the
code → configuration → skills → baseline → grounding → final check.

## Ground rules
- Read-only towards orgs and source: setup does not deploy, retrieve into the source tree, change an
  org, or edit Salesforce metadata. It writes only the files `init` creates, `.claude/sf-sdlc.json`,
  `.claude/sf-sdlc.local.json`, installed skills and their lock file, the baseline inventory and the
  grounding drafts.
- Never read, print or write credentials: not CLI auth (`.sf/`, `.sfdx/`, auth URLs, access tokens),
  and not `.env`. `sf-sdlc env status` is the only way to look at `.env`; it reports
  names, never values. Never ask for a token in the chat.
- Never guess which org is production. An empty `orgs.production` is reported as a risk.
- Install a tool, sign in, or install skills only after the person says yes.
- Every step can be skipped. Record what was skipped and what does not work until it is done.

## Where the kit lives (explain this once, in plain words)
This follows Claude Code's documented practice for team plugins.

| Part | Lives in | Committed |
|---|---|---|
| Commands (`/sf-sdlc:…`), agents, hooks, the `sf-sdlc` CLI, output styles, workflows, MCP server definitions, the skill library | The plugin (Claude Code's plugin cache; updated with the plugin) | n/a |
| Plugin turned on for the whole team (`enabledPlugins`, `extraKnownMarketplaces`), kit permissions, `.env` read-deny | Project `.claude/settings.json` | Yes |
| Coding rules and the kit instructions (`sf-sdlc-kit.md`) | Project `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/` (plugins cannot ship rules) | Yes |
| Configuration | `.claude/sf-sdlc.json` | Yes |
| Installed technical skills and their lock file | `.claude/skills/`, `.claude/sf-sdlc.skills.lock.json` | Yes |
| Personal overrides | `.claude/sf-sdlc.local.json`, `.claude/settings.local.json` | No |
| Tokens (Jira, Confluence, GitHub) | `.env` | **Never** |
| Salesforce and Atlassian logins | The sf CLI and Claude Code keep them in the user's home folder | Never |

The copy-in folder (a whole `.claude/` copied into the project) already holds everything above except
the configuration, skills and `.env`.

## 0. Who is running setup
Ask once: developer, admin, or business analyst / product owner / manager. This sets
- the skill profile (`developer`, `admin`, `ba`) for step 6, and
- how to speak: technical people get commands; non-technical people get one plain-language step at a
  time and an offer to run each command for them
  ([references/environment-setup.md](references/environment-setup.md), "Speak to the person").
Skip the question when the command arguments already name the profile.

## 1. Environment
Run `sf-sdlc doctor --json`. Report each failed check in the order below, with why it
matters to this person and the install command for their operating system from
[references/environment-setup.md](references/environment-setup.md). Offer to run it; run it on a yes.
- **Required** failures (Node.js, git, an invalid config): stop until they are fixed, then re-run doctor.
- **Needed for this person's work**: Salesforce CLI, Code Analyzer and Java for developers and
  reviewers; `gh` for whoever opens pull requests or releases.
- **Optional**: sfdx-git-delta, Lightning Flow Scanner, mermaid-cli, uv or Docker (only for token-based
  Jira). Say what stops working without each and continue.
- A business analyst doing requirements work needs Node.js and git; say that the rest was skipped.
- Projects with no Salesforce source and no `sfdx-project.json` are valid; continue.

## 2. Project files
Run `sf-sdlc init --json`. It creates what is missing and keeps what exists:
- `.claude/sf-sdlc.json`, pre-filled with the project name, namespace, main branch, an integration
  branch if one exists, and the default target org as `orgs.dev` when that org is not production;
- `.gitignore` entries for CLI auth, local state, `.env` and personal overrides;
- `.env` from the template (or the kit's missing keys appended; existing values never touched);
- `code-analyzer.yml` and a Code Analyzer CI workflow for Salesforce DX projects, and a pull-request template;
- **plugin users**: `.claude/settings.json` merged with the kit permissions, a read-deny on `.env`, and
  the plugin turned on at project scope; the kit rules copied into `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/`. A later `init`
  updates rule files nobody edited and keeps edited ones (`locally modified; not overwritten`);
- **copy-in folder**: the hosted MCP servers and `atlassian-token` merged into `.mcp.json`.
Report what was created, merged and kept. Tell the person to restart Claude Code once at the end so the
new settings, rules and MCP servers load.

## 3. Connections and `.env`
Follow [references/environment-setup.md](references/environment-setup.md), Connections, in this
order, skipping what this person does not use:
1. **Salesforce org**: `sf org login web --alias <alias>` (browser sign-in), then `org classify`.
2. **Hosted MCP servers**: open the org's Setup with `sf org open --path …`, turn the servers on under
   MCP Servers, then `sf-sdlc mcp status`.
3. **Jira and Confluence**: Option A, browser sign-in through `/mcp` → `atlassian` (recommended);
   Option B, API token in `.env` → the `atlassian-token` server (needs uv or Docker).
4. **GitHub**: `gh auth login`, or `GITHUB_TOKEN` in `.env` and `sf-sdlc env gh-login`.

For `.env`: tell the person the file exists, which keys to fill for the option they chose, and to fill
them **in their editor**. Then run `sf-sdlc env status --json` and report each group
as configured, partial (name the missing keys) or empty. MCP servers read `.env` at start-up, so a
change needs a Claude Code restart. When Jira tools are available, make one read-only call (list
projects) to confirm the connection and to fill the `jira` configuration in step 5.

## 4. Explore the code
Run `sf-sdlc detect --json`. Read from it: Salesforce DX or not, greenfield or not,
API version, package directories, namespace, packaging, metadata folders and counts, tooling files
(`package.json`, Jest config, scratch definition, CI files, `code-analyzer.yml`), and which SDLC
documents already exist.

Then read, without changing anything:
- `git remote -v`, `git branch -a`, recent branch names and commit subjects (branch model,
  ticket-key pattern, commit convention);
- `sf org list --json` for authorised aliases, and
  `sf-sdlc org classify <alias> --json` for each alias the project might use;
- `README`, contribution guide, CI workflow files (which branches deploy where, test levels);
- a sample of the source: the trigger framework, a service and a selector class, a test data
  factory, naming prefixes, logging, the largest LWC and Flow folders;
- an existing `specs/constitution.md`, `docs/sdlc/` and `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/`.
Summarise what the project is in five lines or fewer before asking anything.

## 5. Configuration
Fill `.claude/sf-sdlc.json` using
[references/config-reference.md](references/config-reference.md) (every key: meaning, example,
how to detect it, whether to ask).

1. **From detection, without asking**: `salesforce.*` (leave `"auto"` unless the project
   overrides `sfdx-project.json`), `git.mainBranch`, `git.integrationBranch`,
   `git.pullRequestBase`, `git.branchPattern` and `git.commitPattern` when history shows one
   consistent convention, `project.name`.
2. **Proposed from evidence, confirmed by the user**: org aliases per role (from `sf org list`
   and the classifier), `git.protectedBranches`, `deploy.pipeline` and `deploy.testLevel` (from
   CI files), `quality.*` (from an existing constitution, CI thresholds or `code-analyzer.yml`).
   Show the evidence with each proposal.
3. **Asked, because they cannot be detected**: `orgs.production` (which aliases are production),
   `project.code` and `project.client`, the Jira block when no Jira tool is connected, the
   promotion order if CI does not show it, the branch model if history is inconsistent.
4. Ask the open questions **in one batch**, each with the detected default. Do not ask what was
   detected. Leave a key at its default and list it as "unset" rather than inventing a value.
5. Jira: when a Jira tool is connected, read the site, issue types, field IDs and transitions from
   the project and propose them; otherwise ask the user to supply them later. Never guess a
   `customfield_…` ID.
6. Personal values (a developer's own default org) go in `.claude/sf-sdlc.local.json`, which is
   not committed.
7. Run `sf-sdlc config validate --json`. Fix every error; report every
   warning with the key to change.

Safety checks on the result: every alias in `orgs.production` classifies as production (or the
user confirms an exception); no production alias also appears under `orgs.dev`, `qa` or `uat`;
`deploy.testLevel.production` is not `NoTestRun`; `deploy.allowDirectProductionDeploy` stays
false unless the user explicitly sets it.

## 6. Skills
The `sdlc-*` skills are always available from the kit. Salesforce technical skills are installed
per project into `.claude/skills/`, and every installed skill costs context in every session.

1. Run `sf-sdlc skills recommend --json` (add `--profile developer|admin|ba` when
   there is little or no source to detect from).
2. **Core set, every project and profile**: diagrams (`sf-diagram`,
   `external-diagram-mermaid-generate`), Salesforce documentation, SOQL, API context, environment
   check and org management (the `core` rule in `catalog/detection-rules.json`). Every Salesforce DX
   project adds deploy, retrieve and the official Code Analyzer (the `base` rule).
3. **Explain each further recommendation with its evidence**, taken from the output's reasons
   ("the project contains Lightning Web Components: `lwc/` has 14 bundles").
4. **Add what detection cannot see**, each with its own stated reason:
   - org-only features that are not in source (Experience Cloud sites, OmniStudio, Agentforce,
     Data Cloud, managed packages) — from `sf package installed list --target-org <alias>` on a
     non-production org the user names, or from the user;
   - planned work in the BRD, backlog or HLD (an integration, a mobile requirement, a data
     migration) that needs a skill the current source does not justify;
   - team conventions (a test framework, a DevOps tool).
   Find candidates with `sf-sdlc skills list --all --json`.
5. **Remove what is not needed**: recommendations for metadata the team will not touch.
6. **Profiles**: *business analyst or manager* — the core set only; *admin* — the core set plus data
   model, permissions, Flow, validation and sharing; *developer* — the above as needed, plus Apex,
   Apex tests, LWC, deployment and analysis. A mixed team installs for the work the repository holds.
7. Show the final list (install, already installed, removed, with reasons) and **wait for
   confirmation**. Then `sf-sdlc skills install <names> --json`.
8. **Keep the set small.** `doctor` reports the skill listing budget; if it is exceeded, propose
   removals (`sf-sdlc skills remove <names>`) before adding anything.
9. The lock file `.claude/sf-sdlc.skills.lock.json` records source and content hash per
   installed skill (and per installed rule file); it is committed with the skills.

**Upgrades and local edits.** After a kit upgrade run `sf-sdlc init` (updates
unedited rule files) and `sf-sdlc skills sync --dry-run --json`, show what would
change, then `skills sync`. Skills or rules whose content differs from the lock are **locally
modified**: sync and init leave them alone and report them. Never overwrite or force-remove a locally
edited file; show the user the name and let them decide. Skills in `.claude/skills/` that the kit did
not install are "unmanaged" and are never touched.

## 7. Baseline
For an existing project (detection shows metadata), record what exists so that later designs
can mark components New, Changed, Unchanged or Removed:
1. `sf-sdlc inventory --json`.
2. Write `docs/sdlc/03-architecture/baseline/inventory.md` (root from `paths.docs`) using the
   baseline template in
   `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-solution-architecture-generate/references/baseline-template.md`:
   classification, baseline commit, counts by metadata type, conventions found in step 4 (trigger
   framework, naming prefix, test data factory, logging), automation per object, gaps.
3. State what the source tree cannot show (components created in Setup and never retrieved)
   and list it as a gap. Check an org only when the user names a non-production one.

Greenfield: write the short greenfield statement in the same file. Requirements-only projects:
skip the baseline and say so.

## 8. Grounding
Draft the two grounding files described in the `sdlc-workflow` skill (section Grounding), under
`<paths.docs>/00-grounding/`. Never overwrite existing ones; propose additions instead.

1. **Hosted MCP status**: use the result of step 3 (`sf-sdlc mcp status --json`).
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

## 9. Final check
Run [references/setup-checklist.md](references/setup-checklist.md), then
`sf-sdlc doctor --json`, `sf-sdlc config validate --json` and
`sf-sdlc env status --json` once more.

Report, in this order (plain language for non-technical people):
1. Environment: what is installed, what was installed now, what was skipped and why.
2. Connections: Salesforce org(s) and their classification, hosted MCP servers, Jira/Confluence
   (which option), GitHub — each connected, skipped, or waiting on the person (and what to do).
3. What was detected (project type, greenfield or brownfield, API version, main metadata).
4. The configuration: values set and where each came from (detected / confirmed / supplied).
5. **Still unset**, each with who should supply it and what does not work until then
   (for example "`orgs.production` empty: production is recognised only by org type").
6. Skills installed and why; skills deliberately not installed; locally modified skills or rules.
7. Failed doctor checks with the fix for each.
8. Baseline path, or why none was written; grounding files and whether the grounding MCP was used.
9. Next steps: restart Claude Code; commit `.claude/settings.json`, `${CLAUDE_PLUGIN_ROOT}/skills/salesforce-coding-rules/references/`,
   `.claude/sf-sdlc.json`, `.claude/skills/`, the lock file and `.gitignore` (never `.env`);
   teammates who clone the repository trust the folder and install the plugin once with
   `claude plugin install sf-sdlc@nagarro-sf --scope project`; then `/sf-sdlc:brd` for new
   requirements, or `/sf-sdlc:constitution` and `/sf-sdlc:specify` for build work.

The configuration is a draft until the project lead confirms it. Do not start another stage.
