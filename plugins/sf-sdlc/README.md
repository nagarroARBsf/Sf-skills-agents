# sf-sdlc — Salesforce delivery lifecycle for Claude Code (Enterprise Edition 3.1)

Agents, commands, guard hooks and Salesforce skills that take a project from meeting transcripts to
a production release: discovery of existing orgs → BRD → Jira stories → architecture → spec and plan → build → code review →
deployment → testing → re-test → release.

> `agents/`, `commands/`, `skills/`, `skill-library/`, `context/`, `hooks/`, `bin/`, `catalog/`,
> `output-styles/`, `workflows/` and `templates/` are generated from the repository's `.claude/`
> folder by `scripts/build-claude-plugin.py`. Edit the source there, never here.

## Install

In a terminal, inside your Salesforce project folder (this works everywhere, including when Claude
Code runs in VS Code or the desktop app, where the `/plugin` command is not available):

```bash
claude plugin marketplace add nagarroARBsf/Sf-skills-agents
claude plugin install sf-sdlc@nagarro-sf --scope project
```

Then open Claude Code in that folder — or, if it was already open, run `/reload-plugins` so the new
commands and skills load — and run:

```text
/sf-sdlc:setup
```

In the terminal version of Claude Code you can type `/plugin marketplace add nagarroARBsf/Sf-skills-agents`
and `/plugin install sf-sdlc@nagarro-sf` instead; in VS Code, `/plugins` opens the same thing as a
dialog. The repository is private: each person needs read access to it on GitHub and a working git
sign-in (`gh auth login`, or an SSH key).

To try a local checkout: `claude --plugin-dir plugins/sf-sdlc`.

`/sf-sdlc:setup` does the work first and asks afterwards: it creates the project files (and a git
repository if there is none), explores the code, installs the core skills plus the ones the code
needs, checks every tool and connection, and shows a checklist — done, what Claude can do when you
say yes, and what only you can do, with the link for each. It then asks only what it could not detect
(which org, whether you use Jira). `/sf-sdlc:doctor` shows the checklist again at any time.

Setup turns the plugin on at **project scope** in `.claude/settings.json` and copies the coding rules
into `.claude/rules/` (plugins cannot ship rules). Commit those; teammates install the plugin once
with `claude plugin install sf-sdlc@nagarro-sf --scope project`.

Requirements: Claude Code 2.1.271+, Node.js 18+, git; for build and deploy work the Salesforce CLI
with the `code-analyzer` plugin and Java 11+. Full guide: `SETUP.md` in the repository.

## What's inside

| Part | Contents |
|---|---|
| `agents/` | Five: discovery and design (existing orgs, read-only: discovery pack checked against the org, org comparison, fit-gap, HLD draft), BRD, solution architect and QA test (including browser UI tests), where a stage reads large inputs, and the code reviewer (Code Analyzer plus the coding rules, read-only, independent of the author). Planning and development are your coding agent's own plan mode and editing, in the spec-driven format. Every other stage runs in the main conversation under its skill |
| `commands/` | `setup` `doctor` `skills` · `discovery` `brd` `stories` `architecture` `diagram` · `constitution` `specify` `clarify` `plan` `tasks` `implement` `verify` · `review` `analyze` · `test-cases` `test-run` `ui-test` `retest` · `deploy` `release` · `trace` |
| `skills/` | 11 SDLC process skills, `sf-sdlc-setup` (the kit's setup skill) and `salesforce-coding-rules` (Apex, tests, LWC, Flow, metadata, SDLC documents, spec-driven development) |
| `skill-library/` | 177 Salesforce and diagram skills, not loaded; `sf-sdlc skills install` copies the chosen ones into the project |
| `hooks/` | Session facts; production-org, secret, branch, commit and hosted-MCP guards; source checks on write; failure triage; audit log |
| `bin/sf-sdlc` | `doctor`, `init`, `env status\|init\|gh-login`, `config`, `detect`, `inventory`, `delta`, `skills`, `templates list\|copy`, `org classify`, `analyze`, `check`, `deploy`, `test`, `diagram`, `audit`, `mcp status` |
| `bin/sf-atlassian-mcp` | Starts the community `mcp-atlassian` server with the Jira/Confluence tokens from the project's `.env` (uv or Docker); an empty server while they are unset |
| `bin/sf-mcp-proxy` | stdio bridge to one Salesforce Hosted MCP Server, signed in through the `sf` CLI; never stores or prints a token |
| `workflows/` | `sdlc-review-changes`, `sdlc-stories-fanout`, `sdlc-release-readiness` |
| `monitors/` | `deploy-watch`, `test-watch` (experimental in Claude Code) |
| `output-styles/` | Salesforce Business Analyst, Salesforce Developer (terse, evidence-led), Salesforce Manager (high-level status, risks, decisions) |
| `themes/` | SF SDLC Dark, SF SDLC Light (experimental in Claude Code) |
| `.mcp.json` | Atlassian remote MCP server for Jira and Confluence (sign in once with `/mcp`), `atlassian-token` (the same through API tokens in `.env`), and the Salesforce Hosted MCP Servers `sf-metadata-grounding`, `sf-metadata-experts`, `sf-headless-360`, `sf-data360` through `bin/sf-mcp-proxy`, signed in with your `sf` CLI login. Turn them on in Setup → MCP Servers; choose them with `mcp.servers`; check with `sf-sdlc mcp status` |

## Options

`/plugin configure sf-sdlc@nagarro-sf` sets, for you only: **Hook mode** (`project`, `observe`,
`enforce`, `off`) and **Audit log** (on/off). Project-wide settings live in the project's
`.claude/sf-sdlc.json`.

## Privacy

The plugin sends nothing anywhere on its own and collects no telemetry. Hooks and the CLI run
locally. The audit log is a file in your project (`.sf-sdlc/audit.jsonl`). The Atlassian connection
is made only after you sign in, and is governed by Atlassian's terms. Salesforce CLI commands talk
to your orgs under the CLI's own authentication. The hosted MCP proxy talks only to
`api.salesforce.com`, for servers listed in `mcp.servers`, with a short-lived token the org issues
to your CLI login. The `atlassian-token` server, when you fill Jira or Confluence tokens in `.env`,
talks only to the Atlassian site you set there.

## Safety

- Changes to a production org always need your confirmation; direct production deploys and
  `NoTestRun` are denied. An org that cannot be classified is treated the same way.
- Credentials are never written or committed. Tokens live in the project's git-ignored `.env`, which
  Claude is denied read access to; `sf-sdlc env status` reports names, never values.
- Hosted MCP tools that can change an org (Headless 360 `dispatch`, Data 360 `execute`) always ask.
- `deploy` and `release` can only be started by a person.

These guards steer an agent; they are not a security boundary. Keep org permissions, branch
protection and CI in place.

## Licence

Apache-2.0. Third-party skills keep their own licences; see `NOTICE`.
