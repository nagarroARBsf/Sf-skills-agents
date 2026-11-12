# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not a Salesforce project** — it is the *kit that gets installed into* Salesforce projects,
for Claude Code. It ships 10 SDLC agents, 22 commands, 11 always-available `sdlc-*` skills, a
176-skill on-demand library, guard hooks, the `sf-sdlc` CLI, output styles and workflows, in two
forms:

- `.claude/` — the copy-in folder, and the **single source of truth**.
- `plugins/sf-sdlc/` — the Claude Code plugin, **generated** from `.claude/` (marketplace `nagarro-sf`).

Almost every tracked file is payload. The repo-owned code is: `.claude/hooks/*.js`,
`.claude/bin/sf-sdlc`, `.claude/bin/sf-mcp-proxy`, `.claude/bin/sf-atlassian-mcp`, `.claude/workflows/*.js`, `scripts/*`, `tests/kit.test.js`, and the
hand-written plugin files listed under "Claude Code plugin". Work here is editing kit content,
the Node tooling, or the generator.

### `.claude/` is payload, but it is also live in this repo

Claude Code loads `.claude/CLAUDE.md`, `.claude/rules/` and `.claude/settings.json` here, so:

- `.claude/CLAUDE.md` and the rules are instructions written for the *downstream Salesforce
  project*. Their rules (Apex `with sharing`, the `/sdd-specify`-before-coding gate, "never deploy
  to prod") apply to generated Salesforce metadata, not to work in this repository. There is no
  `force-app/`, `docs/sdlc/` or `specs/` here. Treat them as files to maintain, not as orders.
- The hooks in `.claude/settings.json` **do run** in this repo (session facts, the `sf`/`git`
  guards, the secret guard). That is intended: it dogfoods them. They write local state to
  `.sf-sdlc/` (ignored by git).

## Commands

```bash
python3 scripts/build-claude-plugin.py            # regenerate plugins/sf-sdlc/ and .claude/catalog/skills.json
python3 scripts/build-claude-plugin.py --check    # exit 1 and list stale paths; run before committing
node --test tests/kit.test.js                     # unit tests for hooks, CLI library, catalog consistency
claude plugin validate plugins/sf-sdlc --strict   # validate the plugin
claude plugin validate .                          # validate the marketplace manifest
scripts/update-official-skills.sh --no-sync       # re-vendor official skills from upstream main
scripts/update-official-skills.sh --no-sync <ref> # ...from a tag or commit; re-pins official-skills.lock
node .claude/bin/sf-sdlc help                     # the kit's CLI
```

There is no package manager and no build step. The generator is Python 3 **standard library only**
and the hooks and CLI are Node.js **standard library only** — keep both that way; they run on a
bare checkout and on customer machines with no `npm install`.

`.github/workflows/sf-sdlc-ci.yml` runs the tests and the `--check`. Run both locally too, plus
`claude plugin validate` (CI does not have the Claude Code CLI). After `update-official-skills.sh`,
run `build-claude-plugin.py`.

## GitHub Copilot and Cursor outputs are frozen

`.github/` (except `workflows/`) and `.cursor/` hold the previous release's generated output for
Copilot and Cursor. The owner will rebuild them separately. **Do not run `scripts/sync-platforms.py`**
(it `rmtree`s and rewrites those folders from the new `.claude/`, whose content is now Claude Code
specific) and do not edit or delete those folders. `build-claude-plugin.py` only imports
`sync-platforms.py` for its frontmatter parser; that is safe. Always pass `--no-sync` to
`update-official-skills.sh`.

## Generation model

| Source in `.claude/` | Plugin output | Transformation |
|---|---|---|
| `agents/*.md` | `agents/*.md` | Body paths rewritten |
| `commands/*.md` | `commands/*.md` | `sdlc-`/`sdd-` prefix dropped (`/sdlc-brd` → `/sf-sdlc:brd`); subagent names namespaced |
| `skills/**` | `skills/**` | Paths and command names rewritten in `.md` files |
| `rules/*.md` with `paths:` | `skills/salesforce-coding-rules/` | One skill, one reference per rule |
| `CLAUDE.md` + rules without `paths:` | `context/project-instructions.md` | Printed by the SessionStart hook; must stay under 10,000 characters |
| `skill-library/**` | `skill-library/**` | Verbatim; never loaded |
| `hooks/*.js` + `settings.json` `hooks` | `hooks/*.js`, `hooks/hooks.json` | `$CLAUDE_PROJECT_DIR/.claude/` → `${CLAUDE_PLUGIN_ROOT}/` |
| `settings.json` minus `hooks` | `templates/project-settings.json` | Merged into customer projects by `sf-sdlc init`, which also adds `enabledPlugins` and `extraKnownMarketplaces` (from `metadata.marketplace` in `plugin.json`) |
| `CLAUDE.md` + `rules/*.md` | `templates/project/rules/` | `CLAUDE.md` becomes the always-on rule `sf-sdlc-kit.md`; CLI and command names rewritten, `.claude/rules/` kept. `sf-sdlc init` copies them into a plugin user's `.claude/rules/` (hash-locked; edited files are kept) and the SessionStart hook then stops printing `context/` |
| `bin/`, `catalog/`, `templates/`, `output-styles/`, `workflows/` | same | Copied; text rewritten |

Body rewrites (`PATH_REWRITES` in the build script): `node .claude/bin/sf-sdlc` → `sf-sdlc`;
`.claude/skills/sdlc-…` → `${CLAUDE_PLUGIN_ROOT}/skills/sdlc-…`; `.claude/rules/`,
`.claude/skill-library/`, `.claude/catalog/`, `.claude/templates/` likewise. A bare `.claude/skills/`
is deliberately **not** rewritten: it means the project's own installed skills in both forms.
`/sdlc-x` and `/sdd-x` are rewritten only when `x` is a real command file.

**Never edit generated paths in `plugins/sf-sdlc/`**: `agents`, `commands`, `skills`,
`skill-library`, `context`, `hooks`, `bin`, `catalog`, `output-styles`, `workflows`, `templates`.
They are `rmtree`d on every build. Two files inside `.claude/` are also generated:
`catalog/skills.json` and `skill-library/README.md`.

## Authoring conventions the generator and tests depend on

- **Frontmatter** stays simple: `key: value`, optionally quoted, and `key:` followed by two-space
  `- item` lists. No block scalars (`|`, `>`) or flow collections.
- **Always write the CLI as `node .claude/bin/sf-sdlc <command>`** in agents, commands, skills and
  workflows. Any other spelling survives unrewritten and fails for plugin users.
- **Commands** that route to an agent open with exactly `Use the **<agent-name>** subagent to <verb>…`.
  Use `$ARGUMENTS`. Commands that change an org, Jira or GitHub carry
  `disable-model-invocation: true` so only a person can start them.
- **Agents**: frontmatter `name` equals the file name; `skills:` lists only skills that exist in
  `.claude/skills/` (the tests check this). Omit `tools:` when the agent needs MCP tools. The
  code-review agent has no `Write`/`Edit` on purpose. Agents must not assume a technical skill is
  loaded — skills are installed per project.
- **Skills**: frontmatter `name` equals the folder name; `description` ≤ 1,024 characters after
  whitespace collapsing (the build warns).
- **No project-specific values** in agents, commands or skills. Org aliases, branch names, Jira
  keys, thresholds and paths come from `.claude/sf-sdlc.json`; defaults live in `DEFAULTS` in
  `.claude/hooks/lib.js`. A new config key needs: the default there, validation in
  `validateConfig`, a row in `SETUP.md`, and the example in `.claude/templates/sf-sdlc.example.json`.
- **Workflows** (`.claude/workflows/*.js`): `export const meta = {…}` is the first statement and a
  plain literal; no `Date.now()`, `Math.random()` or imports.

## Hooks and CLI

`.claude/hooks/run.js <hook>` is the single dispatcher (`session-start`, `pre-bash`, `pre-write`,
`pre-mcp`, `post-write`, `post-bash`, `bash-failure`, `stop`); `lib.js` holds config, command parsing
and org classification; `ops.js` the Code Analyzer wrapper, inventory and delta; `checks.js` the
source checks and secret patterns; `mcp.js` the Salesforce Hosted MCP routes (six servers; two on by default), JWT minting, probe and the no-tools handshake; `envfile.js` the
project `.env` (template, parse, names-only status — never values).
`.claude/bin/sf-sdlc` is the CLI over the same modules; `sf-sdlc setup` is the one-run setup (git, project
files, skills chosen from the code inside the listing budget, every check) that prints the checklist
`/sdlc-setup` shows — the command runs in the main conversation, never in a subagent, because a
subagent cannot ask the person anything; `.claude/bin/sf-atlassian-mcp` starts the
community `mcp-atlassian` server with `.env` tokens (or serves no tools); `.claude/bin/sf-mcp-proxy <server>` is the
stdio MCP bridge Claude Code starts (registered in the plugin's `.mcp.json` and, for the copy-in
folder, in the project `.mcp.json` that `sf-sdlc init` merges from `templates/mcp.json`).

Rules that must hold when changing them:

- The org guard and the secret guard enforce in every hook mode, and a guard that throws must end in
  an `ask`, never a silent allow.
- An org that cannot be classified is never treated as safe.
- `sf-sdlc deploy …` runs `sf` itself, so `kitInvocations` in `run.js` maps it onto the guarded `sf`
  command; keep the two in step.
- Hooks must not make network calls other than through the `sf` CLI, and must not print credentials.
  The proxy (not a hook) talks to `api.salesforce.com` with a JWT from `sf api request rest
  /ide/auth`; it must never print or store that JWT. Hosted MCP tools that can change an org
  (`WRITE_TOOLS` in `mcp.js`) always get `ask` from `pre-mcp`.
- `.env` values are never printed, logged or returned: `sf-sdlc env status` reports names only, and
  `permissions.deny` blocks `Read(./.env)`. Tokens reach only the child process that needs them.
- `sf-sdlc env set` writes only the non-secret keys in `PLAIN_KEYS` (`envfile.js`); never add a token key.
- A hosted server whose tool names are unknown is marked `'*'` in `WRITE_TOOLS`: every tool asks unless
  its name is plainly a read.
- Add a test in `tests/kit.test.js` for any new guard decision or check.

## Claude Code plugin

Hand-written, never touched by the generator: `plugins/sf-sdlc/.claude-plugin/plugin.json`
(including `userConfig` and `metadata.marketplace`, which `init` writes into project settings), `.mcp.json` (Atlassian remote server, `atlassian-token`, and the six `sf-*` hosted-MCP proxies), `monitors/monitors.json`,
`themes/*.json`, `README.md`, `NOTICE`. Monitors and themes are experimental in Claude Code.
A plugin `settings.json` is deliberately not shipped: it honours only `agent` and
`subagentStatusLine`. Bump `version` in `plugin.json` when releasing, or installed copies will not
update. `.claude-plugin/marketplace.json` carries a `renames` entry from the old plugin name
`nagarro-sf-sdlc`.

## Skill provenance — three kinds, three rules

- **158 official** skills vendored from [forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills),
  Apache-2.0, pinned in `scripts/official-skills.lock`. **Do not hand-edit** —
  `update-official-skills.sh` `rm -rf`s each listed folder. To add or drop one, edit
  `scripts/official-skills.txt`. The script also finds skills that exist only inside an upstream
  plugin. Industry packs are deliberately excluded.
- **18 community** `sf-*` skills from Clientell-Ai/salesforce-skills, Apache-2.0. Edited in place in
  `.claude/skill-library/`; mark changed files as changed (Apache-2.0 requirement).
- **11 Nagarro SDLC** skills (`sdlc-*`), edited in place in `.claude/skills/`.

All technical skills live in `skill-library/`; only `sdlc-*` skills are in `skills/` (a test
enforces this). Which library skills a project gets is decided by
`.claude/catalog/detection-rules.json` — add a rule there when adding a skill family. Attribution is
in `NOTICE`; keep it current. Official skills bundle their own scripts and assets; none of that is
this repo's code — do not refactor or lint it.

Five official skills (`automation-flow-generate`, `platform-flexipage-generate`,
`experience-lwr-site-generate`, `platform-lightning-app-coordinate`, `experience-lwc-widget-migrate`)
expect Salesforce's Metadata Experts MCP server; they work when `metadata-experts` is in
`mcp.servers` (on by default) and turned on in the org. Detection still recommends `sf-flow` for
Flows. `platform-capability-search` and `platform-lsp-integrate` are deliberately not vendored: they
drive scripts that exist only in Salesforce's own plugin.

## The product this kit delivers

Lifecycle: setup → ground → BRD → stories → architecture → spec/plan → build → review → deploy →
test → re-test → release → observe. Each stage runs in its own agent, writes a **draft** and stops for human review;
only a person fills in an approval record. Stages are decoupled by a shared ID scheme
(`BR-04` → `FR-04.2` → `US-04-02` → `LLD-US-04-02` → `TC-US-04-02-007` → `TR-…` → `DEF-nnn` →
`DEP-nnn` → `REL-x.y.z`). The ID scheme, artifact layout and feasibility checklist live in the
`sdlc-workflow` skill and are referenced by every agent — change them there, not per agent.

Integrations: Salesforce through the `sf` CLI, plus Salesforce Hosted MCP Servers (Metadata
Grounding, Metadata Experts, optional Headless 360 and Data 360) through `sf-mcp-proxy`, signed in
with the CLI login — no local Salesforce MCP package (`@salesforce/mcp` ended on 2 November 2026); Jira through the Atlassian remote MCP when connected, otherwise CSV; GitHub
through the `gh` CLI.

`README.md` lists the known limitations honestly, including what has not been run against a real
org. Keep that list true when changing behaviour.
