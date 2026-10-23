# Salesforce feasibility checklist

Run this against every requirement, story and design. Each row is a pattern that business users
ask for in good faith and that Salesforce does not do the way the words suggest. When a row
matches, do not silently "fix" it: write the platform behaviour, propose the options, and raise an
open question or assumption so a human picks.

| # | Request sounds like | Platform reality | Usual options |
|---|---|---|---|
| F1 | "Validation rule that **warns** but still lets the user save" | Validation rules always block the save. There is no warning mode. | Flag field + highlighted LWC/Dynamic Forms banner; approval process; soft-check in a screen flow. |
| F2 | "Field that shows days overdue / age / score based on **today's date**, stored for reports" | Records do not change when time passes. A stored value goes stale; triggers and record-triggered flows do not fire. Formula fields with `TODAY()` stay current but cannot be used in roll-ups, are not indexable, and cannot trigger automation. | Formula field (if no roll-up or trigger needed); scheduled flow or Batch Apex nightly recalculation; compute on read in LWC/Apex. |
| F3 | "Roll-up total/count of child records" on a **lookup** relationship | Roll-up summary fields work only on master-detail. | Change to master-detail (check sharing and ownership impact); record-triggered flow; Apex trigger; DLRS. |
| F4 | "Component **refreshes automatically** when another record changes" | LDS refreshes a component for the record it displays, and only for edits made in the same browser session. Changes to related records, other users' changes and async updates are not pushed. | `refreshApex` after own DML; `notifyRecordUpdateAvailable`; Platform Event or Change Data Capture via `lightning/empApi`; acceptable to require page refresh (state it). |
| F5 | "Show/hide based on the user's **role** or **profile** name" in code | Hard-coding role or profile names breaks on rename and is not packageable. | Custom Permission checked in Apex (`FeatureManagement.checkPermission`) or LWC (`@salesforce/customPermission/...`); Dynamic Forms visibility rules; permission set groups. |
| F6 | "Users **must not see** records X" while OWD is Public Read/Write | Sharing only opens access upward from the OWD; it cannot restrict below it. | Tighten OWD to Private/Read Only and open with sharing rules, teams or role hierarchy; restriction rules (where supported). |
| F7 | "Track history of every field" | Field History Tracking: limited number of fields per object (20 by default), retention limits. | Pick the critical fields; Field Audit Trail (Shield); custom history object. |
| F8 | "Process all records at once" / data loads in the tens of thousands | Synchronous limits: 100 SOQL, 150 DML, 10 s CPU, 6 MB heap per transaction; triggers run in chunks of 200. | Bulkified trigger handler; Batch/Queueable Apex; Bulk API for loads; skip-automation flag for migrations. |
| F9 | "Call the external system when the record is saved" | Callouts are not allowed in the same synchronous transaction after DML, nor from triggers directly. | Queueable with `Database.AllowsCallouts`; Platform Event + subscriber; flow with an asynchronous path; External Services. Always Named Credentials. |
| F10 | "Real-time two-way sync" with another system | Needs a defined source of truth per field, conflict handling and error queues; often over-specified. | Pick an integration pattern (request-reply, fire-and-forget, batch sync, remote call-in, data virtualization) per interface; agree latency in seconds/minutes, not "real time". |
| F11 | "Report chart on the record page showing only this record's children" | The standard Report Chart component filters by one record-ID field of the report; the report type must include it. | Standard Report Chart with record filter (no code); LWC with `lightning-chart` alternative (Chart.js static resource) if interaction needed. |
| F12 | "Send an alert / email to a manager" | Email deliverability, org daily email limits, and the "manager" must be a field (User.ManagerId) or role lookup. | Email alert from flow; Slack/Chatter notification; custom notification (bell). Define the recipient field. |
| F13 | "Unique / no duplicates" on business fields | Only text-type fields can be marked unique; cross-object or fuzzy duplicates need Duplicate/Matching Rules. | Unique external ID field; Matching + Duplicate Rules (alert or block). |
| F14 | "Approval when discount > X" | Approval processes lock the record during approval; Flow Approval Orchestration is the newer option. | Approval Process; Flow Orchestration; flag + manager review queue. |
| F15 | "Forecast by team/region" | Collaborative Forecasts roll up by the role hierarchy (or territory if Enterprise Territory Management). Region needs to exist in that hierarchy. | Align role hierarchy; ETM; custom reports on a Region field. |
| F16 | "Mobile users use it offline" | LWC on the Salesforce mobile app needs offline-ready design (Briefcase, priming, supported wire adapters). | Confirm offline need explicitly; use `mobile-platform-offline-validate`. |
| F17 | "Store documents/images on the record" | File storage limits per org; attachments are legacy. | Salesforce Files (ContentVersion); external storage via Files Connect. |
| F18 | "Delete after N days" / "keep for 7 years" | Recycle bin, data retention and archiving need an explicit design. | Scheduled batch purge; Salesforce Archive; Big Objects for history. |

Also check, every time:
- **Licences and editions**: the feature exists in the client's edition and the persona's licence
  (for example Forecasts, Territory Management, Platform Starter vs full Sales Cloud).
- **Standard first**: is there a standard object or feature (Opportunity Contact Roles, Path,
  Account Hierarchy, Duplicate Rules) before proposing custom objects or code?
- **Order of execution**: more than one automation on the same object and event (flow + trigger +
  validation rule) needs an explicit order and recursion guard.
- **Multi-currency, time zones, locales**: amounts and dates in requirements must state currency
  and time zone when the org is multi-currency or global.
