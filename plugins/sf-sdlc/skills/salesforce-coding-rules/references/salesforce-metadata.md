<!-- Generated from .claude/rules/salesforce-metadata.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# Metadata rules

Sources: Metadata API guide, Salesforce Architects guidance, and Salesforce's `platform-custom-object-generate`,
`platform-custom-field-generate`, `platform-validation-rule-generate`, `platform-permission-set-generate`,
`platform-metadata-deploy` and `platform-destructive-deploy` skills. Load the matching installed skill
before creating a component.

## Objects and fields
- Every object and field has a `<description>` giving the business reason; every field has
  `<inlineHelpText>` that adds something the label does not. Refresh the object description when its
  fields or rules change (propose the text; do not silently overwrite).
- API names from the label in `Pascal_Case__c`, no abbreviations, the project prefix when there is
  one, no reserved words (`Order__c`, `Group__c`).
- Org-wide defaults follow the security design: Private unless there is a recorded reason.
- Master-Detail: no `required`, `deleteConstraint` or `lookupFilter`; the child's `sharingModel` is
  `ControlledByParent`; at most two per object. Lookups state `deleteConstraint`. Roll-up summaries
  use `Child__c.Field__c`.
- `-meta.xml` API versions match `sourceApiVersion` in `sfdx-project.json`.

## Validation rules
- Error message of 255 characters or fewer, in plain language, with `errorDisplayField` on the field
  the user must fix; API name of 40 characters or fewer.
- `ISPICKVAL` for picklists, `ISCHANGED` / `ISNEW` for changes, a default in `CASE`; CDATA around
  formulas containing XML characters.
- A bypass, only when the design asks for one, is a custom permission (`$Permission.Bypass_…`), never
  a profile or user name.

## Access
- Access is granted with permission sets and permission set groups; profiles only for what cannot
  move (login hours and IP ranges, defaults). Do not edit profiles for object or field access.
- Every new field gets field-level security in a permission set in the same change — except required
  and Master-Detail fields (listing them fails the deployment) and formula fields (read-only).
- `ViewAllData`, `ModifyAllData`, `ManageUsers` and similar system permissions need a recorded
  security review.

## Configuration
- Configuration values in Custom Metadata Types (deployable, cacheable), not Custom Settings or
  hard-coded values; user-facing text in Custom Labels.
- No record IDs, user names or org URLs in metadata; reference by DeveloperName or Named Credential.

## Deployment
- Prefer one deployment so the Metadata API resolves dependencies. When splitting: objects and fields
  → custom metadata and labels → Apex → LWC, tabs and apps → permission sets → flows (as Draft,
  activated after verification) → layouts and Lightning pages. A permission set that references
  classes, tabs or apps fails if deployed before them.
- Non-production: `sf project deploy start --dry-run`, then deploy. Production: validate with tests
  (`sf project deploy validate`), then `sf project deploy quick` with the validated job ID; never
  `NoTestRun` and never `--ignore-errors`.
- Destructive changes: search for references first, use `destructiveChangesPre.xml` /
  `destructiveChangesPost.xml`, validate first, and get an explicit yes per component; no
  `--purge-on-delete` unless asked.
