# Environment and connections

Used by setup sections 4 and 5. `node .claude/bin/sf-sdlc setup` checks all of this and prints the
link or command for whatever is missing; this file is the detail behind it. Run an install or sign-in
only after the person says yes (one yes can cover all of them).
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
   production; never guess. The login address, user name and alias are not secrets: write them to
   `.env` with `node .claude/bin/sf-sdlc env set SF_LOGIN_URL=https://test.salesforce.com SF_USERNAME=<user> SF_ORG_ALIAS=<alias>`
   (`SF_LOGIN_URL` is `https://login.salesforce.com` for production and Developer Edition,
   `https://test.salesforce.com` for a sandbox, or the org's My Domain address).
2. Run `node .claude/bin/sf-sdlc org login` (it runs `sf org login web` with the alias and login
   address from `.env`; `--alias` and `--instance-url` override them). A browser opens; the person
   signs in and allows access; the command finishes on its own. When `SF_USERNAME` is set, the next
   `sf-sdlc setup` picks the signed-in org with that user name as the project org without asking.
3. Check with `sf org list` and `node .claude/bin/sf-sdlc org classify <alias>`.
4. Set it as the default only for a non-production org, and only on a yes:
   `sf config set target-org <alias>`.

### 2. Salesforce hosted MCP servers

They use the CLI login above; nothing else is stored. State the defaults and offer the rest; do not
ask the person to choose from scratch.

| Server (`mcp.servers` name) | Default | What it gives Claude | Can change the org |
|---|---|---|---|
| `metadata-experts` | on | Metadata type schemas and generation guidance | no |
| `metadata-grounding` | on | Find existing org metadata by meaning (needs Data 360 and Salesforce Catalog; not in scratch orgs) | no |
| `sobject-reads` | on | Read records and object schema: describe, SOQL, search. The default source for object and data questions | no |
| `sobject-all` | off | Read, create, update and delete records | yes — every change asks first |
| `headless-360` | off | Live Setup state and org REST/Connect operations | yes — every change asks first |
| `data360` | off | Data 360 recipes and operations | yes — every change asks first |

Turn one on or off for the project with `node .claude/bin/sf-sdlc mcp enable <name>` /
`mcp disable <name>`. A server that is not in this table is not supported by the kit; do not add it by
guessing a URL. In `/mcp`, a Salesforce server that shows "no tools" is simply not switched on in the
org (or not in `mcp.servers`) — that is expected.

1. Give the person the Setup link from the checklist (the org's address followed by
   `/lightning/setup/SetupOneHome/home`), or open it for them:
   `sf org open --target-org <alias> --path /lightning/setup/SetupOneHome/home`.
2. In Setup, type **MCP** in Quick Find, open **MCP Servers** (API Catalog), and turn on the servers
   listed in `mcp.servers`. Metadata Grounding also needs Data 360, API access and Salesforce Catalog,
   and is not available in scratch orgs.
3. Wait about two minutes, then run `node .claude/bin/sf-sdlc mcp status`.
4. Restart Claude Code (or run `/mcp`) so the servers reconnect.

Addresses: the kit knows every server's address and signs in with the CLI login, so `.env` needs no
client ID, key or token for them. `SF_SDLC_MCP_HOST` (one host for all) and `SF_MCP_<SERVER>_URL`
(one server, e.g. `SF_MCP_METADATA_EXPERTS_URL`) in `.env` override an address only when Salesforce
gives the team a different one; each must be an `https://` address on a `salesforce.com` host.

### 3. Jira and Confluence

Two ways; pick one per person.

**Option A — browser sign-in (recommended, and the simplest for non-technical users).** The kit
registers Atlassian's remote MCP server as `atlassian`. Run `/mcp`, choose `atlassian` (for plugin
users it shows as `plugin:sf-sdlc:atlassian`), choose **Authenticate**, and sign in in the browser.
Claude Code keeps the login; nothing goes into the project.

