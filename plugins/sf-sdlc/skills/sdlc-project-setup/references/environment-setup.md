# Environment and connections

Used by setup steps 2 and 4. Each tool and connection says who needs it, how to install or connect
it, and how to check it. Offer the command; run an install or sign-in only after the person says yes.
Never ask for a password, token or key in the chat.

## Speak to the person running setup

- **Technical** (developer, admin): show the command, say what it does in one line, run it on a yes.
- **Non-technical** (business analyst, product owner, manager): one step at a time, in plain words.
  Say why the step matters ("this lets Claude read your Jira backlog"), what they will see (a
  browser window, a sign-in page), and what "done" looks like. Offer to run the command for them.
  Skip what their work does not need, and say that it was skipped and why.

## Tools

| Tool | Who needs it | Install | Check |
|---|---|---|---|
| Node.js 18+ | Everyone (the kit's hooks and `sf-sdlc` run on it) | macOS `brew install node`; Windows `winget install OpenJS.NodeJS.LTS`; Linux your package manager, or the LTS installer from nodejs.org | `node --version` |
| git | Everyone | macOS `xcode-select --install`; Windows `winget install Git.Git`; Linux your package manager | `git --version` |
| Salesforce CLI (`sf`) | Developers, admins; analysts only to read an org | `npm install --global @salesforce/cli` | `sf --version` |
| Code Analyzer plugin | Developers, reviewers | `sf plugins install code-analyzer` | `sf plugins` |
| Java 11+ (17 recommended) | Code Analyzer's PMD and CPD engines | Temurin 17 from adoptium.net; Windows `winget install EclipseAdoptium.Temurin.17.JDK`; Linux `openjdk-17-jdk` | `java -version` |
| GitHub CLI (`gh`) | Pull requests and releases | macOS `brew install gh`; Windows `winget install GitHub.cli`; Linux see cli.github.com | `gh --version` |
| uv (or Docker) | Only for Jira/Confluence with an API token (Option B below) | macOS/Linux `curl -LsSf https://astral.sh/uv/install.sh \| sh`; Windows `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"`; or `brew install uv` | `uvx --version` |
| mermaid-cli | Optional: SVG diagrams for Jira or Confluence | `npm install --global @mermaid-js/mermaid-cli` | `mmdc --version` |

A non-technical person doing requirements work needs Node.js and git, plus a Jira connection if the
team uses Jira. Everything else can be skipped.

## Connections

### 1. Salesforce org (sf CLI login)

Signs the CLI in through the browser; no password is stored in the project.

1. Ask for an alias (a short name such as `dev`, `uat`) and the kind of org. Ask which aliases are
   production; never guess.
2. Run `sf org login web --alias <alias>`. For a sandbox add `--instance-url https://test.salesforce.com`
   (or the org's My Domain URL). A browser opens; the person signs in and allows access; the command
   finishes on its own.
3. Check with `sf org list` and `sf-sdlc org classify <alias>`.
4. Set it as the default only for a non-production org, and only on a yes:
   `sf config set target-org <alias>`.

### 2. Salesforce hosted MCP servers

Metadata Experts and Metadata Grounding (on by default in `mcp.servers`), optionally Headless 360 and
Data 360. They use the CLI login above; nothing else is stored.

1. Open Setup in the org: `sf org open --target-org <alias> --path /lightning/setup/SetupOneHome/home`.
2. In Setup, type **MCP** in Quick Find, open **MCP Servers** (API Catalog), and turn on the servers
   listed in `mcp.servers`. Metadata Grounding also needs Data 360, API access and Salesforce Catalog,
   and is not available in scratch orgs.
3. Wait about two minutes, then run `sf-sdlc mcp status`.
4. Restart Claude Code (or run `/mcp`) so the servers reconnect.

### 3. Jira and Confluence

Two ways; pick one per person.

**Option A — browser sign-in (recommended, and the simplest for non-technical users).** The kit
registers Atlassian's remote MCP server as `atlassian`. Run `/mcp`, choose `atlassian` (for plugin
users it shows as `plugin:sf-sdlc:atlassian`), choose **Authenticate**, and sign in in the browser.
Claude Code keeps the login; nothing goes into the project.

**Option B — API token in `.env`.** For teams whose Atlassian policy blocks the remote server, or that
need a service account. Needs uv or Docker.
1. Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens.
2. Open `.env` in the editor (setup created it) and fill `JIRA_URL` (`https://<site>.atlassian.net`),
   `JIRA_USERNAME` (the Atlassian e-mail) and `JIRA_API_TOKEN`; for Confluence the same three
   `CONFLUENCE_*` keys (URL `https://<site>.atlassian.net/wiki`). Optional: `READ_ONLY_MODE=true`.
3. Run `sf-sdlc env status` — it shows which groups are configured, never values.
4. Restart Claude Code. The `atlassian-token` server starts the community `mcp-atlassian` server with
   those values; while they are empty it shows as an empty server and does nothing.

**Check either way:** Jira tools are available (tool names containing `jira`). Make one read-only
call, such as listing projects, and use it to fill the `jira` block of the configuration (site,
project key, issue type names, field IDs). Never create or change an issue during setup.

### 4. GitHub

1. **Browser (recommended):** `gh auth login`, choose GitHub.com, HTTPS, and sign in in the browser.
2. **Token:** create a fine-grained personal access token for this repository (Contents and Pull
   requests: read and write), put it in `.env` as `GITHUB_TOKEN`, then run
   `sf-sdlc env gh-login`. gh keeps its own login afterwards; the value can be
   removed from `.env`.
3. Check with `gh auth status`.

## Secrets

- `.env` is created by `sf-sdlc init`, git-ignored, and Claude is denied read access to it through
  `permissions.deny`. Only `sf-sdlc env status` looks inside, and it reports names, never values.
- Never ask for, repeat, log or write a credential. If a person pastes one into the chat, tell them to
  revoke it and create a new one, and do not repeat it.
- Salesforce needs no secret in `.env`: the CLI keeps its own login in the user's home folder.
