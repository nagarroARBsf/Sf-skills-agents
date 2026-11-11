---
name: sdlc-project-setup
description: "Set a Salesforce project up for the SDLC kit: check tooling with doctor, detect what the project and org contain, create and fill the project configuration (.claude/sf-sdlc.json) from detection first and questions only for what cannot be detected (production org aliases, Jira project, promotion order, branch model), choose which Salesforce technical skills to install with the evidence for each, keep the set small, sync skills after upgrades without overwriting local edits, pick a persona profile (developer, admin, business analyst), record the brownfield baseline inventory, and draft the grounding files (business ontology, feature map). TRIGGER when: user asks to set up or configure a project for the kit, which skills to install or remove, what a configuration key means, reports a failing doctor check, or runs /sdlc-setup, /sdlc-doctor or /sdlc-skills. DO NOT TRIGGER when: the user wants architecture work (use sdlc-solution-architecture-generate) or a deployment (use sdlc-deploy-release)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-project-setup

Find out what is there before anyone designs or builds, and leave the project configured so
every other agent works from facts. **Detect first, ask second, never guess.**

Sequence: doctor → detect → init → configuration → skill selection → baseline → grounding →
final check.

## Ground rules
- Read-only towards orgs and source: setup does not deploy, retrieve into the source tree,
  change an org, or edit Salesforce metadata. It writes only `.claude/sf-sdlc.json`,
  `.claude/sf-sdlc.local.json`, installed skills and their lock file, the files `init` creates,
  the baseline inventory and the grounding drafts.
- Never read, print or write CLI credentials (`.sf/`, `.sfdx/`, auth URLs, access tokens).
- Never guess which org is production. An empty `orgs.production` is reported as a risk.
- Never install skills without the user's confirmation of the list.

## 1. Doctor
Run `node .claude/bin/sf-sdlc doctor --json`. For each failed check report the item, why it
matters and the exact fix command from the output.
- **Required** items failing (for example the `sf` CLI missing, an invalid config file): stop
  after reporting; the user fixes them, then setup resumes. Do not install tools unasked.
- **Optional** items (Code Analyzer plugin, sfdx-git-delta, Lightning Flow Scanner, `gh`,
  mermaid-cli, a default target org): say what stops working without each and continue.
- Projects with no Salesforce source and no `sfdx-project.json` (requirements-only work) are
  valid: say so and continue with the business-analyst profile.

## 2. Detect
Run `node .claude/bin/sf-sdlc detect --json`. Read from it: whether this is a Salesforce DX
project, greenfield or not, API version, package directories, namespace, packaging, metadata
folders and counts, tooling files (`package.json`, Jest config, scratch definition, CI files,
`code-analyzer.yml`), and which SDLC documents already exist.

Add what the detector does not report, by reading (not changing):
- `git remote -v`, `git branch -a`, recent branch names and commit subjects (branch model,
  ticket-key pattern, commit convention);
- `sf org list --json` for authorised aliases, and
  `node .claude/bin/sf-sdlc org classify <alias> --json` for each alias the project might use;
- `README`, contribution guide, CI workflow files (which branches deploy where, test levels);
- an existing `specs/constitution.md`, `docs/sdlc/` and `.claude/rules/`.

## 3. Init
Run `node .claude/bin/sf-sdlc init --json`. It creates what is missing and keeps what exists:
`.claude/sf-sdlc.json` (pre-filled with the project name, namespace, main branch, an
integration branch if one exists, and the default target org as `orgs.dev` when that org is not
production), `.gitignore` entries for CLI auth and local state, `code-analyzer.yml` for
Salesforce DX projects, and a pull-request template. Report what was created and what was kept.
Never delete or overwrite an existing config; edit it key by key.

## 4. Configuration
Fill `.claude/sf-sdlc.json` using
[references/config-reference.md](references/config-reference.md) (every key: meaning, example,
how to detect it, whether to ask).

1. **From detection, without asking**: `salesforce.*` (leave `"auto"` unless the project
   overrides `sfdx-project.json`), `git.mainBranch`, `git.integrationBranch`,
   `git.pullRequestBase`, `git.branchPattern` and `git.commitPattern` when history shows one
   consistent convention, `project.name`.
2. **Proposed from evidence, confirmed by the user**: org aliases per role (from `sf org list`
   and the classifier), `git.protectedBranches`, `deploy.pipeline` and `deploy.testLevel` (from
   CI files), `quality.*` (from an existing constitution, CI thresholds or `code-analyzer.yml`).
   Show the evidence with each proposal.
3. **Asked, because they cannot be detected**: `orgs.production` (which aliases are production),
   `project.code` and `project.client`, the Jira block (`jira.enabled`, site, project key,
   issue type names, field IDs, transition names), the promotion order if CI does not show it,
   the branch model if history is inconsistent.
4. Ask the open questions **in one batch**, each with the detected default. Do not ask what was
   detected. Leave a key at its default and list it as "unset" rather than inventing a value.
5. Jira field IDs: when a Jira tool is connected, read them from the project's fields and
   create screen and propose them; otherwise ask the user to supply them later. Never guess a
   `customfield_…` ID.
