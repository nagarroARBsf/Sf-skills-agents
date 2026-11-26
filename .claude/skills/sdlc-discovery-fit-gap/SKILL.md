---
name: sdlc-discovery-fit-gap
description: "Discovery and design for EXISTING Salesforce orgs: a read-only, dated snapshot of one or more orgs (data model, automation, code, access and sharing, integrations, packages, licences, limits, recent setup changes); every statement in the discovery pack (workshop notes, call transcripts, current-state documents) checked against the org as confirmed, partly holds, contradicted, stale or not verifiable, with evidence; an org-to-org comparison with keep/merge/retire decisions for a merge or harmonization; then a current-state assessment, a fit-gap analysis (fit to standard first, declarative before code) and a draft HLD the solution architect continues. TRIGGER when: user asks for discovery or its validation on an existing org, an org assessment, current-state analysis, fit-gap or gap analysis, an org merge, consolidation or harmonization, or runs /sdlc-discovery. DO NOT TRIGGER when: there is no existing org (use sdlc-brd-generate and sdlc-architecture-diagram), or the user wants LLDs, diagrams only or code."
metadata:
  version: "3.1"
  author: "Nagarro Salesforce CoE"
---

# sdlc-discovery-fit-gap

Discovery on an existing org is mostly **checking**: the discovery pack says how the org works, the
org says how it really works, and the two rarely match. This skill turns that check into evidence,
then into a fit-gap and a first HLD — so design starts from what is true, not from what was said.

