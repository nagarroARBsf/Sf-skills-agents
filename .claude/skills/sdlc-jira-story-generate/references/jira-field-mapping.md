# Jira field mapping and safe creation

Everything Jira-specific comes from the `jira` block of the project config
(`node .claude/bin/sf-sdlc config show --json`). Nothing in this file is a default to fall back
on: if a key is empty, ask, and have the user save the answer through `/sdlc-setup`.

## Config keys used

| Config key | Used for | If empty |
|---|---|---|
| `jira.enabled` | Whether Jira creation is offered at all | Treat as false: CSV only |
| `jira.site` | Shown in the preview so the user sees which Jira is written to | Ask |
| `jira.projectKey` | Target project for search and create | Ask; never infer from `project.code` |
| `jira.issueTypes.epic` / `.story` / `.bug` / `.task` | Exact issue type names in that project | Read the project's issue types through the tool and ask the user to choose |
| `jira.fields.storyPoints` | Field ID for the estimate (for example a `customfield_…` ID) | Omit the estimate from the payload; keep it in `backlog.md`; say so |
| `jira.fields.epicLink` | How a story points to its epic: the value `parent` for projects that use the parent field, or the Epic Link custom field ID | Ask; do not guess between the two |
| `jira.fields.acceptanceCriteria` | Field ID for acceptance criteria | Append the ACs to the description under a heading "Acceptance criteria" |
| `jira.labels` | Labels added to every created issue | None added |
| `jira.transitions.inProgress` / `.inReview` / `.readyForQa` / `.done` | Transition names used later by the build, review, QA and release stages | Those stages report the status change instead of making it |

This skill creates issues; it never transitions them. The transition names are listed here so
that the other stages read them from the same place.

## Issue payload

| Backlog item | Jira field | Value |
|---|---|---|
| Epic | Issue type | `jira.issueTypes.epic` |
| | Summary | `EPIC-04 {project.name} - Opportunity Intelligence` (trace ID is the prefix) |
| | Description | Goal, success measure, source BR, scope |
| | Labels | `EPIC-04`, `BR-04`, plus `jira.labels` |
| Story | Issue type | `jira.issueTypes.story` (enablers: `jira.issueTypes.task` when the project has no story-typed enablers) |
| | Summary | `US-04-02 Calculate and store the health score` |
| | Description | User story, context and rules, feasibility notes, out of scope, source IDs |
| | Acceptance criteria | Field `jira.fields.acceptanceCriteria`, or appended to the description |
| | Estimate | Field `jira.fields.storyPoints` |
| | Parent | Per `jira.fields.epicLink`: the epic's key |
| | Priority | Must → High, Should → Medium, Could → Low, unless the client maps differently |
| | Labels | `US-04-02`, `BR-04`, the Salesforce story-type labels, plus `jira.labels` |
| Dependency | Issue link | "is blocked by", created after both issues exist |

Trace labels (`EPIC-04`, `US-04-02`, `BR-04`) are mandatory: they are how later stages and later
runs find the issue. Jira labels cannot contain spaces.

## Idempotency: search before create

For each item, run both searches in the target project and merge the results:

```text
project = "<jira.projectKey>" AND labels = "US-04-02"
project = "<jira.projectKey>" AND summary ~ "\"US-04-02\""
```

| Result | Classification | Action |
|---|---|---|
| No issue found, and `backlog.md` has no Jira key for the item | `Create` | Include in the preview |
| `backlog.md` already has a key and the issue exists | `Exists` | Skip |
| One issue found, `backlog.md` has no key | `Exists` | Skip creation; write the key into `backlog.md`; list it in the report |
| One issue found whose summary or ACs differ from the backlog | `Exists (differs)` | Skip; list the differences for the user |
| More than one issue found | `Conflict` | Skip; show the keys; the user decides |
| `backlog.md` has a key but the issue is not found (deleted, moved, no permission) | `Conflict` | Skip; ask |

Summary search is a text match and can return near misses (`US-04-02` inside another summary).
Confirm a match by checking that the summary starts with the ID.

Run the search again immediately before each batch is created; another person may have created
issues since the preview.

## Preview

Show, before asking:

```text
Jira site:    <jira.site>
Project:      <jira.projectKey>
To create:    4 epics, 17 stories, 12 "is blocked by" links
Already exist (skipped): US-03-01 (KEY-101), US-03-02 (KEY-102)
Conflicts (skipped, need your decision): US-04-05 — 2 matches (KEY-140, KEY-152)

First epic, exactly as it will be sent:
  type: <jira.issueTypes.epic>
  summary: EPIC-04 …
  labels: EPIC-04, BR-04, …
  description: …

First two stories, exactly as they will be sent: …

All summaries to be created:
  EPIC-04 …
  US-04-01 …
```

Then ask exactly one question: `Create 21 issues and 12 links in <projectKey> on <site>? (yes/no)`.

Only a clear "yes" (or an equivalent single-word affirmation) given in reply to this question
counts. If the user changes anything after the preview (scope, wording, project), rebuild the
preview and ask again.

## Creation order and recovery

1. Epics. Record each key in `backlog.md` as soon as it is returned.
2. Stories, in dependency order, each with its parent. Record each key.
3. Issue links.
4. On an error: stop, report what was created (keys), what was not, and the error text. Do not
   retry blindly; a retry starts again from the search step, which makes it safe.
5. Never delete issues to "clean up" a partial run. Tell the user which keys exist.

## Other issue types created by later stages

Defects (`DEF-nnn`) use `jira.issueTypes.bug`, the summary prefix `DEF-nnn`, the labels
`DEF-nnn` and the story's `US-nn-mm`, and the same search, preview and explicit-yes protocol.
See the `sdlc-test-execution` skill.
