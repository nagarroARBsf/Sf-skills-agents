---
description: Review and verify a change — best practice, security, governor limits, tests and coverage — with file and line evidence
argument-hint: "[story ID or feature folder | branch | paths; default: changes on the current branch]"
---
Use the **sdlc-code-review-agent** subagent to review the change.

Scope from the user: $ARGUMENTS

The agent is read-only. It follows the `sdlc-code-review` skill, runs the official Salesforce Code
Analyzer on the changed files, checks each acceptance criterion against the code and tests, and
returns a report with a verdict (Approve, Approve with conditions, Changes required) and findings
that each cite file and line, a severity and a confidence.

Save the returned report to `specs/<story>/review.md` (or `docs/sdlc/reviews/<branch>.md` when there
is no feature folder), then show the verdict, the Blocker and Major findings, and what was not
reviewed. Do not fix anything in this turn.
