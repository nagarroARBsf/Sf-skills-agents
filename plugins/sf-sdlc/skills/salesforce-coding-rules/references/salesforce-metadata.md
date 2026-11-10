<!-- Generated from .claude/rules/salesforce-metadata.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# Metadata rules

- Use the matching generator skill: `platform-custom-object-generate`,
  `platform-custom-field-generate`, `platform-validation-rule-generate`,
  `platform-permission-set-generate`, `automation-flow-generate`, `platform-flexipage-generate`.
- Every new field: description and help text; FLS granted through a permission set (not profiles)
  in the same change.
- API names: `Pascal_Case__c`, no abbreviations; follow any project prefix.
- Validation rules always block the save; include the exact user-facing error message and the
  error location. Provide a bypass (custom permission) only when the design requires it.
- Flows: one record-triggered flow per object/event where practical; before-save for same-record
  updates; every DML/action element has a fault path; entry criteria as narrow as possible; no
  hard-coded IDs (use Custom Metadata or Get Records by DeveloperName).
- Do not edit profiles for access; permission sets and permission set groups only.
- Keep `-meta.xml` API versions consistent with `sfdx-project.json`.
- Deploy order: objects/fields → custom metadata/labels → permission sets → Apex → triggers →
  flows → LWC → pages/layouts. Validate with `sf project deploy start --dry-run` first.
