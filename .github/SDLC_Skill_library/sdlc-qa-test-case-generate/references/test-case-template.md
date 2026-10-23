# Test cases — US-{nn-mm}: {Story title}

| Item | Details |
|---|---|
| Story | US-{nn-mm} ({Jira key}), Source BR-{nn} |
| Design | LLD-US-{nn-mm} (or "black-box: no LLD") |
| Personas | {list} |
| Total cases | {n} — POS {n}, NEG {n}, EDGE {n}, SEC {n}, BULK {n}, INT {n}, UI {n}, PERF {n}, REG {n} |

## Coverage
| AC | Test cases |
|---|---|
| AC-1 | TC-US-04-02-001 |
| AC-3 | TC-US-04-02-004, -005, -006 |

## Design aids (when used)

Decision table — health score deductions:

| # | Overdue | Proposal w/o DM | Discount > 20% | Stagnant | No amount | Expected score | TC |
|---|---|---|---|---|---|---|---|
| 1 | N | N | N | N | N | 100 | 001 |
| 2 | Y | N | N | N | N | 80 | 002 |
| 3 | Y | N | Y | N | N | 70 | 003 |
| 4 | Y | Y | Y | Y | Y | 20 | 007 |

## Test cases

### TC-US-04-02-004 — Discount exactly at threshold applies no deduction
| Field | Value |
|---|---|
| Category / priority | EDGE / P2 |
| AC | AC-3 |
| Persona | Sales Rep (permission set `Sales_Rep_Access`) |
| Automation | Apex |

**Preconditions**
- Open opportunity "TC004 Edge" owned by the test Sales Rep, Stage = Qualification, Close date =
  today + 30, Amount = 10,000, Decision maker identified = true, Discount = 0%.

**Steps**
| # | Action | Expected result |
|---|---|---|
| 1 | Log in as the Sales Rep; open "TC004 Edge". | Health score shows 100 (green, "Healthy"). |
| 2 | Edit Discount % to 20.00 and save. | Record saves. |
| 3 | Refresh the page. | Health score still 100; no "High discount" indicator. |
| 4 | Edit Discount % to 20.01 and save; refresh. | Health score 90 (green); "High discount" indicator shown. |

**Test data / notes** — Discount field precision 2 decimals (LLD §4).

{Repeat for every case.}

## Apex test outline
| Test class | Method | Asserts |
|---|---|---|
| `OpportunityHealthServiceTest` | `calculate_noRisks_returns100` | score == 100 |
| | `calculate_discountAt20_noDeduction` | score == 100 |
| | `calculate_discountAbove20_deducts10` | score == 90 |
| | `recalculate_bulk200_withinLimits` | 200 updated; `Limits.getQueries()` ≤ 2 |
| | `recalculate_asRepWithoutFieldAccess_throws` | `System.runAs` user lacking FLS → exception/stripped |

## Regression impact
Existing behaviour to retest because the LLD modifies it: {e.g. other OpportunityTrigger logic,
existing validation rules on Opportunity}.

---

## CSV format (`test-cases.csv`)

```csv
Test Case ID,Story,AC,Title,Category,Priority,Persona,Preconditions,Steps,Expected Result,Test Data,Automation,Labels
"TC-US-04-02-004","US-04-02","AC-3","Discount exactly at threshold applies no deduction","EDGE","P2","Sales Rep","Open opportunity …","1. Log in as …
2. Edit Discount % to 20.00 …","1. Score 100 …
2. Record saves …","Discount 20.00 / 20.01","Apex","BR-04;sf-apex"
```
Quote every field; multi-line steps and expected results stay inside quotes, numbered to match.
Xray/Zephyr/TestRail importers map `Steps` and `Expected Result` line by line when the numbering
matches.
