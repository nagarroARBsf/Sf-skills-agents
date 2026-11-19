---
name: salesforce-coding-rules
description: "Salesforce coding and documentation rules for this delivery kit: Apex and triggers (security, bulkification, structure), Apex tests, Lightning Web Components, Flows, metadata XML, and SDLC document conventions. TRIGGER when: writing, editing or reviewing .cls, .trigger, LWC files, *-meta.xml metadata, or documents under docs/sdlc/ or specs/; load it alongside the skill doing the work. DO NOT TRIGGER for files outside Salesforce source or SDLC documents."
---
<!-- Generated from .claude/rules/*.md (rules with paths:) by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# salesforce-coding-rules

Project coding rules that apply on top of the specialist skills. Before writing or reviewing a
file, read **every** reference below whose globs match it, and follow it over generic habits.

| Rule | Applies to | Covers |
|---|---|---|
| [salesforce-apex-tests](references/salesforce-apex-tests.md) | `**/*Test.cls`, `**/*_Test.cls`, `**/*Tests.cls` | Apex test classes — structure, data, assertions, permissions, async, mocks, coverage |
| [salesforce-apex](references/salesforce-apex.md) | `**/*.cls`, `**/*.trigger` | Apex classes and triggers — structure, security, bulkification, async, errors, integration |
| [salesforce-flow](references/salesforce-flow.md) | `**/flows/**`, `**/*.flow-meta.xml` | Flows — record-triggered design, fault handling, bulk safety, run context, deployment |
| [salesforce-lwc](references/salesforce-lwc.md) | `**/lwc/**` | Lightning Web Components — templates, data access, security, performance, accessibility, SLDS, Jest |
| [salesforce-metadata](references/salesforce-metadata.md) | `**/*-meta.xml`, `**/objects/**`, `**/permissionsets/**`, `**/permissionsetgroups/**` | Salesforce metadata XML — objects, fields, validation rules, permission sets, deployment order |
| [sdlc-artifacts](references/sdlc-artifacts.md) | `docs/sdlc/**`, `specs/**` | Conventions for SDLC documents — IDs, traceability, status, diagrams |
