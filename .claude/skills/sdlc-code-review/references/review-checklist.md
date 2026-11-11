# Salesforce code review checklist

Use per pass. Each item is a question to answer from the code that was read; a "no" becomes a
finding with `file:line`, severity and confidence. Items that do not apply to the change are
skipped, not ticked.

## Pass 1 — Correctness against the spec

- [ ] Every AC in `spec.md` maps to code that implements it (cite the method or element).
- [ ] Every AC maps to a test, or to a recorded manual result, that would fail if the AC broke.
- [ ] Every functional requirement in the plan (§3) is implemented; nothing in §4 Metadata Scope
      is missing from the delta, nothing in the delta is missing from §4.
- [ ] Boundary values behave as the AC states (at the threshold, just below, just above).
- [ ] Null and empty inputs: empty list returns empty, never `null`; `SUM()` over zero rows and a
      null `GROUP BY` key are handled; missing `recordId` is handled.
- [ ] Existing behaviour the plan promised to keep (Impact Analysis, §6) is unchanged and has a
      regression test.
- [ ] No behaviour was added that no requirement asks for.
- [ ] Error messages shown to users come from Custom Labels and say what to do.

## Pass 2 — Security

**Sharing**
- [ ] Every Apex class declares `with sharing`, `without sharing` or `inherited sharing`. A class
      with no keyword called from an `@AuraEnabled` or REST entry point runs without sharing in
      effect when its caller does.
- [ ] Each `without sharing` is small, justified in a comment or the LLD, and does not return
      records to the caller's UI unchecked.
- [ ] Controllers for LWC, Aura and Visualforce are `with sharing`.

**CRUD and FLS**
- [ ] SOQL uses `WITH USER_MODE` (or `WITH SECURITY_ENFORCED` in existing code) or
      `Database.query(..., AccessLevel.USER_MODE)`; DML uses `insert as user` /
      `Database.insert(records, AccessLevel.USER_MODE)`, or `Security.stripInaccessible` where
      partial access is valid.
- [ ] System-mode access is deliberate and documented (for example a roll-up the user may not
      read directly), and the data returned to the user is limited to what they may see.
- [ ] New fields have FLS granted in a permission set in the same change; otherwise user-mode
      code fails for everyone except administrators.
- [ ] **Query fields versus granted access.** List every object and field read in user mode
      (`WITH USER_MODE`, `AccessLevel.USER_MODE`, `stripInaccessible`, `Schema` describe checks)
      and every field the LWC or flow reads, and compare with the read/edit access the feature's
      permission set(s) grant (the `*.permissionset-meta.xml` in the change or in the baseline).
      A field that is queried but not granted fails for every non-admin user while tests run as
      an admin pass and the scan is clean: Major, Confirmed when both files were read. The fix
      direction names the permission set and field, and the minimum-access test that proves it.

**Injection**
- [ ] No dynamic SOQL or SOSL built by concatenating input. Bind variables
      (`:value`, `Database.queryWithBinds`) are used; where an identifier must be dynamic it is
      validated against `Schema` describe results, and `String.escapeSingleQuotes` is the last
      resort for literals only.
- [ ] No user input reaches `Type.forName`, dynamic method dispatch or a callout URL unvalidated.

**Secrets and environment values**
- [ ] No passwords, tokens, API keys, client secrets or session IDs in code, metadata, tests,
      static resources or comments.
- [ ] No hard-coded record IDs (15 or 18 characters), org IDs, profile or role names, usernames,
      instance URLs or endpoints. Named Credentials and External Credentials for callouts;
      Custom Metadata or Custom Labels for values; `UserInfo` / `URL` methods for org facts.
- [ ] No `System.debug` of sensitive data.

**Exposed entry points**
- [ ] Each `@AuraEnabled` method validates its parameters, enforces access itself (the client is
      not trusted), and returns only the fields the UI needs. `cacheable=true` methods perform no
      DML.
- [ ] `@RestResource`, `webservice` and `global` members are intended, authenticated and
      documented.
- [ ] `@InvocableMethod` inputs are bulkified and validated.

**XSS and UI**
- [ ] LWC: no `innerHTML` assignment or `lwc:dom="manual"` with unsanitised data; no
      `eval`; `lightning-formatted-rich-text` only for trusted content.
- [ ] Aura: no `aura:unescapedHtml` with user data; no `$A.util` DOM injection.
- [ ] Visualforce: no `escape="false"` on user-controlled values; `JSENCODE` / `HTMLENCODE` in
      script and markup contexts; no state-changing action on page load (CSRF).
