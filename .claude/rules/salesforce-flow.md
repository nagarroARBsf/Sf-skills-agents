---
description: Flows — record-triggered design, fault handling, bulk safety, run context, deployment
paths:
  - "**/flows/**"
  - "**/*.flow-meta.xml"
---

# Flow rules

Sources: Salesforce Architects "Record-Triggered Automation" decision guide, Flow Builder best practices
(Salesforce Help), and Salesforce's `automation-flow-generate` skill.

## Design
- Same-record field updates in a **before-save** (fast field update) flow; related records, actions and
  messages in after-save flows.
- Several small flows with precise entry conditions, ordered in Flow Trigger Explorer, rather than one
  "mega-flow" per object. Record the trigger order when it matters.
- Choose per object, and record it: flows or an Apex trigger framework own the automation; do not add a
  trigger to a flow-owned object (or the reverse) without that decision.
- Logic is idempotent: compare prior and new values (`$Record__Prior`) so a re-save does nothing new.
- Async work on the **Run Asynchronously** path; date-relative work on scheduled paths.
- Bypass, when the design needs one, through a custom permission (`$Permission`), never a user or
  profile check.

## Build
- Every DML, action and callout element has a fault path that logs or shows `$Flow.FaultMessage` in
  plain language.
- No Get Records, DML or actions inside loops: collect in a collection variable with Assignment and
  write once after the loop.
- No hard-coded IDs: Get Records by DeveloperName, or Custom Metadata.
- Runs in user context by default; system context only in a separate subflow with a recorded reason.
- Screen flows: no records created before the first screen; block Back after DML; labels and help
  text from Custom Labels where the org is multilingual.
- Callouts after DML in a separate transaction (asynchronous path or a pause).
- A description on the flow and on every element and resource.

## Change and deploy
- If the `automation-flow-generate` skill is installed (Metadata Experts MCP), generate flow XML with it
  and do not hand-edit the result; fix a problem by regenerating with an explicit instruction. Edit XML
  by hand only to fix a reported deployment error, and record it.
- Deploy new or changed flows as Draft and activate after verification; keep the previous version for
  rollback.
- Lightning Flow Scanner or Code Analyzer's flow rules (`sf-sdlc analyze`) show no blocking violation.
