# Extraction guide: from conversation to requirements

Transcripts are noisy: people think aloud, change their minds, and mix problems with solutions.
Prepare the transcript first with [transcript-handling.md](transcript-handling.md) (speaker map,
noise, decisions versus discussion, contradictions, sensitive data). Then classify each relevant
statement and decide where it lands in the BRD.

| Class | Signals in the text | Lands in |
|---|---|---|
| Objective | "we want to", "the goal is", targets, "by Q3" | §3 |
| Pain point + metric | "takes two weeks", "60% accurate", "nobody trusts" | §2.3 (keep the number) |
| Stakeholder | names, titles, "my team", "the regional managers" | §5.1 |
| Persona need | "reps need to", "as a manager I" | §5.2, §8.n.2 |
| Process step | sequences, "then", "after that", hand-offs | §6 |
| Requirement | "must", "need", "should be able to", "has to show" | §8.n.3 |
| Business rule | "only if", "never", "cannot", thresholds, approvals | §8.n.4 |
| Data element | fields, values, picklists, "we capture" | §8.n.5, §10 |
| Report need | "dashboard", "see at a glance", "report on" | §8.n.7, §11 |
| NFR | speed, volume, uptime, mobile, audit, privacy | §8.n.8, §9 |
| Integration | other systems, "pulls from", "sends to", ERP, email | §10.3 |
| Constraint | budget, deadline, licence, "must use", regulation | §14 |
| Assumption | "I think", "probably", "we assume" | §13 |
| Decision | "we agreed", "let's go with", "decision:" | Appendix E `DEC-nn` + the FR, rule or constraint it settles |
| Action item | "can you check", "I'll send", "we need to find out", a named owner | Appendix E `ACT-nn` |
| Salesforce signal | existing org, objects, packages, licences, sandboxes, volumes, "today in Salesforce we…" | Appendix D (tag `[Stated]`) |
| Sensitive data | customer names, contact details, record values, credentials | Not copied; Appendix B flag |
| Risk | worries, "if adoption fails", "last time" | §16 |
| Open question | unanswered questions, "to confirm", "TBD", conflicts | §17 |
| Out of scope | "not now", "phase 2", "park that" | §4.2 / §4.3 |

## Solution talk is evidence, not a requirement

When a stakeholder says "build an LWC with a donut chart", extract the need ("see opportunity
distribution by stage on the account at a glance") into the FR, and keep the stated solution in
Appendix C, Appendix D.3 or Delivery Notes as the stakeholder's preference, tagged `[Stated]`. Exception: if the stakeholder
**decided** it (for example a recorded decision to use a custom component), keep it as a
constraint and cite the decision.

## Conflicts

Resolve by recency, then authority, and log every contradiction as a `Q-nn` even when resolved
(full rules in [transcript-handling.md](transcript-handling.md) section 5).

| Situation | Action |
|---|---|
| Later explicit decision vs earlier idea | Use the decision; cite both sources; log `Q-nn` to confirm |
| Decision owner vs contributor | Use the decision owner's explicit statement; log `Q-nn`; note the other as a risk if it matters |
| Two numbers for the same thing (40% vs 50%) | Keep the range ("40-50%") if both are from credible sources; otherwise `[TBD]` + `Q-nn` |
| Notes vs transcript disagree | The transcript is primary for what was said; the notes are primary for decisions recorded after the meeting |
| No rule decides | Keep both positions in the `Q-nn`; affected items stay `[TBD]` |

## Precision rewrites

| Heard | Write |
|---|---|
| "real time" | "within {n} seconds [TBD]" + Q-nn |
| "all the data" | list the data elements named; "[TBD] others" + Q-nn |
| "managers" | name the persona(s) and the hierarchy level |
| "flag it" | what is shown, where, to whom, and whether it blocks the action |
| "approve" | who approves, threshold, what happens on reject, timeout |
| "mobile" | which app or browser, online or offline |

## Source citations
Cite as `SRC-nn` plus a locator: section (`§3`), heading, timestamp (`~12:40`) or speaker.
One citation is enough for a clear requirement; two when you merged statements.
