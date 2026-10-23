# SDLC Skill Library (Nagarro)

Custom skills built for the AI-assisted Salesforce SDLC. They are **not** official Salesforce skills
(those are under `skills/` and come from github.com/forcedotcom/sf-skills).

| Skill | Used by | Purpose |
|---|---|---|
| `sdlc-workflow` | all SDLC agents, `/sdlc-trace` | Pipeline map, artifact layout, traceability IDs, Salesforce feasibility checklist |
| `sdlc-brd-generate` | `sdlc-brd-agent`, `/sdlc-brd` | BRD from meeting notes, transcripts and emails |
| `sdlc-jira-story-generate` | `sdlc-jira-story-agent`, `/sdlc-stories` | Epics, user stories, Gherkin ACs, Jira CSV |
| `sdlc-solution-architecture-generate` | `sdlc-solution-architect-agent`, `/sdlc-architecture` | HLD, per-story LLD, ADRs, Mermaid diagrams |
| `sdlc-qa-test-case-generate` | `sdlc-qa-test-agent`, `/sdlc-test-cases` | Test cases, test strategy, CSV, traceability matrix |
| `sdlc-spec-driven-development` | `/sdd-*` commands | Spec → plan → tasks → implement → verify |

## Why each skill also appears under `skills/`

Claude Code, GitHub Copilot and Cursor only load skills from `skills/<skill-name>/SKILL.md`. The
sync script copies every skill in this library into `skills/` (each copy contains a `GENERATED.md`
note). Edit the skills here, in `.claude/SDLC_Skill_library/`, then run:

```bash
python3 scripts/sync-platforms.py
```
