# Salesforce project — AI delivery kit

This project uses the Nagarro Salesforce SDLC kit: spec-driven development, skills for each delivery
stage, four agents, guard hooks, coding rules and Salesforce skills. Follow them over generic habits.

## Project settings
Project-specific values live in `.claude/sf-sdlc.json` (org aliases and which are production, branch
rules, Jira project, coverage target, promotion order, document and template paths). Read it with
`node .claude/bin/sf-sdlc config show`; never hard-code a value it defines. If it is missing or
incomplete, offer `/sdlc-setup`.

## How work flows here
1. **Set up** (once): `/sdlc-setup` checks tooling, writes the config, records what already exists and
   installs the skills this project needs. `/sdlc-doctor` re-checks at any time.
2. **Requirements → design** (documents under `docs/sdlc/`):
   `/sdlc-brd` → `/sdlc-stories` → `/sdlc-architecture` (and `/sdlc-diagram`) → `/sdlc-test-cases`.
3. **Build** (spec-driven, files under `specs/`):
   `/sdd-constitution` (once) → `/sdd-specify <story>` → `/sdd-clarify` → `/sdd-plan` → `/sdd-tasks`
   → `/sdd-implement` → `/sdd-verify`.
   Any non-trivial change (more than a typo, label or one-line fix) goes through a spec first. If a
   request skips it, say so and offer `/sdd-specify`.
4. **Verify → ship**: `/sdlc-review` (and `/sdlc-analyze`) → `/sdlc-deploy <org>` → `/sdlc-test-run`
   and `/sdlc-ui-test` → `/sdlc-retest` → `/sdlc-release <version>`. `/sdlc-trace` shows status and
   traceability at any time.

Most stages run here, in the main conversation, following their skill; planning and building use
your own plan mode and editing. Four run in an agent: `sdlc-brd-agent` (BRD),
`sdlc-solution-architect-agent` (architecture and diagrams) and `sdlc-qa-test-agent` (test design,
test runs, browser UI tests), because they read large inputs; and `sdlc-code-review-agent`
(`/sdlc-review`: Code Analyzer plus the coding rules, read-only), so the review is independent of
whoever wrote the code. Each stage writes a
draft and stops for human review. Only a person fills in an approval record; never mark your own
output approved, and never start the next stage unasked.

## Planning
When the user asks for a plan, an approach or an impact analysis, or plan mode is on, write the plan
in the spec-driven format: the 12 sections of the `sdlc-spec-driven-development` plan template, in
order, after reading the code it touches. When plan mode is approved, save the plan as
`specs/<feature>/plan.md` (status `Draft for review`) before continuing; plan-mode approval is not the
plan's approval record.

## Skills and templates
The `sdlc-*` skills define the method for each stage; `sf-sdlc-setup` sets the kit up. Salesforce
technical skills (Apex, LWC, Flow, objects, permissions, deployment and so on) are installed per
project in `.claude/skills/`. Load the matching installed skill before generating Salesforce metadata
or code. When a task needs one that is not installed, say which and offer `/sdlc-skills`; do not
install skills unasked. When a skill uses a document or Jira template, use the team's own copy in the
project templates folder (`paths.templates`) when one exists.

## Salesforce engineering rules (always)
- Security: explicit sharing on every class (`with sharing` by default); an explicit access mode on
  every query and DML (`WITH USER_MODE`, `as user`, `AccessLevel.USER_MODE`), never
  `WITH SECURITY_ENFORCED`; bind variables, never concatenated SOQL; access through permission sets and
  custom permissions; no hard-coded IDs, profile names, endpoints or secrets.
- Bulk-safe: no SOQL/DML in loops; collections in, collections out; one trigger per object with a
  handler.
- Tests: written from acceptance criteria; `Assert` class with messages; positive, negative, bulk and
  minimum-access `System.runAs` cases; test data factory; no `SeeAllData`.
- Declarative first when it stays maintainable; record the reason when choosing code.
- Configuration values in Custom Metadata; user-facing text in Custom Labels.
- Static analysis: the official Salesforce Code Analyzer (`node .claude/bin/sf-sdlc analyze`) must
  show no violation at or above the project's blocking severity before a change is committed.

Detailed, file-type-specific rules live in `.claude/rules/` and load when matching files are opened.

## Orgs and deployment
- For object schema and record data, use the read-only `sf-sobject-reads` MCP server when it is
  connected; otherwise `sf sobject describe` and `sf data query`. Never guess at org data.
- Never deploy to, delete from or change data in production or a shared org unless the user names
  the org and confirms in this conversation. Treat an org you cannot classify as production.
- Validate before deploying (`sf project deploy validate`, then `sf project deploy quick`). Never use
  `NoTestRun` against production.
- Guard hooks enforce this and may deny or ask. A denied command is a decision, not an obstacle: do
  not rephrase the command to get around it; report it and ask.
- Never read, print or write CLI credentials (`.sf/`, `.sfdx/`, auth URLs, access tokens, keys) or the
  browser sign-in in `.sf-sdlc/browser-profile/`. Browser (UI) tests run only in non-production orgs.

## Working style
- Read existing code and conventions before writing; reuse frameworks and utilities already here.
- Keep sessions focused on one feature; start a new session for a new story.
- State assumptions; ask when a requirement is ambiguous rather than guessing.
- Report what was actually run and what it returned. "Not run" is acceptable; implying a check
  that did not happen is not.
