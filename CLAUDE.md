# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not a Salesforce project** — it is the *harness that gets copied into* Salesforce projects.
It ships 171 skills (27 loaded in `skills/`, 144 on demand in `skill-library/`), 4 SDLC agents, 12 commands and 6 rules in three tool-native formats, so a
downstream team copies one folder (`.claude/`, `.github/` or `.cursor/`) into their own repo.

Consequence: 13,644 of the 13,651 tracked files are payload. The only hand-written, repo-owned code
is `scripts/sync-platforms.py`, `scripts/update-official-skills.sh`, `scripts/official-skills.txt`
and `README.md`. Work here is almost always *editing harness content* or *editing the generator*.

### `.claude/CLAUDE.md` does not describe this repo

Claude Code loads `.claude/CLAUDE.md` as project instructions, but it is **payload** — instructions
written for the downstream Salesforce project that copies it. Its rules (Apex `with sharing`,
bulkification, the `/sdd-specify`-before-coding gate, "never deploy to prod") apply to generated
Salesforce metadata, not to work in this repository. There is no `force-app/`, `docs/sdlc/` or
`specs/` here. Treat it as a file to maintain, not as orders.

## Commands

```bash
python3 scripts/sync-platforms.py            # regenerate .github/ and .cursor/ from .claude/
python3 scripts/sync-platforms.py --check    # exit 1 and list stale paths; run before committing
scripts/update-official-skills.sh            # re-vendor official skills from upstream main
scripts/update-official-skills.sh <git-ref>  # ...from a tag or commit; re-pins official-skills.lock
```

There is no package manager, build, lint or test suite. The generator is Python 3 **standard library
only** — keep it that way; it has to run on a bare checkout. `update-official-skills.sh` calls
`sync-platforms.py` itself, so you never need both.

There is no CI. `--check` is the only verification gate, and it is on you to run it.

## Generation model

`.claude/` is the single source of truth. `.github/` and `.cursor/` are byte-for-byte derived:

| Source | Copilot (`.github/`) | Cursor (`.cursor/`) |
|---|---|---|
| `CLAUDE.md` | `copilot-instructions.md` | `rules/00-project.mdc` (`alwaysApply: true`) |
| `rules/*.md` | `instructions/*.instructions.md` (`applyTo`) | `rules/*.mdc` (`globs`) |
| `agents/*.md` | `agents/*.agent.md` (+ handoff buttons) | `agents/*.md` (+ `readonly`) |
| `commands/*.md` | `prompts/*.prompt.md` (+ `agent:` routing) | `commands/*.md` |
| `skills/**` | `skills/**` (verbatim) | `skills/**` (verbatim) |
| `skill-library/**` | `skill-library/**` (verbatim) | `skill-library/**` (verbatim) |

**Never edit `.github/` or `.cursor/` directly** — `sync-platforms.py` `rmtree`s every generated path
before rewriting it, so edits and stray untracked files there are destroyed without warning. Each
generated file carries a `<!-- Generated from ... -->` note.

Expect any `.claude/` change to produce a 3× diff (one tracked file count per platform dir, currently
4,548 each). A diff that touches only `.claude/` means the sync was not run.

## Authoring conventions the generator depends on

These are load-bearing, not style. The generator parses sources with a hand-rolled frontmatter
parser and a few regexes; breaking the shape fails quietly in a downstream tool rather than erroring.

- **Frontmatter** must stay simple: `key: value`, optionally quoted, and `key:` followed by
  two-space `- item` lists. Nested maps, block scalars (`|`, `>`) and flow collections are not
  parsed — they will be mangled.
- **Commands** must open with exactly `Use the **<agent-name>** subagent to <verb>…`. `SUBAGENT_RE`
  matches that literal bold form to emit Copilot's `agent:` key, and rewrites the opener by
  upper-casing the verb ("…subagent to generate" → "Generate"). Rephrase it and the Copilot prompt
  loses agent routing and reads oddly. Use `$ARGUMENTS`; it is swapped for prose on other platforms.
