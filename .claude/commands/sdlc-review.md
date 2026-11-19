---
description: Review and verify a change — Code Analyzer, Salesforce best practice, security, governor limits, tests and coverage — with file and line evidence
argument-hint: "[story ID or feature folder | branch | paths; default: changes on the current branch]"
---
Use the **sdlc-code-review-agent** subagent to review this change, read-only.

Scope from the user: $ARGUMENTS

The agent runs in its own context, so the review is independent of the session that wrote the code.
It runs the official Salesforce Code Analyzer and the kit's source checks on the changed files, reads
every changed file in full against the project's Salesforce coding rules, checks each acceptance
criterion against the code and tests, and returns the report with a verdict (Approve, Approve with
conditions, Changes required) and findings that each cite file and line, a severity and a confidence.

When it returns, save the report unchanged to `specs/<story>/review.md`, or
`docs/sdlc/reviews/<branch>.md` when there is no feature folder. That is the only file written.
Then show the verdict, the Blocker and Major findings, and what was not reviewed. Do not fix anything
in this turn.
