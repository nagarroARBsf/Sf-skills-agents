# Research summary

Research done on 2026-11-10 before the build. "Verified" means the file or page was read;
"secondary" means it rests on a third-party source.

## 1. What a Claude Code plugin can contain

Source: Claude Code documentation (code.claude.com/docs/en): `plugins/components`,
`plugins/manifest-reference`, `plugins/marketplace-reference`, `plugins/dependencies`, `sub-agents`,
`skills`, `hooks`, `output-styles`, `workflows`, `terminal-config`, `plugins/org`, `plugin-evals`.

| Component | Supported | Used here | Note |
|---|---|---|---|
| Agents, skills, commands | Yes | Yes | Plugin agents cannot declare their own hooks, MCP servers or permission mode |
| Hooks | Yes | Yes | `PreToolUse` can deny or ask; `SessionStart` output becomes context |
| `bin/` executables | Yes | Yes | Added to the Bash tool's PATH; not installed on claude.ai or Cowork |
| Output styles | Yes | Yes | |
| Workflows | Yes | Yes | Depends on plan and provider; an administrator can disable them |
| Monitors, themes | Yes, experimental | Yes | Manifest keys sit under `experimental`; the format may change |
| `.mcp.json` | Yes | Yes | Atlassian only |
| `userConfig` | Yes | Yes | Per-user values; secrets go to the OS credential store |
| Plugin `settings.json` | Two keys only (`agent`, `subagentStatusLine`) | No | Permissions and environment cannot ship in a plugin; they go in the project's `.claude/settings.json` |
| `.lsp.json` | Yes | No | No Apex language server is bundled |
| `CLAUDE.md`, `rules/` | **No** | Converted | Injected by a SessionStart hook; file-scoped rules become a skill |
| A skill library that ships but does not load | **No such feature** | Built | `sf-sdlc skills install` copies chosen skills into the project |
| `scripts/` | A convention, not a component | — | |

Not read: the plugin loading, MCP, security and troubleshooting pages, and the end of the hooks
page. `claude plugin validate plugins/sf-sdlc --strict` passes.

## 2. Salesforce sources

| Source | Licence | Used how |
|---|---|---|
| [forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills) at `0c7cb93` (2026-11-06) | Apache-2.0 | **Vendored unmodified**: 156 skills, including 9 that exist only inside its plugins. Re-vendored from the previous pin (2026-10-21) |
| Salesforce's `salesforce-development` plugin (same repo) | Apache-2.0 | **Not used**, by decision. It bundles the Metadata Experts MCP server that five official skills expect, and has telemetry on by default |
| `@salesforce/mcp` | Apache-2.0 | **Not used.** End of life on 2 November 2026 confirmed: repositories archived, npm package deprecated ([notice](https://github.com/forcedotcom/mcp/issues/46)) |
| [Clientell-Ai/salesforce-skills](https://github.com/Clientell-Ai/salesforce-skills) | Apache-2.0 | **Vendored**: the 18 `sf-*` skills. Attribution added in `NOTICE` (it was missing) |
| [github/spec-kit](https://github.com/github/spec-kit) | MIT | Method adapted for the spec-driven skill |
| grzmol/vibe-force | MIT | **Ideas**: one check runner behind hooks and CI; a config defaults file |
| divingsbysangam/salesforce-compound-engineering-plugin | MIT | **Ideas**: observe-only rollout of hooks; denying `NoTestRun` on production; reviewer confidence scale |
| jiten-singh-shahi/salesforce-claude-code | MIT | **Ideas**: install profiles; hook strictness levels; SOQL/DML-in-loop detection |
| anthropics/knowledge-work-plugins | Apache-2.0 | **Idea**: working from files when no connector is present |
| SalesforceAIResearch/agentforce-adlc | CC BY-NC 4.0 | **Not used** (non-commercial licence) |
| PranavNagrecha/AwesomeSalesforceSkills | PolyForm Small Business | **Not used** (licence restricts commercial use) |
| sfdx-hardis | AGPL-3.0 | **Not used or bundled** |

No code or text was copied from the "ideas" repositories.

No Salesforce-published plugin for sales or service roles is public. "Salesforce in Claude" (seller
skills) is a closed beta requested through AgentExchange (secondary).

## 3. Architecture diagrams

- **Chosen: Mermaid as text**, with a change-status overlay built for this kit (class, label prefix
  and a mandatory key). It renders natively on GitHub, diffs line by line, and needs no network or
  licence. No existing skill had a new/changed/unchanged convention.
- Salesforce's current diagram guidance (architect.salesforce.com, reference-diagrams) defines six
  diagram types and asks for a title, a description, a consistent flow direction and a key. The
  skill follows these. The older "Levels 1–4" wording is not in the current pages.
- Existing state comes from the source tree (`sf-sdlc inventory`) and git (`sf-sdlc delta`), with org
  describe commands as enrichment for components not in source.
- Rendering to SVG for Jira and Confluence uses the optional mermaid-cli (MIT); neither renders
  Mermaid natively (no native support found).
- Text-only cards: Salesforce logos and product icons have no stated redistribution terms.
- Considered and not chosen: draw.io MCP (Apache-2.0; XML diffs poorly, good fallback for
  stencil-style deliverables), Structurizr, PlantUML, D2, Excalidraw, Lucid.

## 4. Integrations

| System | Choice | Why |
|---|---|---|
| Salesforce | `sf` CLI v2, with the `code-analyzer` plugin (v5) | The supported path now that the DX MCP server has ended; reuses the CLI's own login, so no secret is configured |
| Jira Cloud | Atlassian remote MCP server, `https://mcp.atlassian.com/v2/mcp` | Per-user OAuth, respects Jira permissions, no secret in config. `/v1/mcp` still works; `/v2` is the recommended endpoint |
| Jira Server / Data Center | `mcp-atlassian` (MIT), added per project | The remote server is cloud-only |
| GitHub | `gh` CLI; GitHub MCP server optional per project | No tool definitions in context, works with GitHub Enterprise Server |

## 5. Could not verify

- Every `developer.salesforce.com` page returned HTTP 403, so the hosted Salesforce MCP details and
  the Metadata Experts status are secondary. Nothing in the kit depends on them.
- The upstream licence file of Clientell-Ai/salesforce-skills was reported as Apache-2.0 by the
  research pass and matches the skills' own frontmatter; have legal confirm before selling.
- Redistribution terms for Salesforce logos and icons (none are included).
