# Fit-gap analysis — {Project}

| Item | Details |
|---|---|
| Document reference | DISC-FG-{PROJECTCODE}-{NNN} |
| Version / date | {0.1} / {YYYY-MM-DD} |
| Status | Draft for review |
| Measured against | {BRD v{x.y} and backlog {date} / future-state statements in the discovery pack} |
| Target org | {alias} ({org kind}); source org(s): {aliases or "none"} |
| Evidence | `claim-register.md`, `org-comparison.md`, snapshots in `00-discovery/snapshots/` |

## 1. Summary
| Classification | Items | Effort (S/M/L/XL) |
|---|---|---|
| Fit — as is | {n} | — |
| Fit — configuration | {n} | {n S, n M…} |
| Gap — customisation | {n} | {…} |
| Gap — process change | {n} | decisions, not build |
| Out of scope | {n} | — |

Key messages: {three lines a sponsor reads}.

## 2. Fit-gap register
| ID | Requirement / capability | From | Current state (evidence) | Classification | Proposed resolution (declarative first) | Effort | Risk | Depends on | Decision owner | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| FG-001 | Agents see one console for all channels | BR-02 / SRC-01 | `{target}`: Service Console app, Omni-Channel on (`objects.json`, `queues.json`) | Fit — as is | Use the target console | — | Low | — | Service lead | High |
| FG-002 | Subjects become Case Reasons | SRC-02 / CLM-006 | Source: `Case.Subject_Category__c` (24 values); target: `Case.Reason` (11 values) | Gap — process change | Map 24 → 11 with the business; retire the custom field | M | Medium | Q-05 | Product owner | Medium |
| FG-003 | Market-specific routing without code | BR-04 | Target: 1 routing flow; source: Apex `CaseRouter` | Fit — configuration | Omni-Channel routing configuration and queues per market in metadata | M | Low | FG-002 | Tech lead | High |
| FG-004 | Letters fixed in bulk | BR-07 | Source: Conga; target: S-Docs | Gap — customisation | Rebuild templates in S-Docs; batch job for bulk regeneration | L | Medium | — | Tech lead | Medium |

Rules: one classification per item; every Fit — as is cites evidence; every Gap — customisation says
why configuration is not enough; every Gap — process change names the business owner who decides.

## 3. Risks and feasibility hits
| Item | Risk | Mitigation |
|---|---|---|

## 4. Proposed HLD changes
Only when `03-architecture/HLD.md` is already approved: the changes this analysis implies, for the
architect (`/sdlc-architecture`).

## 5. ADRs needed
| Decision | Options | Raised by |
|---|---|---|

## Approval record
| Role | Name | Decision | Date |
|---|---|---|---|
| Solution architect |  |  |  |
| Product owner |  |  |  |
