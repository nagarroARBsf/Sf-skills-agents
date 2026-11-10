# sf-sdlc — Salesforce delivery lifecycle for Claude Code

Agents, commands, guard hooks and Salesforce skills that take a project from meeting transcripts to
a production release: BRD → Jira stories → architecture → spec and plan → build → code review →
deployment → testing → re-test → release.

> `agents/`, `commands/`, `skills/`, `skill-library/`, `context/`, `hooks/`, `bin/`, `catalog/`,
> `output-styles/`, `workflows/` and `templates/` are generated from the repository's `.claude/`
> folder by `scripts/build-claude-plugin.py`. Edit the source there, never here.

## Install

```text
/plugin install sf-sdlc --marketplace nagarroARBsf/Sf-skills-agents
```

or `/plugin marketplace add nagarroARBsf/Sf-skills-agents` then `/plugin install sf-sdlc@nagarro-sf`.
To try a local checkout: `claude --plugin-dir plugins/sf-sdlc`.

Then, in your Salesforce project, run `/sf-sdlc:setup`. It checks your tools, writes
`.claude/sf-sdlc.json`, and installs only the Salesforce skills the project needs.

Requirements: Claude Code 2.1.271+, Node.js 18+, git; for build and deploy work the Salesforce CLI
with the `code-analyzer` plugin and Java 11+. Full guide: `SETUP.md` in the repository.

## What's inside

| Part | Contents |
|---|---|
| `agents/` | Project scout, BRD, Jira story, solution architect, plan, developer, code review (read-only), QA test, deployment, release |
| `commands/` | `setup` `doctor` `skills` · `brd` `stories` `architecture` `diagram` · `constitution` `specify` `clarify` `plan` `tasks` `implement` `verify` · `review` `analyze` · `test-cases` `test-run` `retest` · `deploy` `release` · `trace` |
| `skills/` | 11 SDLC process skills and `salesforce-coding-rules` |
| `skill-library/` | 174 Salesforce skills, not loaded; `sf-sdlc skills install` copies the chosen ones into the project |
| `hooks/` | Session facts; production-org, secret, branch and commit guards; source checks on write; failure triage; audit log |
| `bin/sf-sdlc` | `doctor`, `init`, `config`, `detect`, `inventory`, `delta`, `skills`, `org classify`, `analyze`, `check`, `deploy`, `test`, `diagram`, `audit` |
| `workflows/` | `sdlc-review-changes`, `sdlc-stories-fanout`, `sdlc-release-readiness` |
| `monitors/` | `deploy-watch`, `test-watch` (experimental in Claude Code) |
| `output-styles/` | Salesforce Delivery Lead (plain English), Salesforce Engineer (terse, evidence-led) |
| `themes/` | SF SDLC Dark, SF SDLC Light (experimental in Claude Code) |
| `.mcp.json` | Atlassian remote MCP server for Jira and Confluence; sign in once with `/mcp` |

## Options

`/plugin configure sf-sdlc@nagarro-sf` sets, for you only: **Hook mode** (`project`, `observe`,
`enforce`, `off`) and **Audit log** (on/off). Project-wide settings live in the project's
`.claude/sf-sdlc.json`.

## Privacy

The plugin sends nothing anywhere on its own and collects no telemetry. Hooks and the CLI run
locally. The audit log is a file in your project (`.sf-sdlc/audit.jsonl`). The Atlassian connection
is made only after you sign in, and is governed by Atlassian's terms. Salesforce CLI commands talk
to your orgs under the CLI's own authentication.

## Safety

- Changes to a production org always need your confirmation; direct production deploys and
  `NoTestRun` are denied. An org that cannot be classified is treated the same way.
- Credentials are never written or committed.
- `deploy` and `release` can only be started by a person.

These guards steer an agent; they are not a security boundary. Keep org permissions, branch
protection and CI in place.

## Licence

Apache-2.0. Third-party skills keep their own licences; see `NOTICE`.
