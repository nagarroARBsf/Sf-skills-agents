---
description: Run the official Salesforce Code Analyzer on staged, changed or chosen files and explain the result
argument-hint: "[--staged | --changed [base ref] | paths] [--severity 1-5]"
allowed-tools: Bash(sf-sdlc analyze*), Bash(sf-sdlc check*)
---
<!-- Generated from .claude/commands/sdlc-analyze.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Run `sf-sdlc analyze $ARGUMENTS --json` (with no arguments it scans the whole
package directories; prefer `--changed` on a feature branch).

Report:
1. Pass or fail against the blocking severity from `quality.analyzerSeverityThreshold`.
2. Violations at or above that severity, grouped by file, each with rule, line and what to change.
3. Counts of the lower-severity violations, without listing them unless asked.

If the scan could not run, give the fix from the error (for example
`sf plugins install code-analyzer`, or a missing Java runtime) and stop. Do not change code unless
the user asks for fixes.
