# Jira CSV import format

The CSV is the fallback when no Jira tool is connected or the user declines direct creation.
Issue type names, labels and the project key come from the `jira` block of the project config
(see [jira-field-mapping.md](jira-field-mapping.md)); the values below are placeholders.

Write `jira-import.csv` with these columns, in this order:

```csv
Issue Id,Parent Id,Issue Type,Summary,Description,Acceptance Criteria,Priority,Story Points,Labels,Labels,Labels,Component,Blocked By
```

| Column | Content | Jira mapping |
|---|---|---|
| Issue Id | Row number (1, 2, 3 …), unique within the file | *Issue Id* (used to link parents in the same import) |
| Parent Id | Issue Id of the epic row for stories; empty for epics | *Parent Id* (team-managed and company-managed projects on Jira Cloud) |
| Issue Type | The names in `jira.issueTypes.epic`, `.story`, `.task` (commonly `Epic`, `Story`, `Task`) | Issue Type |
| Summary | `US-04-02 Calculate and store the health score` (keep the trace ID as prefix) | Summary |
| Description | User story + context + feasibility notes, Jira wiki text or plain text | Description |
| Acceptance Criteria | `AC-1 … AC-n` | The field in `jira.fields.acceptanceCriteria`; if that key is empty, map to Description (append) |
| Priority | `Highest`, `High`, `Medium`, `Low` | Priority |
| Story Points | number | The field in `jira.fields.storyPoints` |
| Labels (repeat column) | one label per column: the trace ID (`US-04-02`), the BR (`BR-04`), story-type labels, then each entry of `jira.labels`. Add more `Labels` columns as needed | Labels |
| Component | Optional | Component/s |
| Blocked By | Summary prefixes (`US-03-02`) — link after import | Not imported directly; create links afterwards or through a connected Jira tool |

MoSCoW to Jira priority: Must → High, Should → Medium, Could → Low (unless the client maps
differently).

## Rules for a CSV that imports first time
- UTF-8, comma separator, one header row.
- Quote every field with `"`; escape inner quotes by doubling them (`""`).
- Line breaks inside a quoted field are allowed; never outside quotes.
- Epics rows come before their stories.
- Add the trace ID (`US-04-02`, `EPIC-04`) and the BR ID (`BR-04`) as labels so filters and the
  duplicate search work even if Parent Id mapping fails.
- Rows for items that already have a `Jira key` in `backlog.md` are left out of the file, so a
  second import cannot duplicate them.
- After the import, record the created keys in `backlog.md`.

## Example

```csv
Issue Id,Parent Id,Issue Type,Summary,Description,Acceptance Criteria,Priority,Story Points,Labels,Labels,Labels,Component,Blocked By
"1","","Epic","EPIC-04 {project.name} - Opportunity Intelligence","Objective view of deal health and risks. Source: BR-04.","","High","","EPIC-04","BR-04","","Opportunity",""
"2","1","Story","US-04-02 Calculate and store the health score","As a Sales Manager, I want each open opportunity to carry a health score…","AC-1 Given … When … Then the health score is 100
AC-2 …","High","5","US-04-02","BR-04","sf-apex","Opportunity","US-03-02"
```
