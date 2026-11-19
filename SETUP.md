# Setup guide

How to install the Salesforce SDLC kit in a project, and every per-project file you may need to change.

## 1. Prerequisites

| Tool | Needed for | Install |
|---|---|---|
| Claude Code 2.1.271 or later | Everything | https://claude.com/claude-code |
| Node.js 18 or later | Hooks and the `sf-sdlc` CLI | https://nodejs.org |
| Git | Change detection, branch guard | — |
| Salesforce CLI (`sf`) v2 | Build, test, deploy | `npm install --global @salesforce/cli` |
| Salesforce Code Analyzer | `/sdlc-analyze`, the commit gate, code review | `sf plugins install code-analyzer` |
| Java 11 or later | Code Analyzer's PMD and CPD engines | Any JDK; 17+ recommended |
| GitHub CLI (`gh`) — optional | Pull requests, tags, releases | https://cli.github.com, then `gh auth login` |
| sfdx-git-delta — optional | Alternative delta manifests | `sf plugins install sfdx-git-delta` |
| Lightning Flow Scanner — optional | Flow static analysis | `sf plugins install lightning-flow-scanner` |
| mermaid-cli — optional | SVG diagrams for Jira and Confluence | `npm install --global @mermaid-js/mermaid-cli` |
| draw.io desktop — optional | PNG, SVG and PDF of the Salesforce-standard diagrams (`sf-sdlc diagram export`); without it the `.drawio` files still open in draw.io on the web or the VS Code Draw.io extension | https://www.drawio.com (`brew install --cask drawio`, `winget install JGraph.Draw`, `sudo snap install drawio`); under WSL the Windows app is found automatically; `SF_SDLC_DRAWIO` points to another location |
| uv or Docker — optional | Only for Jira/Confluence with an API token in `.env` (the `atlassian-token` server) | https://docs.astral.sh/uv/ |
| A browser — optional | UI tests in a real browser through the Playwright MCP server (`sf-browser`); started with `npx`, so Node.js is enough. Uses Google Chrome when installed; otherwise Playwright downloads Chrome for Testing (no administrator rights) | Nothing to install; `browser.browser` in the config picks another browser |
| Salesforce Hosted MCP Servers — optional | Grounding in existing org metadata; Metadata Experts skills | Turned on in the org: Setup → MCP Servers (see 4.5) |

Business analysts and managers who only produce documents (BRD, stories, test design, release
notes) need Claude Code, Node.js and git only. You do not have to install anything by hand first:
`/sf-sdlc:setup` checks each tool, explains what it is for and offers the install command for your
operating system (step-by-step instructions are in
`.claude/skills/sf-sdlc-setup/references/environment-setup.md`).

## 2. Install

Choose one. Do not use both in the same project: agents and commands would appear twice.

### Option A — plugin (recommended)

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

Commands are `/sf-sdlc:<name>` (for example `/sf-sdlc:setup`, `/sf-sdlc:brd`, `/sf-sdlc:plan`) and the
CLI is `sf-sdlc` inside Claude Code's shell.

Setup follows Claude Code's documented practice for team plugins: the plugin's commands, agents,
hooks, CLI and MCP servers stay in the plugin, and setup writes the project's own files — the plugin
turned on at **project scope** in `.claude/settings.json` (`enabledPlugins` and
`extraKnownMarketplaces`), the coding rules in `.claude/rules/`, the configuration, the skills and a
git-ignored `.env` with its value-free list `.env.sample`. Commit them (not `.env`). A teammate who clones the project trusts the folder and
installs the plugin once:

```bash
claude plugin install sf-sdlc@nagarro-sf --scope project
```

