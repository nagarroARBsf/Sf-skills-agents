---
name: sdlc-trace
description: "Show SDLC status and the requirements traceability matrix (BR -> story -> LLD -> tests)"
argument-hint: "[optional: BR or epic filter]"
agent: agent
---
<!-- Generated from .claude/commands/sdlc-trace.md by scripts/sync-platforms.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Follow the `sdlc-workflow` skill. Read whatever exists under `docs/sdlc/` and `specs/` and report:

1. Which stages have artifacts, their version and status, and which stage comes next.
2. The traceability matrix (format in the skill's `references/traceability-matrix.md`), filtered
   by: (the text the user typed after the command, if any)
3. Gaps: BRs without stories, stories without LLD, ACs without test cases, stories without a spec,
   items without an upstream ID.
4. Open questions (`Q-nn`) still blocking work.

Write the matrix to `docs/sdlc/04-qa/rtm.md` only if the user asks to save it.
