---
description: Apex test classes — structure, data, assertions, permissions, async, mocks, coverage
paths:
  - "**/*Test.cls"
  - "**/*_Test.cls"
  - "**/*Tests.cls"
---
<!-- Installed by `sf-sdlc init` from the sf-sdlc plugin (generated from .claude/rules/salesforce-apex-tests.md). Re-running init updates this file while it is unchanged; once you edit it, it is yours and is kept. -->

# Apex test rules

Sources: Apex Reference (`Assert`, `Test`), Apex Developer Guide, Code Analyzer rules, and Salesforce's
`platform-apex-test-generate` skill. Thresholds come from the project config
(`sf-sdlc config show --json`, `quality.*`), not from this file.

## Structure and data
- `@IsTest private` class; `@IsTest` on methods (never `testMethod`). Tests live in test classes.
  [ApexUnitTestMethodShouldHaveIsTestAnnotation, TestMethodsMustBeInTestClasses]
- Data from a TestDataFactory called in `@TestSetup`. The factory takes a `doInsert` flag, builds lists,
  fills required and validation-rule fields, and finds record types by DeveloperName. Never
  `SeeAllData=true`. [ApexUnitTestShouldNotUseSeeAllDataTrue]
- One behaviour per method, laid out Given / When / Then; null and empty inputs get their own methods.
  Name methods `method_condition_expectedResult` (or the project's existing convention).
- `Test.startTest()` / `Test.stopTest()` around the action under test only; set mocks before
  `startTest`.

## Assertions
- Use the `Assert` class (`Assert.areEqual`, `Assert.isTrue`, `Assert.fail`, `Assert.isInstanceOfType`)
  with a message every time; not the legacy `System.assert*`. A test without an assertion is a defect.
  [ApexUnitTestClassShouldHaveAsserts, ApexAssertionsShouldIncludeMessage]
- Assert exact values derived from the setup data, not `size() > 0` or "no exception thrown".
- Negative tests: `try { action; Assert.fail('Expected …'); } catch (SpecificException e) {
  Assert.areEqual(expectedMessage, e.getMessage(), '…'); }` — catch the specific type, never `Exception`.

## Coverage of behaviour
- Every acceptance criterion maps to at least one test method (named in the plan's §7).
- Positive, negative, boundary (below, at and above each threshold), and **bulk**: at least
  `quality.bulkTestSize` records and more than one 200-record trigger chunk (for example 251). For
  Batch Apex only one `execute` runs in a test: set the batch size to at least the record count.
- **Minimum access**: create a user on a minimal-access profile (look the profile up; do not hard-code
  an ID), assign **only** the feature's permission sets (for a permission set group call
  `Test.calculatePermissionSetGroup(groupId)` first), and run the read and write paths inside
  `System.runAs`. Mandatory for user-mode code. Add one unauthorised-user case that must fail.
  [ApexUnitTestClassShouldHaveRunAs]

## Async, events and mocks
- Queueable: only the first job of a chain runs in a test; assert the chain through `AsyncApexJob`.
  Test a Finalizer separately. Batch `finish` chains in their own method. Schedulable: call
  `execute(null)` and assert the `CronTrigger`. Platform events: `Test.getEventBus().deliver()`.
- Callouts: `HttpCalloutMock` or `StaticResourceCalloutMock` for success, error and timeout; never a
  real endpoint. SOSL: `Test.setFixedSearchResults`.
- Stubs: `Test.createStub` with `System.StubProvider` and `@TestVisible` constructor injection;
  `Test.createSoqlStub` only for external objects and Data Cloud objects.
- Dates from `Date.today()` / `System.now()`, never fixed dates that age; no hard-coded IDs.

## Coverage
- New and changed classes reach `quality.coverageTarget` (org minimum `quality.orgCoverageMinimum`, at
  least 75% by platform rule). Coverage is the side effect of testing behaviour, not the goal: a line
  executed without an assertion on its result is not tested.
- Split a test class over ~500 lines; extract helpers from a method over ~30 lines.
