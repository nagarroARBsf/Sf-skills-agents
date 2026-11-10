# Project configuration reference

Shared file: `.claude/sf-sdlc.json` (committed). Personal overrides:
`.claude/sf-sdlc.local.json` (not committed; same shape; its values win). Read the merged result
with `sf-sdlc config show --json`; check it with
`sf-sdlc config validate --json`.

Example values below are illustrations, not defaults to copy. "How to fill" says whether a key
is **detected**, **proposed** from evidence and confirmed, or **asked**.

## project

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `project.name` | Human-readable project name used in document titles and epic names | `"Customer 360 Sales"` | Detected: `name` in `sfdx-project.json`, else the repository folder name; confirm |
| `project.code` | Short code used in document references and the Jira epic prefix | `"C360"` | Asked. Do not derive it from the Jira key without asking |
| `project.client` | Client or business unit named in documents | `"Example Manufacturing Ltd"` | Asked |

## salesforce

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `salesforce.apiVersion` | API version for new metadata and for drift checks. `"auto"` reads `sourceApiVersion` from `sfdx-project.json` | `"auto"` or `"62.0"` | Detected. Keep `"auto"` unless the team pins a different version; then say why |
| `salesforce.packageDirectories` | Where source lives. `"auto"` reads `packageDirectories` from `sfdx-project.json` | `"auto"` or `["force-app", "core"]` | Detected |
| `salesforce.namespacePrefix` | Namespace of the package or org, if any; prefixed to API names in designs and checks | `""` or `"acme"` | Detected: `namespace` in `sfdx-project.json` |
| `salesforce.componentPrefix` | Naming prefix the team puts on its own components (classes, objects, LWC) | `"C360"` | Proposed: a prefix shared by most custom components in the inventory; confirm. Empty if none |

## orgs

Values are `sf` CLI aliases (or usernames). Roles are what commands accept as `--org <role>`.

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `orgs.dev` | The developer's working org: scratch org, developer sandbox or Developer Edition | `"c360-dev"` | Detected by `init` when the default target org is not production; otherwise proposed from `sf org list`. A personal value belongs in the local file |
| `orgs.qa` | Shared test org for system and integration testing | `"c360-qa"` | Proposed from `sf org list` and CI files; confirm |
| `orgs.uat` | Org for user acceptance testing and release validation | `"c360-uat"` | Proposed; confirm |
| `orgs.devHub` | Dev Hub used to create scratch orgs and packages | `"c360-hub"` | Proposed from `sf org list` (Dev Hub flag); confirm. Empty if scratch orgs are not used |
| `orgs.production` | **Array** of every alias that points at production. The guard hooks treat these as production whatever the org reports | `["c360-prod"]` | **Asked. Never guessed, never filled from a classifier result alone.** Empty = production recognised only by org type; report as a risk |

Additional roles (for example `sit`, `staging`, `hotfix`) may be added as further `orgs.<role>`
keys when `deploy.pipeline` names them.

## git

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `git.mainBranch` | Branch that matches production | `"main"` | Detected from the remote's default branch |
| `git.integrationBranch` | Branch feature work merges into; used as the default baseline for deltas and reviews | `"develop"` | Detected: `develop` if it exists, otherwise the main branch |
| `git.protectedBranches` | Branches (glob patterns allowed) that must not be pushed to directly; enforced by the branch guard | `["main", "develop", "release/*"]` | Proposed from branch list and branch protection described in the repository; confirm |
| `git.branchPattern` | Naming pattern for work branches. Placeholders: `{ticket}`, `{slug}` | `"feature/{ticket}-{slug}"` | Proposed from recent branch names; asked if inconsistent |
| `git.commitPattern` | Shape of a commit subject. Placeholders: `{ticket}`, `{summary}` | `"{ticket}: {summary}"` | Proposed from recent commit subjects; asked if inconsistent |
| `git.pullRequestBase` | Branch pull requests target | `"develop"` | Detected: the integration branch; confirm if the team uses release branches |

## jira

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `jira.enabled` | Whether agents may offer to read and write Jira (always after a preview and an explicit yes) | `true` | Asked |
| `jira.site` | Base URL of the Jira site, shown in previews | `"https://example.atlassian.net"` | Asked, or read from the connected Jira tool |
| `jira.projectKey` | Key of the Jira project that holds this work | `"C360"` | Asked. Required when `jira.enabled` is true |
| `jira.issueTypes.epic` / `.story` / `.bug` / `.task` | Exact issue type names in that project | `"Epic"`, `"Story"`, `"Bug"`, `"Task"` | Read from the project's issue types through the Jira tool, else asked |
| `jira.fields.storyPoints` | Field ID that stores the estimate | `"customfield_10016"` | Read from the project's fields through the Jira tool, else asked. Never guessed |
| `jira.fields.epicLink` | How a story points to its epic: `"parent"`, or the Epic Link custom field ID on projects that still use it | `"parent"` | Read or asked |
| `jira.fields.acceptanceCriteria` | Field ID for acceptance criteria. Empty = criteria are appended to the description | `"customfield_10042"` or `""` | Read or asked |
| `jira.labels` | Labels added to every issue the kit creates | `["salesforce"]` | Proposed; confirm |
| `jira.transitions.inProgress` / `.inReview` / `.readyForQa` / `.done` | Names of the workflow transitions the stages use | `"In Progress"`, `"In Review"`, `"Ready for QA"`, `"Done"` | Read from the project's workflow through the Jira tool, else asked |

