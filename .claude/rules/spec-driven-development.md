---
description: Spec-driven development gate for non-trivial changes and for every plan
---

# Spec-driven development

For any change beyond a trivial edit (typo, label, formatting, one-line fix), work from a spec:

1. Check `specs/` for a feature folder matching the story or request.
2. If none exists, propose `/sdd-specify <story or description>` before writing code. If the user
   says to skip it, proceed and note "no spec" in your summary.
3. If one exists, read `specs/constitution.md`, `spec.md`, `plan.md` and `tasks.md`, and work
   within them. When the code needs to diverge, update the plan (or the spec, for a scope change)
   first and say why.
4. The spec says what and why only, with measurable success criteria and at most 3
   `[NEEDS CLARIFICATION]` markers; do not plan while markers remain unless the user accepts the risk.
5. Every plan — `/sdd-plan`, plan mode or a plain request for a plan — uses the 12-section plan format
   and passes the constitution check before and after design.
6. Every requirement and acceptance criterion maps to a task and a test; run the consistency check
   (spec ↔ plan ↔ tasks) before writing code and fix critical findings at their source.
7. Tests first. Tick a task in `tasks.md` only with evidence: the command and its result.

The full method is in the `sdlc-spec-driven-development` skill.
