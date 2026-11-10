---
description: Re-test fixed defects — re-run the failed and linked cases plus the regression set, and update defect status
argument-hint: "[DEF IDs | story IDs; default: all defects marked fixed]"
---
Use the **sdlc-qa-test-agent** subagent to re-test the fixes.

Defects or stories from the user: $ARGUMENTS

The agent follows the `sdlc-test-execution` skill in Re-test mode: for each defect it re-runs exactly
the cases that failed, the cases linked to the fix and the regression set, writes a new test-run
report, and updates the defect and test-case status. A defect is closed only with a cited passing
run; one that still fails is reopened with the new evidence. Stop after the report.