## quality

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `quality.coverageTarget` | Minimum Apex coverage (%) for each new or changed class and trigger; 75 to 100 | `85` | Proposed from an existing constitution or CI threshold; confirm |
| `quality.orgCoverageMinimum` | Minimum org-wide Apex coverage (%) the project accepts; the platform requires 75 for production | `75` | Proposed; confirm |
| `quality.analyzerSeverityThreshold` | Blocking severity for Salesforce Code Analyzer (1 = most severe, 5 = least): violations of severity 1 up to this number block | `2` | Proposed from `code-analyzer.yml` or CI; confirm |
| `quality.analyzerRuleSelector` | Rule selection passed to Code Analyzer | `"Recommended"` | Proposed from `code-analyzer.yml` or CI; confirm |
| `quality.bulkTestSize` | Number of records in bulk tests; at least 200 (one trigger chunk) | `200` | Default is right for most projects; raise it for large-data-volume objects |

## deploy

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `deploy.pipeline` | Org roles in promotion order. A change must pass each stage before the next | `["dev", "qa", "uat", "production"]` | Proposed from CI files and documentation; asked if not evident |
| `deploy.testLevel.<role>` | Apex test level used when validating or deploying to that role: `NoTestRun`, `RunSpecifiedTests`, `RunLocalTests`, `RunAllTestsInOrg` (`RunRelevantTests` where the org supports it) | `{"dev": "NoTestRun", "qa": "RunLocalTests", "uat": "RunLocalTests", "production": "RunLocalTests"}` | Proposed from CI; confirm. `production` must never be `NoTestRun` |
| `deploy.validateBeforeDeploy` | Validate first, then quick-deploy the validated job | `true` | Keep true. Shared orgs and production are validated regardless |
| `deploy.allowDirectProductionDeploy` | Whether a production deployment without a recorded successful validation may even be asked for | `false` | Keep false unless the user explicitly decides otherwise |
| `deploy.useDelta` | Deploy only components changed since the target's last deployed commit, instead of the full package directories | `true` | Proposed: true when the team already deploys deltas or the project is large; confirm |
| `deploy.waitMinutes` | How long CLI commands wait for a deployment or test run before returning | `60` | Proposed from the longest test run the team reports; confirm |

## paths

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `paths.docs` | Root of the SDLC documents (BRD, backlog, architecture, QA, release) | `"docs/sdlc"` | Detected: an existing documents folder; otherwise keep the default |
| `paths.specs` | Root of spec-driven development folders and the constitution | `"specs"` | Detected: an existing folder; otherwise keep the default |

## hooks

| Key | Meaning | Example | How to fill |
|---|---|---|---|
| `hooks.mode` | Behaviour of the advisory hooks: `observe` (log what would be blocked), `enforce` (block), `off`. The org guard and write guard always enforce | `"observe"` | Start with `observe` on a new installation; move to `enforce` once the team has seen the log. Asked |
| `hooks.auditLog` | Keep a local log of org-affecting commands (who, when, command, target, result), readable with `sf-sdlc audit` | `true` | Keep true |
| `hooks.strictEvidence` | Refuse to finish an implementation run that ticked tasks without evidence | `false` | Asked; recommend true for regulated projects |

## Rules for editing the config
- Keep it valid JSON: no comments (the `$comment` key is allowed), no trailing commas.
- No secrets, tokens, passwords or auth URLs. Aliases only; authorisation stays in the `sf` CLI.
- Change one concern at a time and re-run `config validate`.
- The shared file is a team decision: propose changes, let the lead confirm, commit.
- A value another artifact quotes (for example the coverage target in `specs/constitution.md`)
  must be updated there too.

## Validation messages and what to do

| Message contains | Do |
|---|---|
| `not valid JSON` | Fix the syntax; do not regenerate the file over the user's values |
| `not found; defaults are in use` | Run `sf-sdlc init` |
| `orgs.production must be an array` | Write it as a list, even for one alias |
| `orgs.production is empty` | Ask the user for the production aliases; if they decline, report the risk |
| `hooks.mode must be` | Use `off`, `observe` or `enforce` |
| `unknown test level` | Use one of the test levels listed under `deploy.testLevel` |
| `deploy.testLevel.production must not be NoTestRun` | Set `RunLocalTests` (or stricter) |
| `quality.coverageTarget must be a number from 75 to 100` | Correct the value |
| `quality.analyzerSeverityThreshold must be 1 to 5` | Correct the value |
| `jira.enabled is true but jira.projectKey is empty` | Ask for the key, or set `jira.enabled` to false |
| `project.code is empty` | Ask for the code |
| `orgs.<role> has no alias but "<role>" is in deploy.pipeline` | Ask for the alias, or remove the role from the pipeline with the user's agreement |