- [ ] No open redirect from a URL parameter.

**Guest and external users**
- [ ] Classes reachable by the guest user or Experience Cloud users are `with sharing`, enforce
      user mode, and do not expose internal fields.
- [ ] No object or field access is granted to the guest profile or guest permission set beyond
      what the story requires; no "View All" or "Modify All".
- [ ] New sharing (rules, sets, Apex managed sharing) opens only what the design states.

## Pass 3 — Governor limits and bulk safety

- [ ] No SOQL, SOSL, DML, callout, `Messaging.sendEmail`, `System.enqueueJob` or
      `EventBus.publish` inside a `for`/`while` loop, directly or through a called method.
- [ ] Triggers and invocable methods handle `Trigger.new` / input lists of 200+ records;
      nothing assumes `Trigger.new[0]`.
- [ ] Queries are selective on large objects: filters on indexed fields (Id, Name, owner,
      lookups, external IDs, unique fields), no leading-wildcard `LIKE`, no negative or
      null-only filters as the only criterion; a `LIMIT` where the result is displayed.
- [ ] Queries select only needed fields; no query for all rows of a growing object.
- [ ] Collections are keyed (`Map<Id, …>`) rather than searched in nested loops (CPU).
- [ ] Heap: no unbounded lists of large records or strings held in memory; SOQL for loops for
      large result sets; `Database.QueryLocator` in batch `start`.
- [ ] Asynchronous work: one Queueable chained deliberately (depth, limits per transaction);
      batch scope sized for callouts and limits; `Database.AllowsCallouts` and
      `Database.Stateful` only when needed; no `@future` from batch or future context; scheduled
      jobs do not exceed the daily asynchronous limit at the expected volume.
- [ ] Recursion: triggers and record-triggered flows that update the same object are guarded so
      they do not re-run the logic or double-count (a static set of processed IDs or a field
      change check, not a single static boolean that also blocks the second chunk of 200).
- [ ] Mixed DML: setup objects (User, PermissionSetAssignment, Group) and non-setup objects are
      not modified in the same transaction outside tests (`System.runAs` in tests).
- [ ] Row locking: parents with many children updated in parallel (batch, integrations) are
      considered (`FOR UPDATE`, serial batch, retry on `UNABLE_TO_LOCK_ROW`).
- [ ] DML handles partial failure where designed (`Database.update(records, false)` with every
      `SaveResult` checked) and does not swallow errors otherwise.
- [ ] Callouts happen before DML in the transaction, or asynchronously; timeouts are set.

## Pass 4 — Automation interplay

- [ ] All automation on each touched object and event was listed (before-save flows, before
      triggers, validation rules, duplicate rules, after triggers, assignment and auto-response
      rules, after-save flows, entitlement and roll-up recalculation, async paths) and the final
      field values are as designed.
- [ ] A trigger and a record-triggered flow on the same object do not both set the same field or
      both create the same child record.
- [ ] Before-save flow or before-trigger changes are not blocked by an existing validation rule,
      and new validation rules do not block existing automation, integrations or data loads
      (bypass through a Custom Permission where designed, not a profile name).
- [ ] Flow trigger order values are set where more than one record-triggered flow exists.
- [ ] New record-triggered flows have entry conditions (no run on every save), fault paths on
      every DML, action and callout element, and no DML or Get Records inside loops.
- [ ] One trigger per object delegating to a handler; no logic in the trigger body.
- [ ] Updates performed by the change do not re-fire heavy automation unnecessarily (update only
      changed records and fields).

## Pass 5 — Tests

- [ ] Every test method asserts outcomes (`Assert.areEqual`, `Assert.isTrue`, … with messages).
      A method with no assertion, or only `Assert.isTrue(true)` / `System.assert(true)`, is a
      Major finding.
- [ ] Positive, negative (expects the exception and asserts its type or message), boundary,
      bulk (`quality.bulkTestSize`, at least 200 records) and permission (`System.runAs` with a
      user holding only the intended permission sets) cases exist for changed logic.
- [ ] A **minimum-access** test exists for user-mode code: `System.runAs` a user created with a
      minimal profile and *only* the feature's permission set(s), exercising the read and write
      paths. Tests that run only as the admin test user hide missing FLS.
- [ ] `Test.startTest()` / `Test.stopTest()` wrap the action; asynchronous work is asserted
      after `stopTest`.
