---
description: Validate, then deploy to a named org through the Salesforce CLI, with a deployment record and rollback plan
argument-hint: "<org role or alias: qa | uat | production | alias> [validate | quick | status] [story IDs or --delta]"
disable-model-invocation: true
---
Follow Part A of the `sdlc-deploy-release` skill in this conversation.

Target and scope from the user: $ARGUMENTS

If no target org was named, ask for it and stop; never choose one. Classify the target org with
`node .claude/bin/sf-sdlc org classify <alias> --json` and state the result first (unknown counts as
production). Check readiness (review verdict, test runs, clean working tree), build the full or delta
manifest, validate first, report every failure with its likely cause, and quick-deploy the validated
job only after the user approves the validation result. Production needs the user to have named the
org and confirmed in this conversation; destructive changes need a separate explicit yes. Do not change
source to make a deployment pass. Write `docs/sdlc/05-release/deployments/DEP-nnn.md` including the
rollback plan, then stop after the report.
