# Deployment troubleshooting

Read the job result (`sf-sdlc deploy report --org <role> --json`, or
`sf project deploy report --job-id <id> --target-org <alias>`) and match each error. Report the
component, the error text, the likely cause and the fix. Fixes to source go back to the
developer; the deployment agent does not edit code or weaken the test level to get a pass.

## Component errors

| Error text (typical) | Likely cause | Fix |
|---|---|---|
| `In field: field - no CustomField named X__c found` / `no CustomObject named …` | A dependency is not in the deployment and not in the target (common with deltas) | Add the missing component to the manifest; check deployment order; consider a full deployment |
| `Entity of type 'X' named 'Y' cannot be found` | Component referenced by a layout, FlexiPage, permission set or flow does not exist in the target | Deploy the referenced component, or remove the stale reference |
| `Variable does not exist` / `Invalid type` / `Method does not exist or incorrect signature` | Apex compiled against a class, field or method that is missing or different in the target; a dependent class not included | Include the dependency; check that a signature change deployed together with all its callers |
| `Dependent class is invalid and needs recompilation` | Another class in the org references something this deployment changes | Include and fix the dependent class; run a full compile through `RunLocalTests` validation |
| `In field: recordType - no RecordType named …`, `no ApexClass named …` inside a **profile or permission set** | Profile or permission set references a component absent from the target | Remove the reference, or deploy the component first. Prefer permission sets scoped to the change; avoid deploying full profiles |
| `Unknown user permission: X` | Permission exists in the source org's edition or licence but not in the target | Remove the permission from the metadata; check licences and features of the target |
| `Not available for deploy for this organization` / `… is not enabled` | A feature or setting is off in the target | Enable it as a pre-deployment step, then validate again |
| `Cannot change field type` / `Cannot change … to …` | Unsupported field type conversion | Plan as delete-and-recreate with data migration (destructive change), or a new field |
| `This custom field is referenced elsewhere` / `cannot delete … in use by …` | Destructive change blocked by a reference (layout, flow, Apex, report type, formula) | Remove the references in the same deployment; delete in a post-destructive manifest |
| `duplicate value found: … duplicates value on record with id` | Component with the same developer name or label rule already exists (often created by hand in the org) | Retrieve the org's version and reconcile; rename or adopt it |
| `Picklist value: X in use` / inactive value errors | Removing or changing picklist values used by records, record types or flows | Deactivate instead of delete, or migrate data first |
| `The version of the flow you're updating is active and can't be overwritten` | Deploying a flow as a change to its active version in a setting that forbids it | Deploy as a new version; check the org's "Deploy processes and flows as active" setting and activate as a post-deployment step |
| `field integrity exception` / `invalid cross reference id` | Metadata contains an ID, user name or email address from another org | Remove org-specific values; use named references |
| `No such column 'X' on entity 'Y'` in a flow or report | Field missing in the target, or the deploying user lacks access to it | Deploy the field and its FLS first |
| `apiVersion … is not valid` / unsupported property errors | Component API version or `sourceApiVersion` is newer than the target org's release (preview sandbox versus production) | Align `salesforce.apiVersion` with the lowest org in the pipeline; redeploy |
| `LWC1xxx` compile errors / `Invalid reference` in a component bundle | Component refers to an Apex method, label, field or module that is missing in the target | Deploy the dependency in the same job |
| `Value too long` / `Required field is missing` in Custom Metadata records | Record does not match the type definition in the target | Deploy the type's field changes with the records |
| `Cannot deploy to a namespace` / namespace mismatch | Source assumes a namespace the target does not have | Check `salesforce.namespacePrefix` and `sfdx-project.json` |

## Test failures and coverage

| Error text (typical) | Likely cause | Fix |
|---|---|---|
| `Average test coverage across all Apex Classes and Triggers is X%, at least 75% test coverage is required` | Org-wide coverage below the platform minimum with `RunLocalTests` | Add tests for uncovered classes; find failing tests that no longer contribute coverage |
| `Code coverage issue … Test coverage of selected Apex Class/Trigger is X%, at least 75% test coverage is required` | `RunSpecifiedTests`: a class or trigger in the deployment is not covered enough by the named tests | Name the tests that cover it, or use `RunLocalTests` |
| `Test coverage of selected Apex Trigger is 0%` | No test fires the trigger | Add a test that performs the DML |
| `System.AssertException` in an existing test | The change broke behaviour the test protects, or the test depends on org data or configuration | Triage as product or test defect (see the `sdlc-test-execution` skill); do not skip the test |
| `FIELD_CUSTOM_VALIDATION_EXCEPTION` in tests | A validation rule in the target (possibly not in source) rejects test data | Fix the test data factory; retrieve the rule into source if it is org-only |
| `REQUIRED_FIELD_MISSING` in tests | A field is required in the target but not set by the test data | Update the factory; check for org-only required fields |
| `UNABLE_TO_LOCK_ROW` | Parallel test execution or a running job locking shared records | Re-run; disable parallel Apex testing in the sandbox if it persists; fix tests that share parent records |
| `MIXED_DML_OPERATION` | Setup and non-setup DML in one transaction | Separate with `System.runAs` in tests; asynchronous split in code |
| `System.LimitException: Too many SOQL queries: 101` | Non-bulkified code, or combined automation in the target that the developer org lacked | Bulkify; inspect other automation on the object in the target |
| `Apex CPU time limit exceeded` in tests | Heavy automation combined in the target org | Profile; reduce test data volume only if the test is not a bulk test |
| Tests pass in development, fail in the target | Org differences: data, sharing, record types, validation rules, installed packages, running user | Compare with the baseline inventory; make tests create their own data |
| `Too many async jobs enqueued` / flex queue errors | Queueable or batch chaining in test context | Guard chaining in tests (`Test.isRunningTest()` at the chaining point only) |

## Job-level problems

| Symptom | Likely cause | Fix |
|---|---|---|
| Quick deploy rejected: validation not found or expired | More than ten days since validation, or another deployment reached the org since | Validate again |
| `INVALID_SESSION_ID` / `expired access/refresh token` | CLI authorisation for the alias expired | The user re-authorises the org (`sf org login web --alias <alias>`); never handle credentials yourself |
| Wait time elapsed, job still running | Long test run | `sf project deploy resume --job-id <id>` or `report`; do not start a second job |
| `There is already a deployment in progress` | Another deployment or validation is queued for the org | Wait for it or coordinate with its owner; do not cancel someone else's job |
| Deployment succeeded but the feature does not work | Missing post-deployment step: permission set assignment, flow activation, scheduled job, custom metadata or setting record, Named Credential secret | Complete the manual steps in the deployment record |
| Deployment succeeded but components are missing | The manifest or delta did not include them | Compare the manifest with the plan's Metadata Scope; redeploy the gap |
| Guard hook denied or asked on the command | Target classified as production or unknown, or no recorded validation | Stop. Report it to the user; do not rephrase the command |
| Source tracking conflicts on a scratch org or sandbox with tracking | Org changed outside source | Retrieve and reconcile first; do not use `--ignore-conflicts` on a shared org without the user's decision |

## What not to do
- Do not lower the test level, remove failing tests from the run, or mark tests `@IsTest(SeeAllData=true)` to get a pass.
- Do not deploy profiles wholesale to fix an access error.
- Do not use `--ignore-errors` or `--ignore-warnings` on a shared org or production without the
  user's explicit decision recorded in the deployment record.
- Do not retry the same failing validation unchanged.
