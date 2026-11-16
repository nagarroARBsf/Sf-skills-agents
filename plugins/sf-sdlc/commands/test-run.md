---
description: Run Apex (and Jest) tests through the Salesforce CLI, report results and coverage, and log defects
argument-hint: "[org role or alias, default qa] [story IDs | test class names | all]"
---
<!-- Generated from .claude/commands/sdlc-test-run.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-qa-test-agent** subagent to execute the tests.

Target and scope from the user: $ARGUMENTS

The agent follows the `sdlc-test-execution` skill in Execute mode: confirms the target org is not
production, runs the tests with `sf-sdlc test run`, reads failures and per-class
coverage against the project targets, runs the UI cases in a real browser (Playwright, `sf-browser`;
the person signs in in the browser window the first time) with a screenshot per verified result, triages each failure (product defect, test defect, environment
or data), writes the test-run report under `docs/sdlc/04-qa/test-runs/` and a `DEF-nnn` record per
product defect. Creating Jira bugs needs a preview and an explicit yes. Stop after the report.
