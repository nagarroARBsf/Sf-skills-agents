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

Business analysts and managers who only produce documents (BRD, stories, test design, release
notes) need Claude Code and Node.js only.

## 2. Install

Choose one. Do not use both in the same project: agents and commands would appear twice.

### Option A — plugin (recommended)

```text
/plugin marketplace add nagarroARBsf/Sf-skills-agents
/plugin install sf-sdlc@nagarro-sf
```

Commands are then `/sf-sdlc:<name>` (for example `/sf-sdlc:setup`, `/sf-sdlc:brd`, `/sf-sdlc:plan`)
and the CLI is `sf-sdlc` inside Claude Code's shell. Then, in your Salesforce project:

```text
/sf-sdlc:setup
```

### Option B — copy the `.claude/` folder

```bash
cp -r /path/to/Sf-skills-agents/.claude /path/to/your-project/
```

Commands are then `/sdlc-<name>` and `/sdd-<name>`, and the CLI is `node .claude/bin/sf-sdlc`.
Run `/sdlc-setup`. If the project already has a `.claude/` folder, merge `settings.json` by hand
(the `hooks`, `permissions` and `env` blocks) instead of overwriting it.

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

`/sdlc-setup` (plugin: `/sf-sdlc:setup`) runs these, which you can also run yourself:

| Step | Command | Result |
|---|---|---|
| Check tooling | `sf-sdlc doctor` | A list of what is missing, each with the fix |
| Create config | `sf-sdlc init` | `.claude/sf-sdlc.json`, `.gitignore` entries, `code-analyzer.yml`, a pull request template |
| Inspect the project | `sf-sdlc detect`, `sf-sdlc inventory` | What metadata exists today |
| Choose skills | `sf-sdlc skills recommend` | Recommended skills with the evidence for each |
| Install skills | `sf-sdlc skills install <names>` | Copies into `.claude/skills/`, recorded in a lock file |

Setup never overwrites an existing file.

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
| `git.protectedBranches` | Branches agents may not push to; `*` is a wildcard | `["main", "develop", "release/*"]` |
| `git.branchPattern`, `git.commitPattern`, `git.pullRequestBase` | Naming rules the plan and developer agents follow | `"feature/{ticket}-{slug}"`, `"{ticket}: {summary}"`, `"develop"` |
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

Plugin installs get it from `sf-sdlc init`; the copy-in folder ships it (with the hooks).

| Block | What to change | Example |
|---|---|---|
| `permissions.allow` | Read-only commands that never prompt | add `"Bash(npm run test:unit*)"` |
| `permissions.ask` | Commands that always prompt, even when a hook cannot run | add `"Bash(sf project deploy validate*)"` |
| `permissions.deny` | Credential files and commands that print tokens | add `"Read(./config/*.key)"` |
| `env` | Environment for every command | `"SF_DISABLE_TELEMETRY": "true"` |
| `enabledPlugins`, `extraKnownMarketplaces` | Add these so teammates who clone the project get the plugin | see section 2 |

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

### 4.5 `.mcp.json` — only for Jira Server/Data Center or the GitHub MCP server

The plugin already connects Atlassian Cloud (sign in once with `/mcp`). Add this file at the
project root only for these cases. Keep tokens in environment variables, never in the file.

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

The copy-in folder has no bundled MCP server; add the Atlassian entry
(`"type": "http", "url": "https://mcp.atlassian.com/v2/mcp"`) here if you want Jira creation.

### 4.6 Other files

| File | Committed | What to change |
|---|---|---|
| `.claude/skills/` and `.claude/sf-sdlc.skills.lock.json` | Yes | Managed by `sf-sdlc skills`. Edit a skill freely; `sync` will not overwrite it |
| `.claude/CLAUDE.md`, `.claude/rules/*.md` (copy-in folder only) | Yes | Project instructions and file-scoped coding rules; add your own conventions |
| `specs/constitution.md` | Yes | Created by `/sdd-constitution`: your engineering principles, trigger framework, logging utility |
| `sfdx-project.json` | Yes | Read for API version and package directories; nothing kit-specific to add |
| `.github/pull_request_template.md` | Yes | Created by `init`; adapt the checklist |
| `.sf-sdlc/` | No | Local state: audit log, tracked jobs, test-run results, caches |

### 4.7 Per-user plugin options

Set with `/plugin configure sf-sdlc@nagarro-sf`.

| Option | Values | Effect |
|---|---|---|
| Hook mode | `project` (default), `observe`, `enforce`, `off` | Overrides `hooks.mode` for you only |
| Audit log | on (default) / off | Turns the local audit log off for you |

Environment variables: `SF_SDLC_HOOK_MODE` (same values), `SF_SDLC_ANALYZER_DISABLE=1` (skip the
commit scan). `SF_SDLC_DISABLE_ORG_GUARD=1` turns the production guard off and should not be set
outside a controlled CI job.

## 5. Verify the installation

```bash
sf-sdlc doctor            # every required line should show ✔
sf-sdlc config validate
sf-sdlc org classify      # confirm your production org reports "production"
sf-sdlc analyze --changed # the official Code Analyzer runs
```

(Copy-in folder: prefix each with `node .claude/bin/`.)