- [ ] No `@IsTest(SeeAllData=true)` unless a recorded constitution exception covers the class.
- [ ] Test data comes from `@TestSetup` and the project's factory; no hard-coded IDs, no
      dependence on existing org data, users, record types by ID or dates that will pass.
- [ ] Callouts use `HttpCalloutMock` / `Test.setMock`; no real endpoints.
- [ ] Tests would fail if the implementation were wrong (they assert values, not just "no
      exception"). Spot-check one by reading it against the code.
- [ ] Coverage of each changed class and trigger meets `quality.coverageTarget`, read from a
      real run result that is cited. Without a result: "coverage unverified".
- [ ] LWC: Jest tests exist for changed bundles and cover loading, data, empty and error
      states; wire adapters and Apex are mocked.
- [ ] No test was deleted, commented out or weakened to make the change pass.

## Pass 6 — Metadata

- [ ] API version of new and changed `-meta.xml` files matches `salesforce.apiVersion`
      (or `sourceApiVersion` in `sfdx-project.json`); no drift introduced.
- [ ] Access is granted through permission sets and permission set groups. No profile changes
      in the diff, except where the project records profiles as its model.
- [ ] Every new object, field, Apex class, Visualforce page, tab, custom permission and flow
      that users need is granted in a permission set in the same change.
- [ ] Destructive changes (deleted or renamed components, removed picklist values, field type
      changes, reduced length or precision) are declared in the plan, have a destructive
      manifest entry and a data consequence. A rename is a delete plus a create.
- [ ] Field history tracking, Shield Platform Encryption, data classification, and
      "required" / "unique" / "external ID" attributes on new or changed fields are intended;
      encrypted fields are not used in filters, formulas or unsupported contexts.
- [ ] New required fields or validation rules do not break existing integrations, data loads
      or test data.
- [ ] No org-specific metadata slipped in (usernames, org-wide email addresses, instance URLs,
      site URLs, named users in sharing or approval metadata).
- [ ] Flows are deployed in the intended state (`Active` / `Draft`) and old versions are
      considered.
- [ ] Record pages, layouts and FlexiPage visibility rules reference components that exist in
      the same deployment.
- [ ] Custom Labels and Custom Metadata hold user-facing text and thresholds; nothing
      configurable is hard-coded.

## Pass 7 — Lightning Web Components (and Aura where touched)

- [ ] `@wire` is used for read-only, cacheable data; imperative Apex for actions and DML; the
      Apex method's `cacheable` setting matches.
- [ ] Wired or imperative errors are handled and shown to the user (a toast or inline message
      with a plain-language text); loading and empty states exist.
- [ ] Data is refreshed after DML (`refreshApex`, `notifyRecordUpdateAvailable`) where the UI
      shows it.
- [ ] Lightning Data Service (`lightning-record-form`, `getRecord`, `updateRecord`) is used
      where it avoids Apex.
- [ ] Field and object references use `@salesforce/schema` imports; labels use
      `@salesforce/label`; permissions use `@salesforce/customPermission`.
- [ ] Accessibility: base components first; every input has a label; interactive elements are
      keyboard reachable with visible focus; images and icons have alternative text; colour is
      not the only signal; ARIA attributes are valid.
- [ ] No direct DOM manipulation outside the component's template; no `document.querySelector`
      across component boundaries; listeners added in `connectedCallback` are removed in
      `disconnectedCallback`.
- [ ] Public API (`@api` properties, events) is documented and backwards compatible for existing
      parents and pages; event names are lower case without `on`.
- [ ] `js-meta.xml` targets, `isExposed` and design attributes match where the component is
      meant to be used.
- [ ] No business logic duplicated in JavaScript that the server also enforces differently.

## Pass 8 — Maintainability

- [ ] The change follows the project's existing layering and frameworks (trigger handler,
      service, selector, logger, test factory) instead of introducing parallel ones.
- [ ] Names state intent and follow the project prefix (`salesforce.componentPrefix`).
- [ ] Methods do one thing; no copy-pasted blocks that should be one method.
- [ ] No dead code, commented-out code, leftover debug statements or TODOs without a ticket.
- [ ] Errors are logged with context through the project's logging utility and are not
      swallowed by empty `catch` blocks.
- [ ] Public Apex methods and non-obvious logic carry a short comment saying why.
- [ ] The diff contains nothing unrelated to the story (formatting churn, unrelated files).
