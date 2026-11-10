---
description: Show where the project is in the lifecycle, what is blocked, and the requirements traceability matrix
argument-hint: "[optional: BR, epic, story or release filter]"
---
<!-- Generated from .claude/commands/sdlc-trace.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-workflow` skill. Read whatever exists under the docs and specs folders from
`.claude/sf-sdlc.json` (`paths.docs`, `paths.specs`) and report, in plain English first:

1. Stage by stage: which artifacts exist, their version, status and approval record, and what comes next.
2. The traceability matrix (format in the skill's `references/traceability-matrix.md`) from
   requirement to story, design, spec, review verdict, test cases, latest test run, open defects,
   deployment and release, filtered by: $ARGUMENTS
3. Gaps: BRs without stories, stories without LLD or spec, ACs without test cases, changes without a
   review, failed or missing test runs, open defects by severity, artifacts awaiting approval.
4. Open questions (`Q-nn`) still blocking work, and who should answer each.

Write the matrix to `docs/sdlc/04-qa/rtm.md` only if the user asks to save it.