**Option B — API token in `.env`.** For teams whose Atlassian policy blocks the remote server, or that
need a service account. Needs uv or Docker.
1. Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens.
2. The address and e-mail are not secrets: Claude writes them with
   `node .claude/bin/sf-sdlc env set JIRA_URL=https://<site>.atlassian.net JIRA_USERNAME=<e-mail>`.
   The person types only the token, in their editor. In full: open `.env` (setup created it) and fill `JIRA_URL` (`https://<site>.atlassian.net`),
   `JIRA_USERNAME` (the Atlassian e-mail) and `JIRA_API_TOKEN`; for Confluence the same three
   `CONFLUENCE_*` keys (URL `https://<site>.atlassian.net/wiki`). Optional: `READ_ONLY_MODE=true`.
3. Run `node .claude/bin/sf-sdlc env status` — it shows which groups are configured, never values.
4. Restart Claude Code. The `atlassian-token` server starts the community `mcp-atlassian` server with
   those values; while they are empty it shows as an empty server and does nothing.

**Check either way:** Jira tools are available (tool names containing `jira`). Make one read-only
call, such as listing projects, and use it to fill the `jira` block of the configuration (site,
project key, issue type names, field IDs). Never create or change an issue during setup.

### 4. GitHub

1. **Browser (recommended):** `gh auth login --web --git-protocol https`; a browser window opens and the
   person signs in.
2. **Token:** create a fine-grained personal access token for this repository (Contents and Pull
   requests: read and write), put it in `.env` as `GITHUB_TOKEN`, then run
   `node .claude/bin/sf-sdlc env gh-login`. gh keeps its own login afterwards; the value can be
   removed from `.env`.
3. Check with `gh auth status`.

### 5. Browser for UI tests (Playwright)

The kit registers Microsoft's Playwright MCP server as `sf-browser` (pinned version, started through
`npx`, so it needs only Node.js). Claude can then open the org in a real browser, click through a
story and take screenshots for the QA agent.

1. Nothing to install: the checklist row "Browser for UI tests" is ✅ when Node.js (npx) is there.
   On first use Playwright downloads its browser if needed; on Linux without Google Chrome the kit uses
   Chrome for Testing, which needs no administrator password.
2. **Sign in once.** The first time Claude opens the org (`node .claude/bin/sf-sdlc browser url --org qa`
   gives the address; sandbox, scratch and developer orgs only), a browser window shows the
   Salesforce login page. The person signs in there, including any verification code. Claude never
   types or sees the password.
3. The sign-in (cookies) is kept in `.sf-sdlc/browser-profile/` in the project: git-ignored, denied to
   Claude's Read tool and protected by the secret guard. Setup sets the profile to restore the last
   session, so later Claude sessions — also after a restart of the laptop — open the same profile and
   stay signed in until Salesforce ends the session (the org's session timeout). Nobody changes a
   browser setting by hand.
4. One browser at a time per project: while one Claude session has the browser open, another session
   gets "profile in use" until the first one closes it (`browser_close`) or ends.
5. `node .claude/bin/sf-sdlc browser status` shows the state; `sf-sdlc browser reset` signs out of every
   site by deleting the profile.
6. Opening a page of a production-class org, or of a Salesforce org the CLI does not know, asks first
   (the `pre-mcp` hook). UI tests run only in sandbox, scratch or developer orgs.

## Secrets

- `.env` is created by `sf-sdlc init`, git-ignored, and Claude is denied read access to it through
  `permissions.deny`. Only `sf-sdlc env status` looks inside, and it reports names, never values.
- Never ask for, repeat, log or write a credential. If a person pastes one into the chat, tell them to
  revoke it and create a new one, and do not repeat it.
- Salesforce needs no secret in `.env`: the CLI keeps its own login in the user's home folder.
  `SF_LOGIN_URL`, `SF_USERNAME` and `SF_ORG_ALIAS` are addresses and names only. There is no
  Salesforce password, client secret or token key, and none must be added.
- `.env.sample` (written by `sf-sdlc init`, committed) lists every key the kit reads with no values,
  so teammates know what to fill.
- The browser sign-in lives in `.sf-sdlc/browser-profile/` and must never be read, copied or committed.
