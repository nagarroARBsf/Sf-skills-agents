# Transcript handling

Raw transcripts are the primary input. They are verbatim, unordered and noisy. Work through these
steps before classifying statements with `extraction-guide.md`. Never edit the source file; all
cleaning happens in working notes.

## 1. Identify the transcript format

| Format | Signs | Locator to cite |
|---|---|---|
| Timestamped with speaker labels (Teams, Zoom, Meet export) | `00:12:40 Jane Doe:` or `[12:40] Speaker 2` | `SRC-02 ~12:40` |
| Speaker labels, no timestamps | `Jane: …` | `SRC-02 Jane, turn 14` (count speaker turns) or the nearest heading |
| No speaker labels (auto-captions, pasted text) | continuous text | `SRC-02 ¶7` (paragraph number); attribution is `unknown speaker` |
| VTT / SRT caption file | cue numbers and `-->` time ranges | cue start time |

If one meeting spans several files, register each file as its own `SRC-nn` and note the order.

## 2. Speaker map

Build this table first; it drives authority-based conflict resolution and section 5.1.

| Label in transcript | Name | Role | Organisation | Decision rights (topic) | Evidence |
|---|---|---|---|---|---|
| Speaker 1 | {name} | VP Sales | Client | Sales process, priorities | introduces self at ~00:40 |
| Speaker 3 | unknown | unknown | unknown | none assumed | — |

Rules:
- Take name and role only from the transcript itself, the attendee list or the user. Never infer
  an identity from voice, topic or seniority of tone.
- Auto-generated labels drift: the same person may appear as `Speaker 2` and `Speaker 5`. Merge
  only with evidence (a self-introduction, being addressed by name); otherwise keep both.
- An unknown speaker has no authority. Their statements can be evidence for a need, never for a
  decision.
- Implementation-partner staff (consultants, architects) are recorded as such. Their suggestions
  are solution talk, not client requirements, until a client stakeholder accepts them.

## 3. Noise

| Noise | Treatment |
|---|---|
| Filler ("um", "you know", "sort of"), false starts, repeated words | Drop. |
| Small talk, logistics, audio checks, jokes | Drop. Do not turn humour or sarcasm into requirements ("just delete all the data") — if unsure whether it was serious, raise a question. |
| Thinking aloud ("maybe we could… or actually…") | Discussion. Keep only the final position, and only if someone closes it. |
| Cross-talk (overlapping speakers, interleaved half sentences) | Reconstruct only when each fragment's speaker is clear. Otherwise mark `cross-talk, unattributed` and do not extract from it. |
| `[inaudible]`, `[crosstalk]`, obviously wrong words from speech-to-text | Do not repair by guessing. A number or name next to an inaudible marker is unreliable: `[TBD]` plus `Q-nn`. |
| Mis-transcribed product terms ("sales force", "L W C" as "LWC", "flow" vs "Flo") | Normalise the obvious ones in working notes; if a term could be a system name, ask. |
| Hedged numbers ("about 40, maybe 50 percent") | Keep the range as said, mark `approx.`; do not pick one. |
| Agreement noises ("yeah", "right", "mm-hm") | Not approval. Approval needs words that refer to the proposal. |

## 4. Decisions versus discussion

Classify every topic thread by how it ended:

| Thread ended with | Class | Lands in |
|---|---|---|
| Explicit close by someone with decision rights ("agreed", "let's go with A", "decision: …") | Decision | Appendix E `DEC-nn`; reflected in the FR, rule or constraint it settles |
| Proposal, no objection, then the meeting moves on and later statements build on it | Decision `[Inferred]` | Appendix E with the reason; confirm via `Q-nn` |
| Options discussed, no close | Discussion | Not a requirement. Summarise the options in the `Q-nn` that asks for the decision |
| "We'll take that offline", "park it", "phase 2" | Deferred | Section 4.3 or `Q-nn`; action item if someone was named |
| Someone is asked to do or find out something | Action item | Appendix E `ACT-nn` with owner and due date as stated (`[TBD]` if not) |

A long discussion is not a strong requirement. Length and repetition are not evidence of
agreement; the close is.

## 5. Contradictions

Resolve in this order and **always log the contradiction** as a `Q-nn` in section 17, naming
both positions, the rule applied and who should confirm.

| Situation | Resolution |
|---|---|
| Same speaker changes position | The later statement stands. |
| Two speakers disagree, one has decision rights for the topic | The decision owner's position stands, provided it was stated explicitly. |
| Two speakers disagree, a later meeting or email settles it | The later explicit statement stands (recency across sources). |
| Recency and authority point in different directions (sponsor said X early, process owner says Y later) | Authority wins only if the sponsor's statement was an explicit decision; otherwise leave `[TBD]`. |
| Equal authority, no close | Unresolved: keep both positions in the question, mark affected items `[TBD]`. |
| Notes or minutes disagree with the transcript | The transcript is primary for what was said; the minutes are primary for decisions recorded after the meeting. Flag the mismatch. |
| Two numbers for the same thing | Keep the range if both speakers are credible; otherwise `[TBD]`. |

Question wording for a resolved contradiction:
`Q-06 — Stagnation threshold: Head of Sales said 60 days (SRC-02 ~10:20); VP Sales later said 30 days (SRC-02 ~31:05). Used 30 days (later statement, decision owner). Please confirm.`

## 6. Personal and sensitive data

Transcripts routinely contain data that must not travel into a requirements document.

| Found in the transcript | In the BRD |
|---|---|
| Names of the client's customers, patients, employees who are subjects of the process | Generic description ("a key account in the manufacturing segment"). |
| Email addresses, phone numbers, postal addresses, national or account identifiers | Omit. |
| Record-level data read out or screen-shared (a specific deal value with the customer's name, a case history) | Abstract to the pattern ("deals above the approval threshold"); keep numbers only when they are business rules or volumes. |
| Health, financial, HR or other special-category details about individuals | Omit; note that the process handles this category in section 12. |
| Passwords, API keys, tokens, security answers, connection strings, session or login URLs with credentials | Never copy. Tell the user it is exposed in the source so it can be rotated. |
| Org IDs, usernames of integration users, internal hostnames | Omit; say "the existing integration user", "the ERP endpoint". |
| Opinions about named individuals | Omit. |

Project stakeholders (the people in the meeting acting in their project role) are named in
section 5.1. That a category of personal data is *processed by the solution* is a requirement
(section 12, NFR-05): record the category, never the instances.

Log each occurrence in Appendix B, column "Sensitive content": the kind and the locator, never
the value (`customer contact names ~14:10-15:30; API key ~41:02`).

## 7. Working ledger shape

Keep one line per statement while extracting. The ledger is not part of the BRD.

```text
SRC-02 ~09:40 | VP Sales (decision owner) | Requirement | managers must see each risk factor separately | -> FR-04.3
SRC-02 ~10:20 | Head of Sales | Rule | stagnant after 60 days | contradicted ~31:05 -> Q-06
SRC-02 ~31:05 | VP Sales | Decision | stagnant after 30 days | -> RULE-04.4, DEC-03
SRC-02 ~33:10 | Speaker 4 (unknown) | Idea | donut chart on account | discussion, no close -> not extracted
SRC-02 ~41:02 | Partner architect | Sensitive | API key read aloud | -> Appendix B flag, report to user
```
