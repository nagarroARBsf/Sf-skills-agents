# Salesforce design decision guides

## 1. Implementation approach ladder

Pick the first rung that meets the requirement **and** stays maintainable:

1. **Standard feature** — Path, Account Hierarchy, Opportunity Contact Roles, Duplicate Rules,
   Collaborative Forecasts, Report Charts, Dynamic Forms, Assignment Rules.
2. **Configuration** — fields, layouts, Lightning pages, list views, validation rules, sharing.
3. **Declarative automation** — Flow (record-triggered before-save for same-record updates;
   after-save for related records; scheduled; screen flows).
4. **Code** — Apex, LWC.
5. **AppExchange / off-platform** — when a mature product exists or the workload does not belong
   on the platform.

## 2. Flow or Apex?

| Prefer Flow when | Prefer Apex when |
|---|---|
| Same-record field updates (before-save flow is fastest) | Complex logic, many branches, reusable calculation used from several entry points |
| Simple related-record create/update | Large data volumes, batch processing, callouts with error handling |
| Admin team will maintain it | Strong unit testing needs; logic must be bulk-safe under heavy load |
| Screen-based guided process | Trigger order/recursion must be tightly controlled |
| Few elements, low change risk | The object already has an Apex trigger framework (keep one entry point) |

Do not mix a record-triggered flow and an Apex trigger doing related work on the same object and
event without documenting the order (Flow Trigger Explorer order + trigger handler) in the HLD.

## 3. Sync or async?

| Need | Use |
|---|---|
| User must see the result immediately, small work | Synchronous (trigger / before-save flow) |
| Callout after DML | Queueable (`Database.AllowsCallouts`), Platform Event, or flow async path |
| > 10k records or long CPU | Batch Apex (scope 200 default) |
| Time-based (overdue, aging) | Scheduled flow or Schedulable + Batch |
| Fan-out to several subscribers | Platform Events |
| Keep external system in sync with Salesforce changes | Change Data Capture |

## 4. Integration pattern selection

Salesforce integration patterns:

| Pattern | When | Typical mechanism |
|---|---|---|
| Remote process invocation — request and reply | Salesforce needs an answer now | Apex callout via Named Credential; External Services |
| Remote process invocation — fire and forget | Notify another system, no wait | Platform Event; outbound message; queueable callout |
| Batch data synchronization | Large periodic loads | Bulk API 2.0 via middleware/ETL |
| Remote call-in | External system creates/updates Salesforce data | REST/Composite API, Apex REST |
| UI update based on data changes | Users must see external changes live | Platform Events / CDC + `lightning/empApi` |
| Data virtualization | Show external data without storing it | Salesforce Connect (External Objects) |

Always: Named Credentials + External Credentials, idempotency key for retries, error logging
object or platform logging, explicit owner for failed records.

## 5. Security model choices

| Requirement | Design |
|---|---|
| Users see only their own/team's records | OWD Private + role hierarchy + sharing rules |
| Feature available to some users | Custom Permission in a permission set |
| Hide a field from some personas | FLS via permission sets; never only via layout |
| Apex reads data on behalf of the user | `with sharing` + `WITH USER_MODE` |
| System-level job must see everything | `without sharing` in a small, documented class; explain in LLD |
| External users | Experience Cloud licence + sharing sets / sharing groups |

## 6. Large data volume (LDV)

Flag any object above ~1M records or growth above ~100k/month:
- selective filters (indexed fields, external IDs), skinny tables if needed
- avoid data skew: > 10k children under one parent, or > 10k records owned by one user
- archive strategy (Salesforce Archive, Big Objects, external)
- Bulk API for loads; defer sharing calculations during migration

## 7. Configuration over constants
Thresholds (20% discount, 60 days), mappings and feature switches go in Custom Metadata Types
(deployable, cacheable, testable). Custom Settings only for per-user/profile hierarchy values.