| Part | Where it lives | Committed |
|---|---|---|
| Commands, agents, hooks, `sf-sdlc` CLI, output styles, workflows, MCP server definitions, skill library | The plugin | n/a |
| Plugin on for the team, kit permissions, `.env` read-deny | `.claude/settings.json` | Yes |
| Coding rules and kit instructions (`sf-sdlc-kit.md`) | `.claude/rules/` | Yes |
| Configuration; installed skills and lock file | `.claude/sf-sdlc.json`; `.claude/skills/`, `.claude/sf-sdlc.skills.lock.json` | Yes |
| Personal overrides | `.claude/sf-sdlc.local.json`, `.claude/settings.local.json` | No |
| List of `.env` keys, no values | `.env.sample` | Yes |
| Salesforce login address and user name; Jira, Confluence, GitHub tokens | `.env` | **Never** |
| Browser sign-in (cookies) for UI tests | `.sf-sdlc/browser-profile/` | **Never** |

### Option B — copy the `.claude/` folder

```bash
cp -r /path/to/Sf-skills-agents/.claude /path/to/your-project/
```

Commands are then `/sdlc-<name>` and `/sdd-<name>`, and the CLI is `node .claude/bin/sf-sdlc`.
Run `/sdlc-setup`. If the project already has a `.claude/` folder, merge `settings.json` by hand
(the `hooks`, `permissions` and `env` blocks) instead of overwriting it.

Upgrading a copy-in install from 2.x: copy the new `.claude/` over the old one, then run
`node .claude/bin/sf-sdlc doctor`. Its "no files left over from an older kit version" row lists what
3.0 removed (six agents, `skills/sdlc-project-setup/`, the two old output styles); delete those files.

### Roll out to a whole organisation (managed settings)

```json
{
  "extraKnownMarketplaces": {
    "nagarro-sf": { "source": { "source": "github", "repo": "nagarroARBsf/Sf-skills-agents" }, "autoUpdate": true }
  },
  "enabledPlugins": { "sf-sdlc@nagarro-sf": true },
  "strictKnownMarketplaces": [
    { "source": "github", "repo": "nagarroARBsf/*" },
    { "source": "github", "repo": "anthropics/claude-plugins-official" },
    { "source": "skills-dir" }
  ]
}
```

A private repository works the same way; each user needs git read access to it.

## 3. What setup does

`/sdlc-setup` (plugin: `/sf-sdlc:setup`) does the work first and asks afterwards. It runs one command,
`sf-sdlc setup`, which needs no answers from you:

- creates a git repository if there is none, and the project files;
- installs the **mandatory core skills** in every project, whatever it contains: `drawio-skill`, the
  other diagram skills, org management and every official Salesforce `platform-*` skill (54 today).
  The `sdlc-*` skills come with the kit;
- explores the code and adds the **on-demand** skills it calls for (LWC, Flow, OmniStudio, Experience
  Cloud, integration…), as many as fit Claude Code's skill listing budget; the rest are listed. The
  budget applies to on-demand skills only;
- checks every tool, the Salesforce org, the hosted MCP servers, the browser for UI tests, Jira and
  GitHub;
- prints a checklist: ✅ done, 🔧 what Claude can do when you say yes, 👉 what only you can do — each
  with the link or command — and ➖ optional items.

Claude then asks, once, only what cannot be detected (which signed-in org the project uses, whether
you use Jira, whether to install what is missing), does what you agree to, and shows the checklist
again. `/sf-sdlc:doctor` shows the same checklist at any time. Run `sf-sdlc setup --org <alias>` to
record the project's org, `--install-tools` to install the Salesforce CLI, Code Analyzer and CLI
plugins, `--no-jira` if you do not use Jira.

The single steps, which you can also run yourself:

