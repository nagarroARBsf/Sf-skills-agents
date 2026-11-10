<!-- Generated from .claude/CLAUDE.md and always-on .claude/rules/ by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# Salesforce project — AI delivery kit

This project uses the Nagarro Salesforce SDLC kit: delivery agents, spec-driven development commands,
guard hooks, coding rules and Salesforce skills. Follow them over generic habits.

## Project settings
Project-specific values live in `.claude/sf-sdlc.json` (org aliases and which are production, branch
rules, Jira project, coverage target, promotion order, document paths). Read it with
`sf-sdlc config show`; never hard-code a value it defines. If it is missing or
incomplete, offer `/sf-sdlc:setup`.

## How work flows here
1. **Set up** (once): `/sf-sdlc:setup` checks tooling, writes the config, records what already exists and
   installs the skills this project needs. `/sf-sdlc:doctor` re-checks at any time.
2. **Requirements → design** (documents under `docs/sdlc/`):
   `/sf-sdlc:brd` → `/sf-sdlc:stories` → `/sf-sdlc:architecture` (and `/sf-sdlc:diagram`) → `/sf-sdlc:test-cases`.
3. **Build** (spec-driven, files under `specs/`):
   `/sf-sdlc:constitution` (once) → `/sf-sdlc:specify <story>` → `/sf-sdlc:clarify` → `/sf-sdlc:plan` → `/sf-sdlc:tasks`
   → `/sf-sdlc:implement` → `/sf-sdlc:verify`.
   Any non-trivial change (more than a typo, label or one-line fix) goes through a spec first. If a
   request skips it, say so and offer `/sf-sdlc:specify`.
4. **Verify → ship**: `/sf-sdlc:review` (and `/sf-sdlc:analyze`) → `/sf-sdlc:deploy <org>` → `/sf-sdlc:test-run`
   → `/sf-sdlc:retest` → `/sf-sdlc:release <version>`. `/sf-sdlc:trace` shows status and traceability at any time.

Each stage runs in its own agent, writes a draft and stops for human review. Only a person fills in
an approval record; never mark your own output approved, and never start the next stage unasked.

## Skills
The `sdlc-*` skills define the method for each stage. Salesforce technical skills (Apex, LWC, Flow,
objects, permissions, deployment and so on) are installed per project in `.claude/skills/`. Load the
matching installed skill before generating Salesforce metadata or code. When a task needs one that
is not installed, say which and offer `/sf-sdlc:skills`; do not install skills unasked.

## Salesforce engineering rules (always)
- Security: `with sharing` by default; `WITH USER_MODE` / `AccessLevel.USER_MODE`; bind variables,
  never concatenated SOQL; access through permission sets and custom permissions; no hard-coded
  IDs, profile names, endpoints or secrets.
- Bulk-safe: no SOQL/DML in loops; collections in, collections out; one trigger per object with a
  handler.
- Tests: written from acceptance criteria; meaningful assertions; positive, negative, bulk and
  `System.runAs` permission cases; test data factory; no `SeeAllData`.
- Declarative first when it stays maintainable; record the reason when choosing code.
- Configuration values in Custom Metadata; user-facing text in Custom Labels.
- Static analysis: the official Salesforce Code Analyzer (`sf-sdlc analyze`) must
  show no violation at or above the project's blocking severity before a change is committed.

Detailed, file-type-specific rules are in the `salesforce-coding-rules` skill: load it before writing or reviewing Apex, LWC, metadata XML or SDLC documents.

## Orgs and deployment
- Never deploy to, delete from or change data in production or a shared org unless the user names
  the org and confirms in this conversation. Treat an org you cannot classify as production.
- Validate before deploying (`sf project deploy validate`, then `sf project deploy quick`). Never use
  `NoTestRun` against production.
- Guard hooks enforce this and may deny or ask. A denied command is a decision, not an obstacle: do
  not rephrase the command to get around it; report it and ask.
- Never read, print or write CLI credentials (`.sf/`, `.sfdx/`, auth URLs, access tokens, keys).

## Working style
- Read existing code and conventions before writing; reuse frameworks and utilities already here.
- Keep sessions focused on one feature; start a new session for a new story.
- State assumptions; ask when a requirement is ambiguous rather than guessing.
- Report what was actually run and what it returned. "Not run" is acceptable; implying a check
  that did not happen is not.

# Spec-driven development

For any change beyond a trivial edit (typo, label, formatting, one-line fix), work from a spec:

1. Check `specs/` for a feature folder matching the story or request.
2. If none exists, propose `/sf-sdlc:specify <story or description>` before writing code. If the user
   says to skip it, proceed and note "no spec" in your summary.
3. If one exists, read `specs/constitution.md`, `spec.md`, `plan.md` and `tasks.md`, and work
   within them. When the code needs to diverge, update the plan first and say why.
4. Tick tasks in `tasks.md` as they are completed.

The full method is in the `sdlc-spec-driven-development` skill.
