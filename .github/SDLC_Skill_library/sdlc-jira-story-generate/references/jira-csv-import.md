# Jira CSV import format

Write `jira-import.csv` with these columns, in this order:

```csv
Issue Id,Parent Id,Issue Type,Summary,Description,Acceptance Criteria,Priority,Story Points,Labels,Labels,Labels,Component,Blocked By
```

| Column | Content | Jira mapping |
|---|---|---|
| Issue Id | Row number (1, 2, 3 …), unique within the file | *Issue Id* (used to link parents in the same import) |
| Parent Id | Issue Id of the epic row for stories; empty for epics | *Parent Id* (team-managed and company-managed projects on Jira Cloud) |
| Issue Type | `Epic`, `Story`, `Task` | Issue Type |
| Summary | `US-04-02 Calculate and store the health score` (keep the trace ID as prefix) | Summary |
| Description | User story + context + feasibility notes, Jira wiki text or plain text | Description |
| Acceptance Criteria | `AC-1 … AC-n` | A custom field if the project has one; otherwise map to Description (append) |
| Priority | `Highest`, `High`, `Medium`, `Low` | Priority |
| Story Points | number | Story Points / Story point estimate |
| Labels (repeat column) | one label per column, e.g. `sf-apex`, `BR-04` | Labels |
| Component | Optional | Component/s |
| Blocked By | Summary prefixes (`US-03-02`) — link after import | Not imported directly; create links afterwards or via MCP |

MoSCoW to Jira priority: Must → High, Should → Medium, Could → Low (unless the client maps
differently).

## Rules for a CSV that imports first time
- UTF-8, comma separator, one header row.
- Quote every field with `"`; escape inner quotes by doubling them (`""`).
- Line breaks inside a quoted field are allowed; never outside quotes.
- Epics rows come before their stories.
- Add the BR ID as a label (`BR-04`) so filters work even if Parent Id mapping fails.

## Example

```csv
Issue Id,Parent Id,Issue Type,Summary,Description,Acceptance Criteria,Priority,Story Points,Labels,Labels,Labels,Component,Blocked By
"1","","Epic","EPIC-04 Orion - Opportunity Intelligence","Objective view of deal health and risks. Source: BR-04.","","High","","BR-04","","","Opportunity",""
"2","1","Story","US-04-02 Calculate and store the health score","As a Sales Manager, I want each open opportunity to carry a health score…","AC-1 Given … When … Then the health score is 100
AC-2 …","High","5","sf-apex","BR-04","opportunity","Opportunity","US-03-02"
```