| Step | Command | Result |
|---|---|---|
| Everything below, then the checklist | `sf-sdlc setup` | See above |
| Check the environment | `sf-sdlc doctor` | What is missing, each with the install command; installed only after you say yes |
| Create project files | `sf-sdlc init` | `.claude/sf-sdlc.json`, `.gitignore` entries, `.env` and `.env.sample`, `code-analyzer.yml`, a pull request template; plugin users also get `.claude/settings.json` (plugin on at project scope) and `.claude/rules/` |
| Sign in to Salesforce | `sf-sdlc org login [--alias a] [--instance-url u]` | `sf org login web` with `SF_ORG_ALIAS` and `SF_LOGIN_URL` from `.env`; a browser opens and you sign in |
| Connect | `sf-sdlc org login`, Setup → MCP Servers, `/mcp` → `atlassian` or `.env` tokens, `gh auth login` | Salesforce org, hosted MCP servers, Jira/Confluence, GitHub (each optional) |
| Check credentials | `sf-sdlc env status` | Which `.env` groups are filled — names only, never values |
| Fill an address or user name | `sf-sdlc env set SF_LOGIN_URL=… SF_USERNAME=… JIRA_URL=…` | Writes non-secret values into `.env`; refuses tokens |
| Choose hosted MCP servers | `sf-sdlc mcp list`, `sf-sdlc mcp enable <name>`, `mcp disable <name>` | Edits `mcp.servers` |
| Explore the code | `sf-sdlc detect`, `sf-sdlc inventory` | What metadata and conventions exist today |
| Browser for UI tests | `sf-sdlc browser status`, `browser url --org <role>`, `browser reset` | Ready or not, where the sign-in is kept; the org's address (non-production only, no token); sign out everywhere |
| Choose skills | `sf-sdlc skills recommend` | The core set plus recommended skills, with the evidence for each |
| Install skills | `sf-sdlc skills install <names>` | Copies into `.claude/skills/`, recorded in a lock file |

Setup never overwrites a file you changed. Re-running `sf-sdlc init` after a plugin upgrade updates
the rule files nobody edited and reports the ones that were edited.

## 4. Per-project configuration files

### 4.1 `.claude/sf-sdlc.json` — the main project config (commit it)

Created by `sf-sdlc init`. A complete example is in `.claude/templates/sf-sdlc.example.json`.
Validate with `sf-sdlc config validate`.

| Key | What to set | Example |
|---|---|---|
| `project.name`, `project.code`, `project.client` | Names used in document headers; `code` prefixes document references and epics | `"Orion Sales Cloud"`, `"ORION"`, `"Acme Manufacturing"` |
| `salesforce.apiVersion` | `"auto"` reads `sourceApiVersion` from `sfdx-project.json`; set a number only to override | `"auto"` |
| `salesforce.packageDirectories` | `"auto"` reads `sfdx-project.json`; or a list of folders | `"auto"` |
| `salesforce.namespacePrefix`, `salesforce.componentPrefix` | Managed-package namespace; naming prefix for new components | `""`, `"ORN"` |
| `orgs.dev`, `orgs.qa`, `orgs.uat`, `orgs.devHub` | The `sf` CLI alias of each org | `"orion-qa"` |
| **`orgs.production`** | **Every alias or username that is a production org.** The guard treats these as production no matter what the org looks like | `["orion-prod"]` |
| `git.mainBranch`, `git.integrationBranch` | Your branch names | `"main"`, `"develop"` |
| `git.protectedBranches` | Branches Claude may not push to; `*` is a wildcard | `["main", "develop", "release/*"]` |
| `git.branchPattern`, `git.commitPattern`, `git.pullRequestBase` | Naming rules planning and implementation follow | `"feature/{ticket}-{slug}"`, `"{ticket}: {summary}"`, `"develop"` |
| `jira.enabled`, `jira.site`, `jira.projectKey` | Turn on Jira issue creation; your site URL and project key | `true`, `"https://acme.atlassian.net"`, `"ORION"` |
| `jira.issueTypes.*` | Your issue type names if they differ | `"Story"` |
| `jira.fields.storyPoints`, `.epicLink`, `.acceptanceCriteria` | Custom field IDs in your Jira (Jira admin → Issues → Custom fields) | `"customfield_10016"` |
| `jira.labels`, `jira.transitions.*` | Labels added to created issues; your workflow status names | `["salesforce"]`, `"Ready for QA"` |
| `quality.coverageTarget` | Minimum Apex coverage per changed class (75–100) | `85` |
| `quality.orgCoverageMinimum` | Minimum org-wide coverage | `75` |
| `quality.analyzerSeverityThreshold` | Code Analyzer severity that blocks: 1 Critical … 5 Info | `2` |
| `quality.analyzerRuleSelector` | Code Analyzer rule selection | `"Recommended"` or `"Recommended:Security"` |
| `quality.bulkTestSize` | Record count for bulk tests | `200` |
| `deploy.pipeline` | Promotion order, as org roles | `["dev", "qa", "uat", "production"]` |
| `deploy.testLevel.<role>` | Test level per stage. Production may not be `NoTestRun` | `"RunLocalTests"` |
| `deploy.allowDirectProductionDeploy` | `false` forces validate-then-quick-deploy for production | `false` |
| `deploy.useDelta`, `deploy.waitMinutes` | Deploy only changed components; CLI wait time | `true`, `60` |
| `paths.docs`, `paths.specs` | Where SDLC documents and specs live | `"docs/sdlc"`, `"specs"` |
| `paths.templates` | The team's own document and Jira templates (Jira process, story, BRD, LLD, test case, release notes…). A file here replaces the kit's copy; `sf-sdlc templates copy <id>` starts one | `"docs/sdlc/templates"` |
| `mcp.servers` | Salesforce Hosted MCP Servers the agents may use: `metadata-grounding`, `metadata-experts`, `sobject-reads`, `sobject-all`, `headless-360`, `data360` | `["metadata-experts", "metadata-grounding", "sobject-reads"]` |
| `mcp.org` | Org role or alias the hosted servers sign in to; empty means the default target org | `"dev"` |
| `browser.enabled` | Start the Playwright browser server (`sf-browser`) for UI tests | `true` |
| `browser.browser` | `chrome`, `msedge`, `chromium` (Chrome for Testing), `firefox` or `webkit`. On Linux without Google Chrome, `chrome` falls back to `chromium` | `"chrome"` |
| `browser.headless` | Run without a visible window. The first sign-in needs a visible one | `false` |
| `hooks.mode` | `observe` (report what would be blocked), `enforce`, or `off` | `"observe"` |
| `hooks.auditLog` | Record org-affecting commands in `.sf-sdlc/audit.jsonl` | `true` |
| `hooks.strictEvidence` | Refuse to end a turn while ticked tasks lack an evidence note | `false` |

