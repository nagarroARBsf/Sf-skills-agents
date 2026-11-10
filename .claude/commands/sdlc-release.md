---
description: Release readiness report, go/no-go recommendation, release notes and (after approval) Jira version and GitHub release
argument-hint: "<version, e.g. 1.4.0> [readiness | notes | close]"
disable-model-invocation: true
---
Use the **sdlc-release-agent** subagent to prepare the release.

Version and step from the user: $ARGUMENTS

The agent follows the release sections of the `sdlc-deploy-release` skill. `readiness` builds the
evidence-cited readiness report and a go/no-go recommendation for a person to decide. `notes` writes
release notes for business and technical readers. `close` — only after production deployment is
recorded and the user says yes to each action — sets the Jira fix version, creates the Git tag and
the GitHub release. With no step given it does `readiness` and `notes`. It writes under
`docs/sdlc/05-release/REL-<version>/`. Stop after the summary.
