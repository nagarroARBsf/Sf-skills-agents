---
description: Spec-driven development gate for non-trivial changes
---

# Spec-driven development

For any change beyond a trivial edit (typo, label, formatting, one-line fix), work from a spec:

1. Check `specs/` for a feature folder matching the story or request.
2. If none exists, propose `/sdd-specify <story or description>` before writing code. If the user
   says to skip it, proceed and note "no spec" in your summary.
3. If one exists, read `specs/constitution.md`, `spec.md`, `plan.md` and `tasks.md`, and work
   within them. When the code needs to diverge, update the plan first and say why.
4. Tick tasks in `tasks.md` as they are completed.

The full method is in the `sdlc-spec-driven-development` skill.