Start with `hooks.mode` `observe` for a week, read what would have been blocked, then switch to
`enforce`. The production-org guard and the secret guard enforce in every mode.

### 4.2 `.claude/sf-sdlc.local.json` — personal overrides (do not commit)

Same shape as the main file; any key here wins. Typical use: your own development org.

```json
{ "orgs": { "dev": "my-scratch-org" }, "hooks": { "mode": "enforce" } }
```

### 4.3 `.claude/settings.json` — Claude Code permissions and environment (commit it)

Plugin installs get it from `sf-sdlc init`, which merges the kit's permissions into an existing
file (lists are merged, existing keys kept), adds a read-deny on `.env`, and turns the plugin on at
project scope. It never adds a `hooks` block: the plugin runs the hooks. The copy-in folder ships the
file with the hooks.

| Block | What to change | Example |
|---|---|---|
| `permissions.allow` | Read-only commands that never prompt | add `"Bash(npm run test:unit*)"` |
| `permissions.ask` | Commands that always prompt, even when a hook cannot run | add `"Bash(sf project deploy validate*)"` |
| `permissions.deny` | Credential files and commands that print tokens | add `"Read(./config/*.key)"` |
| `env` | Environment for every command | `"SF_DISABLE_TELEMETRY": "true"` |
| `enabledPlugins`, `extraKnownMarketplaces` | Written by `init` so teammates who clone the project get the plugin | see section 2 |

### 4.4 `code-analyzer.yml` — Salesforce Code Analyzer rules (commit it)

Created at the project root. Change rule severities, disable rules or engines, and ignore paths.

```yaml
ignores:
  files:
    - "**/staticresources/**"
rules:
  pmd:
    OperationWithLimitsInLoop:
      severity: 2
```

`sf code-analyzer config` prints the full default configuration to copy from.

