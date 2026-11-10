# Setup checklist

Run at the end of setup, and again whenever `/sf-sdlc:doctor` is asked for. Each unticked item goes
into the report with its owner. Items that do not apply to the project (for example org checks
on a requirements-only project) are marked "n/a" with the reason.

## Tooling (`sf-sdlc doctor --json`)
- [ ] All required checks pass.
- [ ] Each failed optional check is reported with what stops working without it:
  - Salesforce Code Analyzer plugin → `/sf-sdlc:analyze`, the commit gate and review tool results
  - sfdx-git-delta → `sf sgd source delta`; the kit's own `delta` still works
  - Lightning Flow Scanner → flow rules in analysis
  - `gh` → pull requests and GitHub releases
  - mermaid-cli → SVG rendering of diagrams for Jira and Confluence
  - default target org → commands that rely on it; roles in the config still work
- [ ] Nothing was installed without the user asking.

## Project files (`sf-sdlc init --json`)
- [ ] `.claude/sf-sdlc.json` exists and is valid JSON.
- [ ] `.gitignore` covers `.sf/`, `.sfdx/`, `.sf-sdlc/`, `.claude/sf-sdlc.local.json`,
      `.claude/settings.local.json`.
- [ ] `code-analyzer.yml` exists for a Salesforce DX project (created, or the project's own kept).
- [ ] No existing file was overwritten.

## Configuration (`sf-sdlc config validate --json`)
- [ ] No errors. Every warning is reported with the key to change.
- [ ] `project.name` and `project.code` are set (code is used in document references and epic names).
- [ ] `salesforce.apiVersion` and `salesforce.packageDirectories` are `"auto"` or match
      `sfdx-project.json`; a deliberate difference is explained.
- [ ] Every role in `deploy.pipeline` except `production` has an alias under `orgs`.
- [ ] `orgs.production` lists every production alias, **supplied by a person**. If empty: reported
      as a risk, not filled in.
- [ ] Every alias was classified with `sf-sdlc org classify <alias> --json`;
      aliases under `orgs.production` classify as production; no alias under `dev`, `qa` or `uat`
      classifies as production; `unknown` results are reported.
- [ ] `git.mainBranch`, `git.integrationBranch` and `git.pullRequestBase` are branches that exist.
- [ ] `git.protectedBranches` contains the main branch, the integration branch and release
      branch patterns.
- [ ] `git.branchPattern` and `git.commitPattern` match what the team's history shows, or were
      confirmed.
- [ ] `deploy.testLevel` has an entry for every role in `deploy.pipeline`;
      `deploy.testLevel.production` is not `NoTestRun`.
- [ ] `deploy.validateBeforeDeploy` is true and `deploy.allowDirectProductionDeploy` is false,
      unless the user explicitly chose otherwise (recorded in the report).
- [ ] `quality.coverageTarget` is at least `quality.orgCoverageMinimum`, and both agree with an
      existing constitution or CI threshold.
- [ ] Jira: either `jira.enabled` is false, or site, project key, issue type names, field IDs
      and transition names are set from the Jira project itself or from the user — none guessed.
- [ ] `paths.docs` and `paths.specs` match folders the project already uses, if any.
- [ ] `hooks.mode` was explained to the user (`observe` logs what would be blocked, `enforce`
      blocks, `off` disables the advisory hooks; the org and write guards always enforce).
- [ ] Personal values are in `.claude/sf-sdlc.local.json`, not in the shared file.
- [ ] No credential, token, auth URL or password is in either config file.

## Skills (`sf-sdlc skills list --json`)
- [ ] Every installed technical skill has a stated reason: detection evidence, an org-only
      feature, or planned work.
- [ ] The user confirmed the list before installation.
- [ ] Business-analyst or manager projects have no technical skills installed.
- [ ] The skill listing budget check in `doctor` passes; otherwise removals were proposed.
- [ ] No skill is in state `modified` because of this setup; pre-existing modified skills were
      reported and left alone.
- [ ] `.claude/sf-sdlc.skills.lock.json` exists and lists the installed skills.
- [ ] Needs with no matching skill in the library are listed.

## Baseline
- [ ] Brownfield: `docs/sdlc/03-architecture/baseline/inventory.md` exists, names the commit it
      was taken from, and lists conventions found and gaps (including org-only components not
      verified).
- [ ] Greenfield: the file states greenfield and the evidence.
- [ ] Requirements-only project: baseline skipped, stated in the report.
- [ ] No org was queried without the user naming it; no production org was queried.

## Hand-over
- [ ] The report lists: detected facts, configuration with the source of each value, unset keys
      with owners, skills and reasons, failed checks with fixes, baseline, next step.
- [ ] The user was told what to commit: `.claude/sf-sdlc.json`, `.claude/skills/`,
      `.claude/sf-sdlc.skills.lock.json`, `.gitignore`, `code-analyzer.yml`, the baseline.
- [ ] Nothing was committed, pushed, deployed or retrieved by the setup itself.
