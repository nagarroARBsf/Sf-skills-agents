# Release notes — {Project} {version}

Save as `docs/sdlc/05-release/REL-{version}/release-notes.md`. Written for a mixed audience:
sections 1-4 are for business users, sponsors and support, in plain language with no API names;
sections 5-8 are for administrators and engineers. Content comes from the stories, test runs
and deployment records of this release, not from commit messages alone.

Do not include customer data, credentials, org IDs, internal hostnames or the names of
individuals other than the release contacts.

| Item | Details |
|---|---|
| Release | REL-{version} |
| Release date | {YYYY-MM-DD} ({planned / deployed}) |
| Audience | {who is affected: roles, regions, teams} |
| Contacts | Release owner {name}; support {channel} |
| Status | Draft for review |

## 1. Highlights
Three to five bullets. Each one says who benefits and what they can now do.

- **Sales managers** see a health score on every open deal, with the reasons a deal is at risk.

## 2. What is new
One short block per user-visible feature.

### {Feature name in business words}
- **Who**: {persona}
- **What changes**: {what they see or can do, where}
- **Why**: {the benefit, tied to the business objective}
- **What you need to do**: {nothing / first-use step / new permission requested through …}

## 3. What has changed
Existing behaviour that works differently. State before and after.

| Area | Before | Now | Who is affected |
|---|---|---|---|
| Deal review | Stagnant deals were found manually | Deals with no stage change for 30 days are flagged | Sales managers |

## 4. What has been removed or retired
| Item | Replaced by | What to do |
|---|---|---|

## 5. Fixed issues
| Reference | Summary (user-visible effect) |
|---|---|
| DEF-003 / {Jira key} | A discount of exactly 20% no longer lowers the health score. |

## 6. Known issues and limitations
Open defects accepted for this release and limits users will notice. Each with a workaround.

| Reference | Issue | Workaround | Planned fix |
|---|---|---|---|

## 7. Actions required
| Who | Action | By when |
|---|---|---|
| Sales operations | Review the at-risk dashboard filters | First week |
| Administrators | See section 8.3 | At deployment |

## 8. Technical details

### 8.1 Stories delivered
| Story | Title | Jira key | Requirement |
|---|---|---|---|
| US-04-02 | Calculate and store the health score | {key} | BR-04 / FR-04.2 |

### 8.2 Components
Summary by status (full list in the deployment record).

| Type | New | Changed | Removed |
|---|---|---|---|
| ApexClass | | | |
| LightningComponentBundle | | | |
| CustomField | | | |
| Flow | | | |
| PermissionSet | | | |

Notable components: {API names an administrator will want to recognise}.

### 8.3 Deployment and manual steps
| Item | Details |
|---|---|
| Deployment record | DEP-{nnn} (production), validation job `{id}` |
| Source | commit `{sha}`, tag `{tag}` |
| Pre-deployment steps | {list or none} |
| Post-deployment steps | {permission set assignments, flow activation, job scheduling, data loads} |
| Destructive changes | {components removed; data consequence} |
| Rollback | {summary; reference to DEP-{nnn} §4} |

### 8.4 Quality evidence
| Item | Value |
|---|---|
| Test runs | TR-{…} ({n} cases, {n} passed) |
| Apex tests at validation | {n} run, {n} failed |
| Coverage | changed classes lowest {n}%; org-wide {n}% |
| Open defects at release | Blocker {n}, Major {n}, Minor {n}, Trivial {n} |
| Readiness report | `docs/sdlc/05-release/REL-{version}/readiness.md` |

### 8.5 Access and security changes
New or changed permission sets, custom permissions, sharing settings and fields with restricted
visibility. State who gains or loses access.

## Approval record
| Status | Approver | Role | Date | Comment |
|---|---|---|---|---|
| Draft for review | — | — | — | — |

Filled in by a person only.