- **Agents**: `tools:` listing none of `Write`/`Edit`/`Bash` makes the Cursor agent `readonly: true`.
  Omit `tools:` entirely when the agent needs MCP tools (e.g. the Jira story agent), so Copilot and
  Cursor hand it the full workspace toolset. Copilot never receives a `tools:` key.
- **Rules**: `paths:` globs become Copilot `applyTo` / Cursor `globs`. No `paths:` means always-on in
  every session on every platform — costly, so keep those short.
- **Skills**: frontmatter `name` must equal the folder name, and `description` must be ≤ 1,024 chars
  after whitespace collapsing. Copilot and Cursor *silently skip* skills violating either; the sync
  script prints a `warning:` for both. Three upstream skills are known to exceed the limit.
- **Paths in bodies**: write them as `.claude/skills/…`, `.claude/rules/…` etc. `PATH_REWRITES`
  translates that prefix per platform. A bare or differently-spelled path survives unrewritten and
  points at a non-existent file for Copilot and Cursor users.
- Adding a fifth SDLC agent to the pipeline also means editing the `HANDOFFS` dict in
  `sync-platforms.py` — Copilot's inter-agent handoff buttons are hardcoded there, not derived.

## Skill provenance — three kinds, three rules

`.claude/skills/` mixes sources that must be maintained differently:

- **147 official** (`platform-*`, `experience-*`, `dx-*`, `agentforce-*`, `omnistudio-*`, …) vendored
  from [forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills), Apache-2.0, pinned in
  `scripts/official-skills.lock`. **Do not hand-edit** — `update-official-skills.sh` `rm -rf`s each
  listed folder. To add or drop one, edit `scripts/official-skills.txt` (the script also prints
  upstream skills absent from the list). Industry packs are deliberately excluded to keep agent
  context small.
- **18 community** `sf-*` skills. Edited in place (now in `.claude/skill-library/`); the update script never
  touches them.
- **6 Nagarro SDLC** skills (`sdlc-*`). Edited in place in `.claude/skills/`.

Official skills bundle their own scripts and assets (~450 `.py`, ~250 `.sh`, ~177 `.cls` files, all
inside `skills/`). None of that is this repo's code; do not refactor or lint it.

## Context budget: `skills/` vs `skill-library/`

Every skill in `skills/` has its name and description injected into the system prompt on every
message, so `skills/` is capped at about 30 entries (27 now: 6 SDLC + 21 core Salesforce).
`skill-library/` is never loaded by any tool. Move a skill between them with `git mv` inside
`.claude/`, then run the sync script. `update-official-skills.sh` refreshes a skill wherever it lives.
Do not add skills to `skills/` without removing one.

## The product this harness delivers

Worth knowing when editing agents, commands or the SDLC skills — the two pipelines are what
downstream users actually run:

- **SDLC documents** → `/sdlc-brd` → `/sdlc-stories` → `/sdlc-architecture` → `/sdlc-test-cases`,
  with `/sdlc-trace` for status. Each stage runs in its own subagent, writes a **draft** under
  `docs/sdlc/` and stops for human review. Stages are decoupled by a shared ID scheme
  (`BR-04` → `FR-04.2` → `US-04-02` → `LLD-US-04-02` → `TC-US-04-02-007`), which is what lets a
  stage run in a fresh session or on a different tool. IDs are never renumbered once approved.
- **Spec-driven build** → `/sdd-constitution` (once) → `/sdd-specify` → `/sdd-clarify` → `/sdd-plan`
  → `/sdd-tasks` → `/sdd-implement` → `/sdd-verify`, writing under `specs/`.

The ID scheme and the Salesforce feasibility checklist live in the `sdlc-workflow` skill and are
referenced by every agent — change them there, not per agent.

The kit intentionally ships **no MCP configuration**: `@salesforce/mcp` reaches end of life on
2 November 2026 and that tooling is now the bundled skills. Jira issue creation is the one optional
MCP, connected by the user; without it the story agent emits a CSV.
