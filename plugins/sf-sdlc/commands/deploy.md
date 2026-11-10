---
description: Validate, then deploy to a named org through the Salesforce CLI, with a deployment record and rollback plan
argument-hint: "<org role or alias: qa | uat | production | alias> [validate | quick | status] [story IDs or --delta]"
disable-model-invocation: true
---
<!-- Generated from .claude/commands/sdlc-deploy.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-deployment-agent** subagent to run the deployment.

Target and scope from the user: $ARGUMENTS

If no target org was named, ask for it and stop; never choose one. The agent follows the
`sdlc-deploy-release` skill: classifies the target org and states the result, checks readiness
(review verdict, test runs), builds the full or delta manifest, validates first, reports every
failure with its likely cause, and quick-deploys the validated job only after the user approves the
validation result. Production needs the user to have named the org and confirmed in this
conversation; destructive changes need a separate explicit yes. It writes
`docs/sdlc/05-release/deployments/DEP-nnn.md` including the rollback plan. Stop after the report.
