# Salesforce project — AI harness

This project uses the Nagarro Salesforce SDLC kit: Salesforce skills, SDLC agents, spec-driven
development commands and coding rules. Follow them over generic habits.

## How work flows here
1. **Requirements → design** (documents under `docs/sdlc/`):
   `/sdlc-brd` → `/sdlc-stories` → `/sdlc-architecture` → `/sdlc-test-cases`; status with `/sdlc-trace`.
   Each stage runs in its own agent, writes a draft and stops for human review.
2. **Build** (spec-driven, files under `specs/`):
   `/sdd-constitution` (once) → `/sdd-specify <story>` → `/sdd-clarify` → `/sdd-plan` → `/sdd-tasks`
   → `/sdd-implement` → `/sdd-verify`.
   Any non-trivial change (more than a typo, label or one-line fix) goes through a spec first. If a
   request skips it, say so and offer `/sdd-specify`.
3. **Specialist skills** (`platform-*`, `automation-flow-generate`, `experience-lwc-*`,
   `dx-*`, `omnistudio-*`, `agentforce-*`, `integration-*`) do the actual metadata and code work.
   Load the matching skill before generating Salesforce metadata or code.
   Only a core set is loaded in `skills/`. Others (OmniStudio, Agentforce, Experience Cloud,
   integration, DevOps and so on) wait in `skill-library/`; when a task needs one, tell the user and
   offer to copy it into `skills/` (see `skill-library/README.md`).

## Salesforce engineering rules (always)
- Security: `with sharing` by default; `WITH USER_MODE` / `AccessLevel.USER_MODE`; bind variables,
  never concatenated SOQL; access through permission sets and custom permissions; no hard-coded
  IDs, profile names, endpoints or secrets.
- Bulk-safe: no SOQL/DML in loops; collections in, collections out; one trigger per object with a
  handler.
- Tests: written from acceptance criteria; meaningful assertions; positive, negative, bulk (≥ 200)
  and `System.runAs` permission cases; TestDataFactory; no `SeeAllData`.
- Declarative first when it stays maintainable; record the reason when choosing code.
- Configuration values in Custom Metadata; user-facing text in Custom Labels.
- Never deploy to production or shared orgs unless the user names the org and confirms. Prefer
  `--dry-run` validation.

Detailed, file-type-specific rules live in `.claude/rules/` and load when matching files are opened.

## Working style
- Read existing code and conventions before writing; reuse frameworks and utilities already here.
- Keep sessions focused on one feature; start a new session for a new story.
- State assumptions; ask when a requirement is ambiguous rather than guessing.
