---
description: Release readiness report, go/no-go recommendation, release notes and (after approval) Jira version and GitHub release
argument-hint: "<version, e.g. 1.4.0> [readiness | notes | close]"
disable-model-invocation: true
---
<!-- Generated from .claude/commands/sdlc-release.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow Part B of the `sdlc-deploy-release` skill in this conversation.

Version and step from the user: $ARGUMENTS

`readiness` builds the evidence-cited readiness report (every line cites a file; a missing artifact is
"No evidence") and a go/no-go recommendation for a person to decide; the `sdlc-release-readiness`
workflow can gather the evidence in parallel. `notes` writes release notes for business and technical
readers. `close` — only after the production deployment is recorded and the user says yes to each
action — sets the Jira fix version, creates the Git tag and the GitHub release. With no step given, do
`readiness` and `notes`. Write under `docs/sdlc/05-release/REL-<version>/` and stop after a summary a
manager can forward.