6. Personal values (a developer's own default org) go in `.claude/sf-sdlc.local.json`, which is
   not committed.
7. Run `node .claude/bin/sf-sdlc config validate --json`. Fix every error; report every
   warning with the key to change.

Safety checks on the result: every alias in `orgs.production` classifies as production (or the
user confirms an exception); no production alias also appears under `orgs.dev`, `qa` or `uat`;
`deploy.testLevel.production` is not `NoTestRun`; `deploy.allowDirectProductionDeploy` stays
false unless the user explicitly sets it.

## 5. Skill selection
The `sdlc-*` skills are always available. Salesforce technical skills are installed per
project into `.claude/skills/`, and every installed skill costs context in every session.

1. Run `node .claude/bin/sf-sdlc skills recommend --json` (add `--profile developer|admin|ba`
   for a starter set when there is little or no source to detect from).
2. **Explain each recommendation with its evidence**, taken from the output's reasons ("the
   project contains Lightning Web Components: `lwc/` has 14 bundles").
3. **Add what detection cannot see**, each with its own stated reason:
   - org-only features that are not in source (Experience Cloud sites, OmniStudio, Agentforce,
     Data Cloud, managed packages) — from `sf package installed list --target-org <alias>` on a
     non-production org the user names, or from the user;
   - planned work in the BRD, backlog or HLD (an integration, a mobile requirement, a data
     migration) that needs a skill the current source does not justify;
   - team conventions (a test framework, a DevOps tool).
   Find candidates with `node .claude/bin/sf-sdlc skills list --all --json`.
4. **Remove what is not needed**: recommendations for metadata the team will not touch.
5. **Persona profiles**:
   - *Business analyst or manager* (requirements, backlog, status, release reports): **no
     technical skills.** The `sdlc-*` skills are enough. Say so instead of installing a default set.
   - *Admin* (declarative work): data model, permissions, Flow, validation and sharing skills.
   - *Developer*: the above as needed, plus Apex, Apex tests, LWC, deployment and analysis.
   A mixed team installs for the work the repository holds, not for every role's maximum.
6. Show the final list (install, already installed, removed, with reasons) and **wait for
   confirmation**. Then `node .claude/bin/sf-sdlc skills install <names> --json`.
7. **Keep the set small.** `doctor` reports the skill listing budget; if it is exceeded, propose
   removals (`node .claude/bin/sf-sdlc skills remove <names>`) before adding anything.
8. The lock file `.claude/sf-sdlc.skills.lock.json` records source and content hash per
   installed skill; it is committed with the skills.

**Upgrades and local edits.** After a kit upgrade run
`node .claude/bin/sf-sdlc skills sync --dry-run --json`, show what would change, then
`skills sync`. Skills whose content differs from the lock are **locally modified**: sync and
remove leave them alone and report them. Never overwrite or force-remove a locally edited
skill; show the user the skill name and let them decide (keep the edit, or re-install after
saving it elsewhere). Skills in `.claude/skills/` that the kit did not install are
"unmanaged" and are never touched.

## 6. Baseline
For an existing project (detection shows metadata), record what exists so that later designs
can mark components New, Changed, Unchanged or Removed:
1. `node .claude/bin/sf-sdlc inventory --json`.
2. Write `docs/sdlc/03-architecture/baseline/inventory.md` (root from `paths.docs`) using the
   baseline template in
   `.claude/skills/sdlc-solution-architecture-generate/references/baseline-template.md`:
   classification, baseline commit, counts by metadata type, conventions found (trigger
   framework, naming prefix, test data factory, logging), automation per object, gaps.
3. State what the source tree cannot show (components created in Setup and never retrieved)
   and list it as a gap. Check an org only when the user names a non-production one.

Greenfield: write the short greenfield statement in the same file. Requirements-only projects:
skip the baseline and say so.

## 6b. Grounding
Draft the two grounding files described in the `sdlc-workflow` skill (section Grounding), under
`<paths.docs>/00-grounding/`. Never overwrite existing ones; propose additions instead.

1. **Check the hosted MCP servers**: `node .claude/bin/sf-sdlc mcp status --json`. It reports
   which servers `mcp.servers` turns on and whether each answers. If Metadata Grounding is off or
   inactive, say what it needs (turned on in Setup → MCP Servers; Data 360, API access and
   Salesforce Catalog; not available in scratch orgs) and continue without it.
2. **`feature-map.md`** from
   `.claude/skills/sdlc-workflow/references/feature-map-template.md`: group the baseline
   inventory by business capability (folder names, naming prefixes, object ownership, the BRD if
   one exists). When the grounding tools are connected, use `describe_metadata` and
   `search_metadata` to find org-only components (flows, fields, permission sets created in
   Setup) and mark them `(org only)`. Otherwise say "grounding not used: local source only".
3. **`ontology.yaml`** from `.claude/skills/sdlc-workflow/references/ontology-template.yaml`:
   only the terms that are ambiguous or project-specific (from the BRD, object labels that differ
   from API names, record types that split one object into several business things). Remove the
   template's example terms. Mark every inferred mapping `source: inferred` and list it as a
   question for the lead.
4. Greenfield or requirements-only projects: write the ontology from the BRD when one exists and
   an empty feature map with the header; say so.

Both files are drafts until the lead confirms the terms.

## 7. Final check
Run [references/setup-checklist.md](references/setup-checklist.md), then
`node .claude/bin/sf-sdlc doctor --json` and `node .claude/bin/sf-sdlc config validate --json`
once more.

Report, in this order:
1. What was detected (project type, greenfield or brownfield, API version, main metadata).
2. The configuration: values set and where each came from (detected / confirmed / supplied).
3. **Still unset**, each with who should supply it and what does not work until then
   (for example "`orgs.production` empty: production is recognised only by org type").
4. Skills installed and why; skills deliberately not installed; locally modified skills.
5. Failed doctor checks with the fix for each.
6. Baseline path, or why none was written; grounding files and whether the grounding MCP was used.
7. Next step: commit `.claude/sf-sdlc.json`, the skills and the lock file; then `/sdlc-brd` for
   new requirements, or `/sdd-constitution` and `/sdd-specify` for build work.

The configuration is a draft until the project lead confirms it. Do not start another stage.
