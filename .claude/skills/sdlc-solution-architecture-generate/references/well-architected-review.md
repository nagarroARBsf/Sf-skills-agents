# Design review: Salesforce Well-Architected

Salesforce Well-Architected groups guidance under three capabilities: **Trusted**, **Easy** and
**Adaptable** (see architect.salesforce.com/well-architected). Review the HLD and each LLD against
the questions below and record trade-offs in HLD §13/§15.

## Trusted (secure, compliant, reliable)
- [ ] Least privilege: access through permission sets/groups; no feature granted by profile edits.
- [ ] Apex enforces sharing and CRUD/FLS (`with sharing`, `WITH USER_MODE`, `stripInaccessible`);
      every `without sharing` is justified in the LLD.
- [ ] No secrets, endpoints or IDs in code; Named/External Credentials; Custom Metadata for config.
- [ ] Sensitive data classified; encryption/masking/audit needs addressed.
- [ ] Every automation has a fault path; integration failures are logged and owned.
- [ ] Governor limits analysed for 200-record batches and for the largest expected volumes.
- [ ] No data skew; selective queries on large objects.

## Easy (intentional, automated, engaging)
- [ ] Standard features used where they meet the need (approach ladder).
- [ ] Each persona gets the fewest clicks for the main task; mobile considered.
- [ ] UI follows SLDS; accessible (labels, contrast, keyboard).
- [ ] Repetitive manual steps automated; manual post-deploy steps minimised and listed.

## Adaptable (resilient, composable)
- [ ] One trigger per object with a handler; logic in services reusable from flow (invocable), batch
      and UI.
- [ ] Business thresholds configurable (Custom Metadata).
- [ ] Clear module boundaries (package directories / naming prefixes).
- [ ] Changes deployable through the pipeline; destructive changes planned.
- [ ] Tests are deterministic (no `SeeAllData`, no hard-coded IDs/dates), so refactoring is safe.

## Governor limits quick reference (per synchronous transaction)
| Limit | Value |
|---|---|
| SOQL queries | 100 (200 async) |
| Records retrieved by SOQL | 50,000 |
| DML statements | 150 |
| Records processed by DML | 10,000 |
| CPU time | 10,000 ms (60,000 ms async) |
| Heap | 6 MB (12 MB async) |
| Callouts | 100; total timeout 120 s |
| Queueable jobs enqueued | 50 |
| Trigger batch size | 200 records |
