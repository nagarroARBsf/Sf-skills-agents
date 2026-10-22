---
description: Show SDLC status and the requirements traceability matrix (BR -> story -> LLD -> tests)
argument-hint: "[optional: BR or epic filter]"
---
Follow the `sdlc-workflow` skill. Read whatever exists under `docs/sdlc/` and `specs/` and report:

1. Which stages have artifacts, their version and status, and which stage comes next.
2. The traceability matrix (format in the skill's `references/traceability-matrix.md`), filtered
   by: $ARGUMENTS
3. Gaps: BRs without stories, stories without LLD, ACs without test cases, stories without a spec,
   items without an upstream ID.
4. Open questions (`Q-nn`) still blocking work.

Write the matrix to `docs/sdlc/04-qa/rtm.md` only if the user asks to save it.