The template ships one custom rule, `NoHardcodedSalesforceIds` (regex engine, severity 2, `.cls`
and `.trigger`). Custom rules are not part of `Recommended`, so `sf-sdlc analyze`, the commit gate
and the CI workflow also select `Custom`. When an agent repeats a mistake, add a rule with the
`dx-code-analyzer-custom-rule-create` skill; its script escapes the YAML correctly.

### 4.5 `.mcp.json` — Salesforce Hosted MCP Servers, and other MCP servers

**Salesforce Hosted MCP Servers.** The plugin registers six servers (`sf-metadata-grounding`,
`sf-metadata-experts`, `sf-headless-360`, `sf-data360`, `sf-sobject-reads`, `sf-sobject-all`). Metadata
Experts, Metadata Grounding and SObject Reads (read-only object schema and records) are on by default; turn the others on with `sf-sdlc mcp enable <name>`.
A server that is registered but not enabled, or not switched on in the org, shows in `/mcp` as
"no tools" — that is expected, not an error. For the copy-in folder, `sf-sdlc init`
adds the same entries to the project's `.mcp.json` without touching other servers. Each entry starts
`bin/sf-mcp-proxy`, which signs in with your Salesforce CLI login: there is no client ID, secret or
External Client App to manage. The kit knows every server's address; `SF_SDLC_MCP_HOST` or
`SF_MCP_<SERVER>_URL` in `.env` override one only when Salesforce gives you a different address
(https, `salesforce.com` hosts only).

1. Turn the servers on in the org: Setup → Quick Find **MCP Servers** → **MCP Servers** under API
   Catalog. Allow two minutes. Metadata Grounding also needs Data 360, API access and Salesforce
   Catalog, and is not available in scratch orgs.
2. Log in: `sf-sdlc org login` (uses `SF_ORG_ALIAS` and `SF_LOGIN_URL` from `.env`), or
   `sf org login web --alias <alias>` (add `--instance-url https://<mydomain>.my.salesforce.com` for a
   My Domain login).
3. Choose servers and org in `.claude/sf-sdlc.json` (`mcp.servers`, `mcp.org`); personal overrides go
   in `sf-sdlc.local.json`. Headless 360 and Data 360 are off by default because they can change the
   org; their write tools always ask first.
4. Check with `sf-sdlc mcp status`, then restart Claude Code. `/mcp` lists the servers; one that is
   not enabled or not turned on in the org shows no tools.

The copy-in `settings.json` pre-approves the four project servers (`enabledMcpjsonServers`) and
denies `sf api request rest /ide/auth` to Claude, because that command prints a token.

If you connect a hosted server without the proxy (another tool, or `claude mcp add --transport http`
with an External Client App using PKCE and the `mcp_api` and `refresh_token` scopes), keep the
consumer secret out of files and use your own server name so it does not clash with `sf-*`.

**Jira and Confluence.** Two servers are registered; use one.

- `atlassian` (plugin only): Atlassian's remote server. Sign in once through `/mcp` in the browser;
  nothing is stored in the project. Recommended.
- `atlassian-token` (plugin and copy-in): `bin/sf-atlassian-mcp` starts the community
  `mcp-atlassian` server (with `uvx`, or Docker) using the `JIRA_*` and `CONFLUENCE_*` values in
  `.env` (see 4.6). While those are empty it shows as an empty server. Set
  `ATLASSIAN_MCP_PACKAGE=mcp-atlassian==<version>` in `.env` to pin the server version.

