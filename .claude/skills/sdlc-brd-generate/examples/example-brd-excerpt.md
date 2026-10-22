# Example: one fully written BR

Fictional client. Shows the expected depth for a single §8 subsection, plus the matching
entries elsewhere in the BRD. Sources: `SRC-01` workshop notes (BA), `SRC-02` transcript of the
sales leadership call, `SRC-03` email from the VP Sales.

---

### 8.4 BR-04: Opportunity health and risk insight

**8.4.1 Description** — Sales managers need an objective view of how healthy each open deal is and
why, so that pipeline reviews focus on deals at risk instead of on gathering data. Today managers
rely on rep judgement and discover slipped or over-discounted deals at quarter end (SRC-02 ~08:15).

**8.4.2 Business scenario** — Before the weekly pipeline call, a Sales Manager opens each large
opportunity. Without reading the activity history, they see a health score, which risk factors
apply (for example the close date has passed or no decision maker is identified), and a short
explanation of each. A Sales Representative sees the score and risk flags on their own deals but
not the coaching explanations (SRC-01 §3, SRC-03).

**8.4.3 Functional requirements**

| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-04.1 | The system shall display a health score from 0 to 100 on every open opportunity. | Must | SRC-01 §3 |
| FR-04.2 | The system shall calculate the score from a starting value of 100, reduced by the deductions defined in RULE-04.1 to RULE-04.5, with a minimum of 0. | Must | SRC-01 §3 |
| FR-04.3 | The system shall show each active risk factor as a separate visual indicator next to the score. | Must | SRC-02 ~09:40 |
| FR-04.4 | The system shall show a one-sentence explanation and suggested action for each active risk factor to Sales Managers and Sales Leadership. | Should | SRC-03 |
| FR-04.5 | The system shall not show risk explanations to Sales Representatives. | Should | SRC-03 |
| FR-04.6 | The system shall make the score available for filtering and grouping in reports and dashboards. | Must | SRC-02 ~11:02 |
| FR-04.7 | The system shall reflect changes to the underlying opportunity data in the score no later than [TBD] (see Q-05). | Must | SRC-02 ~11:30 [Inferred: "always up to date"] |

**8.4.4 Business rules**

| ID | Rule | Source |
|---|---|---|
| RULE-04.1 | Close date earlier than today on an open opportunity: deduct 20. | SRC-01 §3 |
| RULE-04.2 | Stage is Proposal and no decision maker identified: deduct 20. | SRC-01 §3 |
| RULE-04.3 | Discount above 20%: deduct 10. | SRC-01 §3 |
| RULE-04.4 | No stage change for more than [TBD] days: deduct 15. | SRC-02 ~10:20, Q-06 |
| RULE-04.5 | Amount missing or zero: deduct 15. [Inferred from "deals with no value are noise", SRC-02 ~10:45] | SRC-02 |
| RULE-04.6 | Score bands: 80-100 Healthy (green), 50-79 At risk (amber), 0-49 Critical (red). | SRC-02 ~09:55 |

**8.4.5 Data requirements**

| Data element | Business meaning | Format / allowed values | Mandatory | Source |
|---|---|---|---|---|
| Health score | Calculated deal health | Whole number 0-100 | System-calculated | SRC-01 |
| Decision maker identified | Whether a decision maker contact is known | Yes / No | At Proposal stage | SRC-01 |
| Discount percentage | Discount offered | 0-100% | When discount offered | SRC-01 |

**8.4.6 User interface and experience** — Score, colour band and risk indicators visible without
scrolling on the opportunity page, on desktop and the mobile app. Colour must not be the only
signal (text label with each colour), per NFR-06.

**8.4.7 Reporting needs** — "At-risk deals by owner" and "Critical deals over {amount}" on the
manager dashboard (BR-05).

**8.4.8 Requirement-specific NFRs** — Adding the score display must not push opportunity page load
above NFR-01. Must handle the full open pipeline ([TBD] records, Q-02) in any recalculation.

**8.4.9 Acceptance criteria (business-level)**
- AC-04.1 A manager can see the score, band and active risk factors on an opportunity without
  opening another page.
- AC-04.2 For a test opportunity with an overdue close date and a 25% discount, the score shows 70.
- AC-04.3 A sales rep sees the score and indicators on their opportunity but no explanations.
- AC-04.4 A report can list open opportunities with a score below 50, grouped by owner.

**8.4.10 Delivery notes** — VP Sales asked for the score and indicators first; explanations can
follow in the same release if time allows (SRC-03).

**8.4.11 Related items** — D-02 (decision maker data captured by BR-03), R-04 (score trusted only
if data quality improves), Q-05, Q-06.

---

### Matching entries elsewhere in the BRD

§17 Open Questions

| ID | Question | Why it matters | Raised from | Ask | Status |
|---|---|---|---|---|---|
| Q-05 | How quickly must the score reflect changes? Note: an overdue close date happens with time, without anyone editing the record, so a stored score needs a daily recalculation. Is "updated by next morning" acceptable for the overdue factor? | FR-04.7, RULE-04.1, feasibility F2 | SRC-02 ~11:30 | VP Sales | Open |
| Q-06 | After how many days without a stage change is a deal "stagnant"? Values of 30 and 60 days were both mentioned. | RULE-04.4 | SRC-02 ~10:20 | Head of Sales | Open |

Appendix C

| BR / FR | Likely Salesforce capability | Fit | Notes / feasibility flags |
|---|---|---|---|
| FR-04.1–04.3 | Custom LWC on Opportunity record page | Custom code | Decision recorded in SRC-01 to use a custom component |
| FR-04.2, FR-04.7 | Stored number field + scheduled recalculation, or formula | Declarative / Custom code | F2: time-based deduction goes stale if only recalculated on edit |
| FR-04.5 | Custom Permission for managers | Configuration | F5: do not hard-code profile names |
| FR-04.6 | Standard reports on the stored field | Standard | Formula with TODAY() cannot be used in roll-ups (F2) |
