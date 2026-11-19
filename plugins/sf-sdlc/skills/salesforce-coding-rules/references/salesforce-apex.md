<!-- Generated from .claude/rules/salesforce-apex.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# Apex rules

Sources: Apex Developer Guide and Reference, Salesforce Secure Coding Guide, Salesforce Code Analyzer
(PMD, Graph Engine) rules, and Salesforce's `platform-apex-generate` skill. Rule names in brackets are
Code Analyzer rules that catch the mistake; `sf-sdlc analyze` runs them.

## Structure
- One trigger per object, with no logic: it routes every DML context to a handler (or to the
  project's trigger framework, such as Trigger Actions Framework, when one exists). [AvoidLogicInTrigger]
- Layers: trigger routes → service orchestrates → domain applies rules to in-memory lists (no SOQL or
  DML) → selector owns SOQL, DML lives in the service or a unit of work, integration classes own HTTP.
  `@AuraEnabled`, `@InvocableMethod` and `@RestResource` classes stay thin and call a service.
- Sharing on **every** class, written explicitly: `with sharing` for services, controllers, batch,
  queueable, schedulable and invocable classes; `inherited sharing` for selectors; `without sharing`
  only in a small helper called from a `with sharing` entry point, with a comment giving the business
  reason (and, where users can reach it, a custom-permission check). [ApexSharingViolations]
- API version from `sfdx-project.json`. Raising a class across API 66.0 → 67.0 changes its default
  data access from system mode to user mode: recheck every query and DML and rerun the
  minimum-access tests before raising it. [AvoidOldSalesforceApiVersions]
- `global` only when a managed package or `@RestResource` requires it. [AvoidGlobalModifier]
- Small units: split a class over ~500 lines, extract a method over ~40 lines; inject dependencies
  through constructors and interfaces so tests can stub them. [CognitiveComplexity, ExcessiveClassLength]

## Security
- **Set the access mode on every database operation**, in every API version: SOQL/SOSL
  `WITH USER_MODE`; DML `insert as user` / `update as user`, or `Database.insert(records,
  AccessLevel.USER_MODE)`. System mode (`WITH SYSTEM_MODE`, `as system`, `AccessLevel.SYSTEM_MODE`)
  only with a comment giving the reason (rollups that expose nothing, log objects). [ApexCRUDViolation, ApexFlsViolation]
- Never `WITH SECURITY_ENFORCED`: it does not compile from API 67.0 and misses WHERE-clause and
  polymorphic fields. Use `WITH USER_MODE`; read `QueryException.getInaccessibleFields()` and
  `DmlException.getDmlFieldNames()` to report what failed.
- `Security.stripInaccessible` where partial access is valid, and on records deserialized from
  untrusted input before DML.
- Dynamic SOQL: `Database.queryWithBinds(query, binds, AccessLevel.USER_MODE)` with bind variables.
  Field, object or sort names from input are checked against an allowlist or `Schema` describe; never
  concatenate input. [ApexSOQLInjection]
- Feature access: `FeatureManagement.checkPermission('Custom_Permission')`; never profile or role names.
- No hard-coded record IDs (use DeveloperName lookups, Custom Metadata or describe for record types),
  URLs or credentials; callouts use Named Credentials (`callout:Name`) over https.
  [AvoidHardcodingId, ApexSuggestUsingNamedCred, ApexInsecureEndpoint]
- `@AuraEnabled`: validate every input; throw `AuraHandledException` with a user-safe message (no
  stack trace, no internal detail); `cacheable=true` only for read-only methods; properties need public
  getters. [InaccessibleAuraEnabledGetter]
- No DML in constructors or initializers [ApexCSRF]; no `addError(msg, false)` with
  input [ApexXSSFromEscapeFalse]; no hard-coded crypto keys [ApexBadCrypto]; no PII, tokens or session
  IDs in logs, messages or responses.

## Bulk and limits
- Nothing with a limit inside a loop: SOQL, SOSL, DML, `Database.*`, `Messaging.sendEmail`,
  `System.enqueueJob`, describe calls. [OperationWithLimitsInLoop, OperationWithHighCostInLoop]
- Collections in, collections out; single-record methods delegate to the bulk method. `Map<Id, SObject>`
  for lookups, `Map<Id, List<SObject>>` to group children; iterate `Trigger.new`, never index `[0]`.
  [AvoidDirectAccessTriggerMap]
- Every query has a selective `WHERE` and/or `LIMIT` and selects only the fields it reads; prefer
  parent-child subqueries and `AggregateResult` over extra queries. [AvoidNonRestrictiveQueries]
- DML only the records that changed (compare with `Trigger.oldMap`). Guard recursion by comparing
  field values, not with a static boolean.
- Custom Metadata through `getAll()` / `getInstance()`, not SOQL. Describe with
  `SObjectDescribeOptions.DEFERRED`; never `Schema.getGlobalDescribe()` for one type.
  [EagerlyLoadedDescribeSObjectResult]
- Never hard-code a governor limit number; read `Limits.*`. Limits change between releases.

## Async
- No `@future` in new code; use Queueable. [AvoidFutureAnnotation]
- Every Queueable attaches a `System.Finalizer` (`System.attachFinalizer`) for logging and recovery.
  [QueueableWithoutFinalizer]
- Chained Queueables pass `AsyncOptions` (`MaximumQueueableStackDepth`, a `DuplicateSignature`); an
  executing job enqueues at most one child.
- Large volumes: Batch Apex (`Database.QueryLocator`; `Database.Stateful` only when state is needed,
  never holding `SaveResult` objects) or `Database.Cursor` with a Queueable. [AvoidStatefulDatabaseResult]
- Schedulable classes only start a Queueable or Batch; prefer a scheduled flow for simple schedules.
- Callouts from async code: `Database.AllowsCallouts`; an `@InvocableMethod` that calls out sets
  `callout=true`.

## Errors and logging
- No empty catch blocks; catch specific exceptions before `Exception`; keep the cause
  (`new ServiceException(msg, e)`); one custom exception type per service area. [EmptyCatchBlock]
- Use the project's logging framework. `System.debug` stays off main code paths and always has a
  `LoggingLevel`. [AvoidDebugStatements, DebugsShouldUseLoggingLevel]
- Partial-success DML (`Database.update(records, false, AccessLevel.USER_MODE)`) processes every
  `SaveResult` error. Invocable methods return success and error fields for recoverable errors.

## Integration
- `@RestResource`: `global with sharing`, versioned `urlMapping`, correct status codes (200, 201, 400,
  404, 422, 500), pagination, a thin class over a service.
- Inbound and outbound payloads are typed classes (`…DTO`), validated before use.

## Style
- Names: `{Object}Service`, `{Object}Selector`, `{Object}Domain`, `…Batch`, `…Queueable`,
  `…Schedulable`, `…DTO`, `I…` for interfaces; maps as `valueByKey`; constants in UPPER_SNAKE; no type
  named like a system type. [ClassNamingConventions, TypeShadowsBuiltInNamespace]
- ApexDoc on the class and every public or global method. Enums over string constants. Return empty
  collections, not null. Use `?.`, `??` and `String.isBlank`.
- Configuration in Custom Metadata, user-facing text in Custom Labels.
- If the `platform-apex-generate` skill is installed, load it before creating a class; for tests,
  `platform-apex-test-generate`.
