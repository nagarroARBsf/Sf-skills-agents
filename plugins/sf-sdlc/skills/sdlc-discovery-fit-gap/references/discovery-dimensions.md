# Discovery dimensions, follow-up queries and the org merge checklist

What to look at per domain, where the evidence comes from, and which Well-Architected pillar a finding
belongs to. The snapshot (`sf-sdlc discover snapshot`) covers the first column; the
follow-ups are read-only and run only when a claim or finding needs them.

## Domains

| Domain | Snapshot file(s) | Questions to answer | Follow-up (read-only) | Pillar |
|---|---|---|---|---|
| Data model | `objects`, `customFields`, `recordTypes`, `recordCounts` | Which objects carry the business? Custom objects duplicating standard ones? Field sprawl? Overloaded fields? Volumes and large-data-volume risk? | `sf sobject describe --sobject <Api> -o <org>` or the `sf-sobject-reads` MCP server (fields, types, picklists); Tooling `FieldDefinition WHERE EntityDefinition.QualifiedApiName = '<Api>'` | Easy, Adaptable |
| Automation | `flows`, `workflowRules`, `validationRules`, `apexTriggers` | How many automations per object and event? Legacy Process Builder or Workflow still running? Trigger stacking? Conflicting field updates? | Flow metadata through Metadata Grounding `describe_metadata`, or `sf project retrieve start -m Flow:<Name> --target-metadata-dir <tmp>` into a temporary folder outside the source tree | Adaptable |
| Code | `apexClasses`, `apexTriggers`, `lwc`, `aura` | Trigger framework? Bulk-safe? Old API versions? Invalid classes? Size of the code estate? | Local source when the repo matches the org; Code Analyzer (`sf-sdlc analyze <paths>`) on retrieved code | Trusted, Adaptable |
| Security and access | `profiles`, `permissionSets`, `permissionSetGroups`, `roles`, `queues`, `organization` (org-wide defaults), `objects` (sharing model) | Profile-centric or permission-set-led? Personas? Org-wide defaults and role hierarchy depth? Public read/write objects? | Tooling `SecurityHealthCheck` and `SecurityHealthCheckRisks` (Health Check score); `ObjectPermissions` / `FieldPermissions` for one permission set | Trusted |
| Integrations | `namedCredentials`, `remoteSites`, `connectedApps` | Which systems talk to the org, which way, how authenticated? Hard-coded endpoints? | Apex classes calling out (`describe_metadata`), Platform Events and CDC in `objects` (`__e`, `ChangeEvent`), outbound messages in Setup | Trusted, Adaptable |
| Packages and licences | `packages`, `userLicenses`, `permissionSetLicenses`, `activeUsersByLicence` | Which AppExchange products? Licence mix and headroom? | Package documentation; never redesign managed components | Easy |
| Limits and volumes | `limits`, `recordCounts` | Storage, API calls, custom object and field limits near the ceiling? | `sf org list limits -o <org>` again on the day of the decision | Adaptable |
| Experience and channels | `networks` | Customer or partner sites? Guest access? | Site and guest-user settings in Setup | Trusted |
| Adoption and change | `reports`, `reportsNotRunInAYear`, `dashboards`, `setupAuditTrail` | Is it used? What changed recently, where? | Event Monitoring or Shield, when the org has them; otherwise say usage is not visible | Easy |

## Evidence rules
- Cite as `<snapshot>/<file>.json: <ApiName>` or `MCP <server>.<tool>: <query>` or `sf <command>`.
- Record the snapshot time; an org changes after it. A claim checked against a snapshot older than the
  latest SetupAuditTrail entry for that area is re-checked or marked Stale-risk.
- Metadata shows what exists, not why. Rationale ("we did this because the ERP…") is Not verifiable
  until a person confirms it.
- Unmanaged versus managed: components with a `NamespacePrefix` belong to a package unless the
  namespace is the org's own (`organization.json: NamespacePrefix`).

## Discovery user
The snapshot runs as the signed-in CLI user. For complete results that user needs **View Setup and
Configuration**. It does not need **View All Data**, because nothing queries records, and it needs
**Modify Metadata** only for `sf org list metadata`, which the snapshot avoids on purpose. Missing objects
in `manifest.json` (for example `SetupAuditTrail` or `InstalledSubscriberPackage`) usually mean a
missing permission or edition; ask the org owner rather than widening access yourself.

## Org merge checklist (two orgs into one)
Compare and decide for each:
1. **Objects and fields** — same API name, same meaning? Same field type and length? Custom objects in
   the source that duplicate a standard object in the target.
2. **Picklists** — values to map one-to-one, to merge, to retire; global value sets.
3. **Record types and business processes** — one per market or brand, or one shared?
4. **Automation on the same object and event** — the target's and the source's must become one
   ordered design; no two triggers on one object.
5. **Sharing** — org-wide defaults, role hierarchy (for example region → market → team), sharing rules,
   teams, territory management; a segment boundary that must keep groups of users apart.
6. **Access** — collapse profiles into a small set plus permission set groups, one per persona; field
   protection (Shield, masking in sandboxes, SSO).
7. **Integrations** — each source-org integration re-pointed, retired or rebuilt; middleware routes.
8. **Packages** — present in one org only; licences and data they hold.
9. **Templates and documents** — e-mail templates, letters (for example S-Docs or Conga), web forms.
10. **Data** — volumes per object, duplicates across orgs, ID mapping, data that must not move
    (retention, GDPR, DPIA).
11. **Limits on the target** — fields per object, custom objects, storage, API calls after the merge.
12. **Users** — users in both orgs, licence types, SSO.
13. **Reports and dashboards** — easy to forget because usage is hard to see.
Deployment order that works for merges: data structure → code → presentation → security → data.