It follows Salesforce's own guidance for AI-assisted org discovery: deterministic extraction first
(the `sf-sdlc discover` snapshot), reasoning over the extracted files second, a human pause after each
phase, and an honest line wherever metadata cannot answer the question ("metadata shows what exists,
not why").

## When this applies
- **Brownfield only.** At least one existing org. With no org, say so and route to `/sdlc-brd` and
  `/sdlc-architecture`.
- **One org**: validate the discovery pack, assess the current state, fit-gap against the new
  requirements.
- **Two or more orgs** (merge, consolidation, harmonization — for example a business unit moving
  onto a group's org and process): everything above for each org, plus the org comparison. Name the
  **target** org (the one that survives) and the **source** org(s); the fit-gap is written against
  the target.

## Inputs
- Orgs: the aliases the person gives, else `discovery.orgs` from the config
  (`node .claude/bin/sf-sdlc config show --json`), else ask. Roles (`uat`) resolve through `orgs.*`.
- Discovery pack: the folder the person gives, else `docs/sdlc/00-inputs/discovery/` (under
  `paths.docs`). Anything: workshop notes, call transcripts, current-state decks exported to text or
  PDF, process maps, spreadsheets, previous assessments, emails. Never edited.
- When present: `docs/sdlc/01-brd/BRD.md` and `02-backlog/backlog.md` (the requirements the fit-gap
  is measured against), `00-grounding/ontology.yaml` and `feature-map.md`,
  `03-architecture/baseline/inventory.md`, the local source (`node .claude/bin/sf-sdlc inventory --json`).
- Project templates: the team's copies under `paths.templates`/`discovery/` win over the kit's
  (`node .claude/bin/sf-sdlc templates list`).

## Outputs (under `docs/sdlc/`, all drafts for review)
| File | Template | What it holds |
|---|---|---|
| `00-discovery/snapshots/<alias>-<YYYYMMDD>/` | written by `sf-sdlc discover snapshot` | raw query results + `manifest.json` (org ID, org kind, time, which queries ran) |
| `00-discovery/claim-register.md` | [claim-register-template.md](references/claim-register-template.md) | every statement in the pack (`CLM-nnn`) with a verdict and evidence |
| `00-discovery/org-comparison.md` | [org-comparison-template.md](references/org-comparison-template.md) | two or more orgs only: differences and a decision per component |
| `00-discovery/current-state.md` | [current-state-template.md](references/current-state-template.md) | the assessment by domain, findings with severity, what needs a person |
| `00-discovery/fit-gap.md` | [fit-gap-template.md](references/fit-gap-template.md) | `FG-nnn` per requirement or capability: classification, resolution, effort, risk |
| `03-architecture/HLD.md` | `sdlc-architecture-diagram` [hld-template.md](../sdlc-architecture-diagram/references/design/hld-template.md) | draft target-state design (see phase 6 for when it is written) |
| `03-architecture/baseline/inventory.md` | `sdlc-architecture-diagram` baseline template | section 7 "Org-only components" filled from the snapshot |

IDs (`sdlc-workflow`): `CLM-nnn` claim, `FG-nnn` fit-gap item; sources keep the BRD's `SRC-nn`, open
questions are `Q-nn`. Never renumber after review.

---

## Phase 1 — Snapshot each org (deterministic)
1. Classify each org: `node .claude/bin/sf-sdlc org classify <alias>`. Reading production is allowed —
   discovery of an existing org usually means production — and every query here is read-only. Say in
   the report which org kinds were read.
2. `node .claude/bin/sf-sdlc discover snapshot --org <alias>` per org (or once with no `--org` to take
   every org in `discovery.orgs`). Reuse a snapshot from today unless the person asks for a fresh one.
3. `node .claude/bin/sf-sdlc discover summary <snapshot> --json`: counts per domain and **findings**
   (multiple triggers per object, non-bulk triggers, active Process Builder and Workflow Rules,
   public read/write custom objects, profile-centric access, limits above 80%, stale reports…).
   Findings are leads with evidence; confirm each before it reaches a document.
4. Queries that could not run are listed in `manifest.json`. A missing permission is a finding about
   the discovery user, not a reason to guess: record it as "not verifiable" and say which permission
   would close it (see [discovery-dimensions.md](references/discovery-dimensions.md), "Discovery user").
5. Go deeper only where a claim or finding needs it, with the read-only follow-ups in
   [discovery-dimensions.md](references/discovery-dimensions.md): the `sf-sobject-reads` MCP server or
   `sf sobject describe` for fields and picklists, Metadata Grounding (`search_metadata`,
   `describe_metadata`) when connected, Tooling queries such as `MetadataComponentDependency` for
   "where is this used". Save anything you rely on next to the snapshot
   (`<snapshot>/extra-<name>.json`) so the evidence can be re-read.

**Stop and report** when the person asked for the snapshot only.

## Phase 2 — Read the discovery pack and register the claims
1. Read every file in full; register each as a source (`SRC-nn`, same scheme as the BRD).
2. Extract every **checkable statement** about the current org or process into the claim register:
   "Cases are routed by queue per market", "Market users cannot see other markets' accounts", "We use
   Conga for letters", "There are about 40 profiles", "The web form creates a Lead". One fact per
   claim. Opinions, goals and future-state wishes are not claims: they are requirements (phase 5).
3. Note who said it and where (`SRC-03, 00:14:20` or `SRC-05 §3.2`). No personal data beyond a role.

## Phase 3 — Validate each claim against the org
Give every claim exactly one verdict:

| Verdict | Use when | Evidence required |
|---|---|---|
| **Confirmed** | the org shows it | snapshot file + API names, or MCP tool + query |
| **Partly holds** | true for some objects, markets, record types or users only | what holds and what does not |
| **Contradicted** | the org shows otherwise | the contradicting evidence |
| **Stale** | it was true but setup changed (SetupAuditTrail, inactive component, superseded flow version) | the change and its date |
| **Not verifiable from metadata** | the answer is in people's heads, in data, in another system, or needs a permission the snapshot lacked | a `Q-nn` naming who can answer |

Rules:
- **Evidence or no verdict.** Never mark a claim Confirmed from the document alone.
- **Absence is weak evidence.** "Not found in the snapshot" supports Contradicted only for a type the
  snapshot covers completely and whose query ran; Metadata Grounding "can show that something exists,
  never that it does not". Otherwise use Not verifiable.
- Behaviour claims ("the flow sends an email when…") need the component read (flow metadata, Apex
  source), not just its name. If it was not read, say "component exists; behaviour not verified".
- Managed-package components are counted and named, never remediated or redesigned.
- **Stop and report** after the register: contradicted and stale claims change the scope.

## Phase 4 — Compare orgs (two or more orgs)
1. `node .claude/bin/sf-sdlc discover compare <target-snapshot> <source-snapshot> --json`.
2. Write the org comparison from the template: per type, what exists only in one org, what is the same
   and what differs, then a **decision** per component or group — Keep target, Bring from source,
   Merge, Retire, Decide (with a `Q-nn` and an owner).
3. Flag the conflicts a merge always hits ([discovery-dimensions.md](references/discovery-dimensions.md),
   "Org merge checklist"): same API name with different meaning, picklist values to map, record types
   and business processes, more than one automation on the same object and event, org-wide defaults
   and role hierarchy, profiles to collapse into permission set groups (one per persona), integrations
   pointed at the source org, packages in one org only, licence types, data volumes and limits on the
   target.
4. A "no source-only processes" goal (the source org adopts the target's process) turns most
   differences into **Gap — process change**, not into new metadata. Say so explicitly.

## Phase 5 — Fit-gap
1. Requirements to measure: the approved BRD and backlog when they exist; otherwise the future-state
   statements and goals from the discovery pack (each with its `SRC-nn`), and, for a merge, every
   capability the source org has that the business still needs.
2. **Fit to standard first**: for each requirement ask what the target org already does (Confirmed
   claims and the snapshot), then what standard Salesforce does, before anything custom.
3. Classify each item (`FG-nnn`) with exactly one of:

| Classification | Meaning |
|---|---|
| **Fit — as is** | the target org already does it; evidence cited |
| **Fit — configuration** | standard feature, needs setup only (fields, layouts, record types, sharing, permission sets, flows built in Setup) |
| **Gap — customisation** | needs Apex, LWC, an integration or an AppExchange product; say why declarative is not enough |
| **Gap — process change** | the business adapts to the platform or to the target org's process; needs a business owner's decision |
| **Out of scope** | not delivered in this programme; say where it goes |

4. Each item carries: the requirement or claim it comes from, current-state evidence, the proposed
   resolution (declarative first; the decision guides in `sdlc-architecture-diagram`), effort (S, M,
   L, XL), risk, dependencies, a decision owner and a confidence (High when every fact is evidenced,
   Medium when one is inferred, Low when it rests on Not verifiable claims).
5. Check feasibility with the `sdlc-workflow` feasibility checklist; a hit becomes a risk on the item.

## Phase 6 — Current state and HLD
1. Write `current-state.md`: per domain (data model, automation, code, security and access,
   integrations, packages and licences, limits and volumes, adoption), what exists, the findings that
   held up (severity High / Medium / Low, Well-Architected pillar), and the list of questions only a
   person can answer.
2. Fill section 7 of `03-architecture/baseline/inventory.md` ("Org-only components") from the
   snapshot. Create the file from the baseline template if it does not exist; never remove what the
   architect wrote.
3. HLD (`03-architecture/HLD.md`, `sdlc-architecture-diagram` HLD template and Part A rules):
   - **No HLD yet, or an HLD still in Draft**: write or update it. Drivers from the fit-gap; the target
     org's current landscape as Unchanged components; every Fit — configuration and Gap —
     customisation item as New or Changed components; Retire decisions as Removed. Every component's
     status comes from the snapshot — never Unchanged without having found it. Draw the system
     landscape and, for a merge, the target landscape with the source org's integrations re-pointed,
     following Part B of `sdlc-architecture-diagram`.
   - **An HLD with an approval record filled in**: do not edit it. List the changes the discovery
     implies at the end of `fit-gap.md` under "Proposed HLD changes" for the architect.
   - Leave LLDs, ADR decisions and story-level design to `/sdlc-architecture`; list the ADRs needed.
4. Each document carries the approval record from `sdlc-workflow`, unfilled, status `Draft for review`.

## Report (end of every run)
- Orgs read (alias, org kind, snapshot folder, queries not available).
- Claims: count per verdict; every Contradicted and Stale claim in one line each.
- Merge: the top conflicts and the decisions waiting for an owner.
- Fit-gap: count per classification; the Gap — customisation items with effort; the process-change
  decisions the business must take.
- HLD: written, updated, or changes proposed (approved HLD).
- Questions only a person can answer, grouped by who.
- Next steps: review and sign off; `/sdlc-brd` with `00-discovery/current-state.md` and `fit-gap.md`
  as inputs when there is no BRD yet; `/sdlc-architecture` to continue the HLD and write LLDs.

## Guardrails
- Read-only, always: no deploy, no retrieve into the source tree, no data change, no anonymous Apex,
  MCP read tools only (Headless 360 `dispatch_readonly`, never `dispatch`).
- No personal data in any document: counts and roles, never user names, e-mail addresses or record
  contents. Record counts come from `sf org list sobject record-counts`, not from querying records.
- Never read `.env`, `.sf/`, `.sfdx/` or the browser profile; never print an access token.
- Drafts only. Only a person fills in an approval record; never start the next stage unasked.