**Browser for UI tests.** `sf-browser` (plugin and copy-in): `bin/sf-browser-mcp` starts Microsoft's
Playwright MCP server (`@playwright/mcp`, pinned in `hooks/browser.js`, Apache-2.0, fetched by `npx`
on first start) with a **persistent profile in `.sf-sdlc/browser-profile/`**. The first time the QA
agent opens your org, a browser window shows the Salesforce login page and you sign in there
(including any verification code); Claude never types or sees the password. The cookies stay in that
folder, so the next Claude session is still signed in — also after the laptop restarts — until
Salesforce ends the session (the org's timeout in Setup → Session Settings). Setup does this for you:
it sets the profile to restore the last session, which is what makes the browser keep Salesforce's
session cookie when it closes; the launcher re-applies it on every start. The folder is
git-ignored, denied to Claude's Read tool and protected by the secret guard; session IDs and OAuth
codes in URLs are redacted from what the server returns. One browser can use the profile at a time: a
second Claude session gets "profile in use" until the first closes its browser. Opening a page of a
production-class org, or of a Salesforce org the `sf` CLI does not know, asks first. Sign out
everywhere with `sf-sdlc browser reset`; turn the server off with `browser.enabled: false`.

**Other MCP servers.** Add entries like these only for Jira Server/Data Center or the GitHub MCP
server. Keep tokens in environment variables, never in the file.

```json
{
  "mcpServers": {
    "jira": {
      "type": "stdio",
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": { "JIRA_URL": "${JIRA_URL}", "JIRA_PERSONAL_TOKEN": "${JIRA_PERSONAL_TOKEN}" }
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": { "Authorization": "Bearer ${GITHUB_PAT}" }
    }
  }
}
```

The copy-in folder has no bundled Atlassian remote server; use `atlassian-token`, or add the
Atlassian entry (`"type": "http", "url": "https://mcp.atlassian.com/v2/mcp"`) here.

### 4.6 `.env` — your settings and tokens (never commit it) and `.env.sample` (commit it)

Created by `sf-sdlc init` (or `sf-sdlc env init`) from a template, added to `.gitignore`, and denied
to Claude's Read tool. Fill it **in your editor**; never paste a token into the chat. `init` also
writes **`.env.sample`**: every key with its explanation and no values, for the team to commit, so a
new teammate sees what to fill. Salesforce needs no password or token here: the `sf` CLI keeps its own
login, and the browser keeps its own sign-in.

| Keys | Used by | Where to get it |
|---|---|---|
| `SF_LOGIN_URL` | `sf-sdlc org login` (the browser sign-in) | `https://login.salesforce.com` (production, Developer Edition), `https://test.salesforce.com` (sandbox) or your My Domain address |
| `SF_USERNAME` | `sf-sdlc setup`: picks the signed-in org with this user name as the project org | The Salesforce user name you sign in with |
| `SF_ORG_ALIAS` | `sf-sdlc org login` and setup: the short name for the org in the `sf` CLI | e.g. `dev`, `uat` |
| `SF_SDLC_MCP_HOST`, `SF_MCP_<SERVER>_URL` (`SF_MCP_METADATA_EXPERTS_URL`, `…_METADATA_GROUNDING_URL`, `…_HEADLESS_360_URL`, `…_DATA360_URL`, `…_SOBJECT_READS_URL`, `…_SOBJECT_ALL_URL`) | `sf-mcp-proxy`, `sf-sdlc mcp status` | Leave empty. Only to override a hosted server's address; https and a `salesforce.com` host |
| `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` | the `atlassian-token` MCP server | https://id.atlassian.com/manage-profile/security/api-tokens; URL `https://<site>.atlassian.net`, username = your Atlassian e-mail |
| `CONFLUENCE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN` | the `atlassian-token` MCP server | Same token; URL `https://<site>.atlassian.net/wiki` |
| `READ_ONLY_MODE`, `ATLASSIAN_MCP_PACKAGE`, `ATLASSIAN_MCP_IMAGE` | optional, the same server | `true` disables create/update tools; pin the version or image |
| `GITHUB_TOKEN` | `sf-sdlc env gh-login`, which signs the `gh` CLI in once | A fine-grained token for this repository (Contents and Pull requests: read and write). Or skip it and run `gh auth login` |

The `SF_*` addresses, user name and alias are not secrets: `sf-sdlc env set` can write them for you
(it refuses tokens). `sf-sdlc env status` shows which groups are configured, partial or empty — never
the values. Restart
Claude Code after editing `.env` so MCP servers read it.

### 4.7 Other files

| File | Committed | What to change |
|---|---|---|
| `.claude/skills/` and `.claude/sf-sdlc.skills.lock.json` | Yes | Managed by `sf-sdlc skills`. Edit a skill freely; `sync` will not overwrite it |
| `.claude/rules/*.md` | Yes | File-scoped coding rules, and (plugin users) `sf-sdlc-kit.md`, the kit instructions. Written by `init` for plugin users; edit freely — an edited file is never overwritten. Copy-in folder: also `.claude/CLAUDE.md` |
| `specs/constitution.md` | Yes | Created by `/sdd-constitution`: your engineering principles, trigger framework, logging utility |
| `sfdx-project.json` | Yes | Read for API version and package directories; nothing kit-specific to add |
| `.github/pull_request_template.md` | Yes | Created by `init`; adapt the checklist |
| `.github/workflows/sf-code-analyzer.yml` | Yes | Created by `init` in a Salesforce DX project: Code Analyzer on the files changed in a pull request. Keep `SEVERITY_THRESHOLD` equal to `quality.analyzerSeverityThreshold` |
| `docs/sdlc/00-grounding/ontology.yaml`, `feature-map.md` | Yes | Drafted by setup: business terms mapped to Salesforce objects, and the components behind each feature. Add a term whenever an agent misreads one |
| `.sf-sdlc/` | No | Local state: audit log, tracked jobs, test-run results, caches |

### 4.7b Your own templates (`docs/sdlc/templates/`, commit it)

Teams with their own Jira process or document formats keep them in the project. A file at
`<paths.templates>/<area>/<file>` replaces the kit's template of the same name; the skills say which
ones they used.

```bash
node .claude/bin/sf-sdlc templates list            # every template, and which ones the project overrides
node .claude/bin/sf-sdlc templates copy jira       # the four Jira templates, ready to edit
node .claude/bin/sf-sdlc templates copy all        # everything; never overwrites a file you edited
```

`jira/jira-process-template.md` describes how the team runs Jira — framework (Scrum, Kanban, SAFe or
your own), issue hierarchy, workflow statuses, Definition of Ready and Done, estimation, sprint and
release cycle, required fields. `/sdlc-stories` follows it. Identifiers the tools call (project key,
issue type names, field IDs, transition names) stay in the `jira` block of `.claude/sf-sdlc.json`.

### 4.7c Output styles

`/output-style` offers three: **Salesforce Business Analyst** (requirements, stories, acceptance
criteria in business language), **Salesforce Developer** (terse, file and line evidence, commands and
results) and **Salesforce Manager** (status, risks and decisions on one screen, no technical detail).
Each person picks their own; it does not change what the stages write.

### 4.8 Per-user plugin options

Set with `/plugin configure sf-sdlc@nagarro-sf`.

| Option | Values | Effect |
|---|---|---|
| Hook mode | `project` (default), `observe`, `enforce`, `off` | Overrides `hooks.mode` for you only |
| Audit log | on (default) / off | Turns the local audit log off for you |

Environment variables: `SF_SDLC_HOOK_MODE` (same values), `SF_SDLC_ANALYZER_DISABLE=1` (skip the
commit scan). `SF_SDLC_DISABLE_ORG_GUARD=1` turns the production guard off and should not be set
outside a controlled CI job. `SF_TARGET_ORG` also chooses the org for the hosted MCP servers.

## 5. Verify the installation

```bash
sf-sdlc doctor            # every required line should show ✔
sf-sdlc config validate
sf-sdlc org classify      # confirm your production org reports "production"
sf-sdlc analyze --changed # the official Code Analyzer runs (Recommended rules plus your custom rules)
sf-sdlc mcp status        # each enabled hosted MCP server: connected with its tools, or why not
sf-sdlc env status        # which .env credential groups are filled (names only)
sf-sdlc browser status    # the Playwright browser for UI tests is ready; where the sign-in is kept
```

(Copy-in folder: prefix each with `node .claude/bin/`.)
