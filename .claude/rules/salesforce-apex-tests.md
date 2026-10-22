---
description: Apex test classes — structure, data, assertions, coverage
paths:
  - "**/*Test.cls"
  - "**/*_Test.cls"
  - "**/*Tests.cls"
---

# Apex test rules

- `@IsTest` class, `private`. Shared data in `@TestSetup` via a TestDataFactory; no `SeeAllData=true`.
- One behaviour per test method; name as `method_condition_expectedResult`.
- Wrap the action in `Test.startTest()` / `Test.stopTest()`.
- Assert outcomes with `Assert.areEqual(expected, actual, 'message')` (or `System.assertEquals`
  with a message). A test without assertions is a defect.
- Cover: positive, negative (expect the exception and assert its message), boundary values,
  bulk (≥ 200 records, and 201 to cross a trigger chunk), and permissions with `System.runAs` on a
  user with only the intended permission sets.
- Callouts: `HttpCalloutMock` / `Test.setMock`; never real endpoints.
- No hard-coded IDs or dates relative to "now" that can flake; build dates from `Date.today()`.
- Target ≥ 85% coverage for new and changed classes (org minimum 75%), but coverage is a side
  effect of testing behaviour, not the goal.
