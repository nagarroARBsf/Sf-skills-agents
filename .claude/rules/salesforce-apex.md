---
description: Apex classes and triggers — security, bulkification, structure, error handling
paths:
  - "**/*.cls"
  - "**/*.trigger"
---

# Apex rules

## Structure
- One trigger per object, containing no logic: it delegates to a handler class
  (`{Object}TriggerHandler`). Reuse the project's trigger framework if one exists.
- Logic lives in service classes (`{Domain}Service`), queries in selector classes or clearly named
  private methods. Controllers (`@AuraEnabled`) stay thin.
- Declare sharing on every class: `with sharing` (default), `inherited sharing` for utilities,
  `without sharing` only with a comment explaining why.
- Use the project's API version from `sfdx-project.json` in `-meta.xml` files.

## Security
- SOQL: `WITH USER_MODE`; dynamic SOQL: `Database.query(q, AccessLevel.USER_MODE)` or
  `Database.queryWithBinds`, with bind variables. Never concatenate user input.
- DML: `insert as user` / `Database.insert(records, AccessLevel.USER_MODE)`, or
  `Security.stripInaccessible` when partial access is valid.
- Feature checks: `FeatureManagement.checkPermission('Custom_Permission')`, never profile or role
  names.
- No hard-coded record IDs, URLs, credentials. Callouts use Named Credentials (`callout:Name`).
- `@AuraEnabled` methods: validate inputs; throw `AuraHandledException` with a user-safe message;
  `cacheable=true` only for read-only methods.

## Bulk and limits
- No SOQL, DML, callouts or `Database.executeBatch` inside loops.
- Methods accept and return collections; use `Map<Id, SObject>` for lookups.
- Query only the fields needed; selective `WHERE` clauses on large objects.
- Async for heavy work: Queueable (chaining, callouts), Batch (large volumes), Schedulable
  (time-based). Guard against recursion.

## Errors and logging
- Catch only what you can handle; never swallow exceptions silently.
- Use the project logging utility if present; otherwise `System.debug` with `LoggingLevel` and no
  PII.
- Partial-success DML (`Database.update(records, false)`) when one bad record must not fail the
  batch — and process `SaveResult` errors.

## Style
- Meaningful names; methods do one thing; constants in Custom Metadata or a constants class.
- ApexDoc on public/global methods.
- Use the `platform-apex-generate` skill when creating classes and `platform-apex-test-generate`
  for tests.
