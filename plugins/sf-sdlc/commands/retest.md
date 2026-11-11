---
description: Re-test fixed defects — re-run the failed and linked cases plus the regression set, and update defect status
argument-hint: "[DEF IDs | story IDs; default: all defects marked fixed]"
---
<!-- Generated from .claude/commands/sdlc-retest.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-qa-test-agent** subagent to re-test the fixes.

Defects or stories from the user: $ARGUMENTS

The agent follows the `sdlc-test-execution` skill in Re-test mode: for each defect it re-runs exactly
the cases that failed, the cases linked to the fix and the regression set, writes a new test-run
report, and updates the defect and test-case status. A defect is closed only with a cited passing
run and its "Constraint added" recorded (the test, Code Analyzer rule or hook that now catches it, or
`none` with a reason); one that still fails is reopened with the new evidence. Stop after the report.
