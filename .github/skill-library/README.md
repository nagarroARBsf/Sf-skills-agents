# Skill library (on demand)

Skills here are **not loaded** by Claude Code, GitHub Copilot or Cursor, so they add nothing to the
agent's system prompt. `skills/` holds only the core set (Apex, SOQL, objects, fields, deploy, Flow,
LWC, SDLC). Everything else lives here until a project needs it.

## Use a skill from the library

Copy the folder into `skills/` of the tool you use, in the project that needs it:

```bash
cp -r .claude/skill-library/omnistudio-omniscript-generate .claude/skills/     # Claude Code
cp -r .github/skill-library/omnistudio-omniscript-generate .github/skills/     # GitHub Copilot
cp -r .cursor/skill-library/omnistudio-omniscript-generate .cursor/skills/     # Cursor
```

Remove it again when the project is done. Keep `skills/` under about 30 entries.
To make a skill core for every project, `git mv` it between the two folders in `.claude/` and run
`python3 scripts/sync-platforms.py`.

## Index

| Skill | What it does |
|---|---|
| `agentforce-architecture-analyze` | Declared architecture snapshot for one Agentforce agent: planner, topics, actions, flows, Apex, prompt templates, and NGA plugins |
| `agentforce-bot-upgrade` | Use this skill to Upgrade Einstein Bots into Agentforce agents end-to-end in a single pass, orchestrating per-bot Agent Spec generation, pla |
| `agentforce-d360-analyze` | Data Cloud 360° view of a single Agentforce session |
| `agentforce-generate` | Build, modify, audit, repair, optimize, debug, and deploy agents with Agentforce Agent Script |
| `agentforce-observe` | Analyze production Agentforce agent behavior using session traces and Data Cloud, and manage Agent Health Monitoring (AHM) alerts |
| `agentforce-offline-experimentation-run` | Use this skill when users want to execute this workflow when a user wants to test how a different LLM model would handle existing Agentforce |
| `agentforce-persona-generate` | Use to design an AI agent persona — identity, voice, tone, behavioral style, guardrails — and encode it into Agent Script (.agent files) or  |
| `agentforce-test` | Write, run, and analyze structured test suites for Agentforce agents — functional AND security |
| `automation-sandbox-post-copy-config-generate` | Generates the JSON config file that the Salesforce sandbox post-copy automation tool consumes, from a customer SOP in any format (PDF, xlsx, |
| `automation-sandbox-post-copy-configure` | Apply a Salesforce sandbox post-copy automation JSON config against a target org |
| `commerce-b2b-open-code-components-integrate` | Integrate Salesforce B2B Commerce open source components from GitHub into B2B Commerce stores |
| `commerce-b2b-open-code-components-replace` | Replace OOTB (out-of-the-box) B2B Commerce components with open source equivalents in site metadata content.json files, or look up the equiv |
| `commerce-b2b-store-create` | Interactive workflow to create Commerce B2B Stores and retrieve storefront metadata |
| `data360-code-extension-generate` | Develop and deploy Data Cloud Code Extensions using SF CLI plugin |
| `data360-schema-get` | Retrieve Data Lake Object (DLO) and Data Model Object (DMO) schema information from Salesforce Data Cloud using REST APIs |
| `design-systems-slds-validate` | Audit Lightning Web Components for SLDS design-system compliance and produce a scored quality report |
| `design-systems-slds2-migrate` | Migrate Lightning Web Components from SLDS 1 to SLDS 2 by running the SLDS linter and fixing violations |
| `dx-apexguru-scan` | Run an ApexGuru performance scan on a Salesforce Apex project via the ApexGuru SFAP Scan API |
| `dx-app-analytics-query` | ISV App Analytics metadata types — AppAnalyticsQueryRequest and AppAnalyticsSettings |
| `dx-code-analyzer-configure` | Set up, configure, and troubleshoot Salesforce Code Analyzer for any project |
| `dx-code-analyzer-custom-rule-create` | Create custom Code Analyzer rules for Regex (pattern matching), PMD (XPath/AST for Apex and metadata XML), and ESLint (LWC/JavaScript/TypeSc |
| `dx-devops-conflict-resolve` | Use this skill to diagnose and resolve what blocks a DevOps Center promotion of a work item's feature branch: Git merge conflicts and deploy |
| `dx-devops-pipeline-manage` | Use this skill to manage the full lifecycle of a DevOps Center pipeline — list all pipelines, get a single pipeline's details, create a new  |
| `dx-devops-project-manage` | Use to list, view, or manage DevOps Center projects in a Salesforce org — show all projects, create a project, or update an existing project |
| `dx-devops-promote` | Use this skill to drive the full DevOps Center promotion workflow for work items and pipeline stages — validate preconditions, prepare work  |
| `dx-devops-request-status` | Use this skill to poll the status of an asynchronous DevOps Center request — a promotion or deploy operation |
| `dx-devops-test-failures-analyze` | Analyzes DevOps Center test failures and Code Analyzer violations in plain language — failure category, offending file/class/method/line, ru |
| `dx-devops-test-pipeline-configure` | Configures DevOps Center pipeline testing infrastructure: enables a test provider so its suites become available, re-syncs a configured prov |
| `dx-devops-test-suite-assignments-configure` | Recommends and manages DevOps Center test suite assignments for pipeline stages |
| `dx-devops-test-suite-run` | Runs DevOps Center test suites on a pipeline stage (Pre-Promote, Post-Promote, or Review event) end to end: triggers async execution via the |
| `dx-devops-work-item-manage` | Use this skill to manage the full lifecycle of DevOps Center work items — list, create, update, commit changes, perform status transitions,  |
| `dx-lifecycle-center` | Lifecycle Center for DX Inspector and Builder Central |
| `dx-org-analyze` | Compare two Salesforce orgs side-by-side and produce a comparison report with drift score, or analyze a single org to produce an inventory c |
| `dx-org-devhub-configure` | Enable Dev Hub on a Salesforce org and view its scratch org allocation, using the Salesforce CLI (sf) |
| `dx-org-permission-set-assign` | ALWAYS USE THIS SKILL to assign permission sets to org users |
| `dx-org-shape-manage` | ALWAYS USE THIS SKILL to create, list, or delete org shapes |
| `dx-org-snapshot-manage` | ALWAYS USE THIS SKILL to create, check the status of, list, or delete scratch org snapshots |
| `dx-org-switch` | Switches the active Salesforce org (default target-org) using the Salesforce CLI |
| `dx-org-trial-expiration-check` | Check when Salesforce orgs expire (or already expired) and what to do about it, for one org, the default org, or across all authenticated or |
| `dx-pkg-post-install-configure` | Use this skill to automate managed package post-install configuration |
| `experience-accessibility-validate` | Use this skill to determine whether a Lightning Web Component (LWC) is accessible and meets WCAG accessibility guidelines |
| `experience-aura-lwc-migrate` | Use this skill to analyze a Salesforce Aura component bundle (.cmp, .app, .evt, .intf, Controller.js, Helper.js, Renderer.js) and produce a  |
| `experience-cms-brand-apply` | Extracts, retrieves, and applies CMS brand guidelines (voice, tone, style, colors, typography) to generated content |
| `experience-cms-brand-create` | Author a Salesforce Digital Experience brand (a \"brand.json\") so the VS Code Brand Toolkit can load, edit, and preview it |
| `experience-cms-content-generate` | Creates, edits, and publishes Salesforce CMS content of any kind — any domain, any topic |
| `experience-cms-content-render` | Renders, embeds, or displays existing Salesforce CMS content in a React or Angular uiBundle app: installs the CMS toolkit, registers a typed |
| `experience-cms-content-type-generate` | Salesforce CMS ContentTypeBundle creation skill |
| `experience-content-media-image-generate` | Generates high-fidelity visual assets, logos, and UI mockups using the media-management MCP server |
| `experience-content-media-stock-image-search` | Searches for and downloads ethically-licensed stock images via the media-management MCP server |
| `experience-design-validate` | Use this skill to run a visual-craft audit of a rendered UI and produce an evidence-grounded Craft Report across Useful, Usable, Reliable, C |
| `experience-lds-best-practices-apply` | Use when reviewing or implementing Lightning Data Service best practices in an LWC (.js, .html, .js-meta.xml) — UIAPI vs Apex, refreshApex / |
| `experience-lds-data-requirements-generate` | Use when a Lightning Web Component data need is described in ambiguous natural language — turn \"get contact info\" or \"show account data\" |
| `experience-lds-graphql-generate` | Use ALWAYS when a prompt mentions GraphQL, lightning/uiGraphQLApi, @wire(graphql, ...), or gql template tags in an LWC context — even if the |
| `experience-lwc-accessibility-jest-run` | Use ALWAYS when running Sa11y accessibility Jest tests for an LWC — locally before pushing, producing the command(s), running one file vs a  |
| `experience-lwc-base-components-integrate` | Pick the right Lightning Base Component (`lightning-*`) for a given UI task, retrieve its full API (props, methods, events, slots) from the  |
| `experience-lwc-design-generate` | Use when you need to create a brand new Lightning Web Component from a Figma design, a Product Requirements Document, or another design arti |
| `experience-lwc-legacy-migrate` | Migrate legacy Salesforce UI stacks onto modern LWC — Aura → LWC conversion completeness verification and Lightning Out Beta → Lightning Out |
| `experience-lwc-rtl-validate` | Use this skill to review a Lightning Web Component (.html, .js, .css files) for right-to-left (RTL) internationalization correctness, produc |
| `experience-lwc-runtime-observe` | Use when running Salesforce Lightning Preview for an app or a single LWC component to extract the runtime DOM for inspection |
| `experience-lwc-security-validate` | Use this skill as THE specialized Lightning Web Security (LWS) validator for a Lightning Web Component bundle (`.js`, `.ts`, `.html`, `.css` |
| `experience-lwc-typescript-migrate` | Use when converting an existing JavaScript Lightning Web Component (.js, .html, .css) to TypeScript with full type annotations and a matchin |
| `experience-lwc-widget-assess` | Assess whether a specific Lightning web component can serve its user's purpose as an HXL declarative widget |
| `experience-lwc-widget-migrate` | Convert a specific existing Lightning web component (LWC) into a declarative HXL / Agentforce widget, end to end |
| `experience-lwr-site-generate` | Creates, modifies, or manages Salesforce Experience Cloud LWR sites via DigitalExperience metadata |
| `experience-portal-create` | Create / provision / set up a NEW Digital Experience (Communities) / Experience Cloud site — employee service, IT support, help desk, HR, cu |
| `experience-search-coordinate` | Searches for and retrieves existing content and media (articles, blogs, news, FAQs, events, products, images, logos, icons, photos, graphics |
| `experience-ui-bundle-2gp-deploy` | MUST activate when the user wants to package, distribute, or install/upgrade/uninstall/promote a UI Bundle as a Salesforce second-generation |
| `experience-ui-bundle-agentforce-client-generate` | Use this skill when the user asks to add, embed, integrate, configure, style, or remove an agent, chatbot, chat widget, conversation client, |
| `experience-ui-bundle-app-coordinate` | MUST activate when the user wants to build, create, or generate a React application, React app, web application, single-page application (SP |
| `experience-ui-bundle-custom-app-generate` | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves creating or configuring a Custom Application for  |
| `experience-ui-bundle-deploy` | MUST activate when the project has a uiBundles/*/src/ directory and the task involves deploying to an org or post-deploy org setup |
| `experience-ui-bundle-features-generate` | MUST activate when the project contains a uiBundles/*/src/ directory (React or Angular) and the user wants to add a pre-built feature — such |
| `experience-ui-bundle-file-upload-generate` | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves uploading, attaching, or dropping files |
| `experience-ui-bundle-frontend-generate` | MUST activate before editing ANY file under uiBundles/*/src/ (or the bundle's index.html) for visual or UI changes to an EXISTING app — page |
| `experience-ui-bundle-localize` | MUST activate to localize / internationalize a uiBundles/*/src/ project (React or Angular): extract hardcoded user-facing strings into Custo |
| `experience-ui-bundle-metadata-generate` | Use this skill when adding a front-end React or Angular UI bundle to an EXISTING SFDX project, or configuring UI bundle metadata and config  |
| `experience-ui-bundle-mfa-configure` | Configure Multi-Factor Authentication (MFA) for Salesforce Experience Site users |
| `experience-ui-bundle-project-generate` | Generates a minimal, ready-to-develop SFDX starter project from template instead of hand-scaffolding files |
| `experience-ui-bundle-salesforce-data-access` | MUST activate whenever a uiBundles/*/src/ project reads, writes, or displays Salesforce data — INCLUDING building a page, list, table, card  |
| `experience-ui-bundle-site-generate` | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves creating or configuring site infrastructure |
| `external-diagram-mermaid-generate` | Salesforce architecture diagrams using Mermaid with ASCII fallback |
| `integration-connectivity-connected-app-configure` | Salesforce Connected Apps and External Client Apps OAuth configuration with 120-point scoring |
| `integration-connectivity-generate` | Salesforce integration architecture and runtime plumbing with 120-point scoring |
| `integration-eventing-cdc-configure` | Use to enable Salesforce Change Data Capture (CDC) on a standard or custom object, configure a custom event channel, set a filter expression |
| `integration-eventing-subscription-configure` | Create, read, update, and delete ManagedEventSubscription metadata in Salesforce |
| `mobile-apps-create` | The entry point for building any Salesforce native mobile app on iOS or Android |
| `mobile-platform-native-capabilities-integrate` | Build a Salesforce LWC that uses native mobile device capabilities — barcode scanner, biometrics, location, NFC, calendar, contacts, documen |
| `mobile-platform-offline-validate` | Review a Lightning Web Component for **mobile offline** compatibility — the Komaci offline static analyzer that pre-primes the data graph fo |
| `omnistudio-callable-apex-generate` | Salesforce Industries Common Core (OmniStudio/Vlocity) Apex callable generation and review skill with 120-point scoring |
| `omnistudio-datamapper-generate` | OmniStudio Data Mapper (formerly DataRaptor) creation and validation with 100-point scoring |
| `omnistudio-datapacks-deploy` | Salesforce Industries DataPack deployment automation using Vlocity Build |
| `omnistudio-dependencies-analyze` | Cross-cutting OmniStudio analysis skill for namespace detection, dependency visualization, and impact analysis across OmniScripts, FlexCards |
| `omnistudio-epc-catalog-generate` | Salesforce Industries CME EPC product-modeling skill for Product2-based catalog creation |
| `omnistudio-flexcard-generate` | OmniStudio FlexCard creation and validation with 130-point scoring |
| `omnistudio-integration-procedure-generate` | OmniStudio Integration Procedure creation and validation with 110-point scoring |
| `omnistudio-omniscript-generate` | OmniStudio OmniScript creation and validation with 120-point scoring |
| `platform-agentexchange-partner-offers-configure` | Enable or disable the org preference that controls whether a Salesforce org can receive partner offers from the Transactable Marketplace |
| `platform-agenticsetup-categories-get` | Get agentic setup prompt categories from a connected Salesforce org using the Connect API via sf api request rest |
| `platform-custom-application-generate` | Use this skill when users need to create or configure tab-based Salesforce Custom Applications with navigation, branding, and action overrid |
| `platform-custom-lightning-type-generate` | Use this skill when users need to create Custom Lightning Types (CLTs) for Einstein Agent actions or structured input/output schemas |
| `platform-custom-report-type-generate` | Use to create, generate, or validate Salesforce Custom Report Type metadata |
| `platform-custom-setting-generate` | Use to create, generate, or validate Salesforce Custom Setting metadata |
| `platform-custom-tab-generate` | Use this skill when users need to create or configure Salesforce Custom Tabs |
| `platform-data-and-tooling-api-context-get` | Authoritative field/schema reference for 2130 STANDARD Salesforce objects — sObject and Tooling field API names, types, properties (filterab |
| `platform-datamask-run` | Data Mask end-to-end operation on a sandbox: configure a masking policy over PII, run the masking job, poll it to completion, report masked- |
| `platform-dataspace-access-configure` | Use this skill to configure or inspect Salesforce Data Cloud DataSpace access for permission sets |
| `platform-dsar-policy-manage` | Configure, run, and audit DsarPolicy Right-to-Portability exports end to end: author the data map over a subject's related records, resolve  |
| `platform-encryption-configure` | Configure Salesforce Shield Platform Encryption — generate deployable encryption settings and encrypted-field metadata, and answer key-model |
| `platform-lightning-app-coordinate` | Build complete Salesforce Lightning Experience applications from natural language descriptions |
| `platform-lightning-type-widget-coordinate` | Orchestrate Apex-backed Lightning Type + HXL widget generation |
| `platform-list-view-generate` | Use this skill when users need to create, generate, or validate Salesforce List View metadata |
| `platform-mcp-tool-widget-coordinate` | Orchestrate object-based Lightning Type + HXL widget generation to render the output of a custom MCP server tool backed by an Apex Invocable |
| `platform-models-api-configure` | Configure (or troubleshoot) an AI coding agent or CLI to route through the Salesforce Models API using a signed OrgJWT |
| `platform-policy-rule-generate` | Use this skill when authoring PolicyRuleDefinition and PolicyRuleDefinitionSet metadata XML for Salesforce Data Cloud governance policies, o |
| `platform-report-generate` | Use when users create, generate, or validate Salesforce Lightning Report metadata (.report-meta.xml) — tabular, summary, matrix, or joined r |
| `platform-role-hierarchy-apply` | Bulk-realign an existing Salesforce UserRole hierarchy from an external org-chart artifact (PDF, xlsx, or plain-text list of role-and-parent |
| `platform-salesforce-connect-adapter-generate` | Custom Apex adapter generation for Salesforce Connect — connects any external REST API to Salesforce as live, queryable External Objects wit |
| `platform-sandbox-configure` | MUST USE this skill for ANY sandbox request — including simply getting a sandbox's details, status, license type, or pending-activation stat |
| `platform-sharing-owd-configure` | Use when the user wants to retrieve or update Organization-Wide Default (OWD) sharing settings for Salesforce objects |
| `platform-sharing-rules-generate` | Use when users get, create, edit, delete, or retrieve Salesforce Sharing Rules metadata for record-level access |
| `platform-tracing-agentforce-configure` | Generate AgentforcePlatformTracingSettings metadata to enable or disable Agentforce agent execution trace spans flowing to Data Cloud |
| `platform-tracing-configure` | Generate EventSettings metadata to enable or disable Platform Tracing (TraceSpanEvent publishing) in Event Monitoring |
| `platform-trial-org-create` | Use this skill to create a Salesforce trial, developer, or Trialforce org against an already-authenticated host org, the same way a develope |
| `platform-trust-archive-manage` | ALWAYS USE THIS SKILL for anything involving Salesforce Archive (also called Trusted Services Archive) — search, view, unarchive, analyze, m |
| `platform-value-set-generate` | Use to create, generate, or validate a Salesforce GlobalValueSet (reusable picklist shared across fields) or customize a StandardValueSet (b |
| `platform-widget-generate` | Use this skill to author a complete HXL WidgetBundle (UEM body + schema.json + -meta.xml) |
| `sf-agentforce` | Build, configure, and test Agentforce agents on Salesforce |
| `sf-apex` | Generate and review Apex code for Salesforce with governor limit awareness, bulkification patterns, and CRUD/FLS compliance |
| `sf-data` | Handle Salesforce data operations including data migration, sandbox seeding, bulk data loading, data export, and data cleanup |
| `sf-debug` | Debug and troubleshoot Salesforce applications using debug logs, governor limit monitoring, error diagnosis, and performance profiling |
| `sf-deploy` | Orchestrate Salesforce deployments with dependency resolution, package.xml generation, targeted test execution, error diagnosis, and rollbac |
| `sf-diagram` | Generate Mermaid diagrams from Salesforce metadata and architecture |
| `sf-docs` | Navigate and find official Salesforce documentation |
| `sf-eval` | Evaluate and benchmark Salesforce skill quality |
| `sf-find` | Help users discover and select the right Salesforce skill for their task |
| `sf-flow` | Generate Flow metadata XML and migrate Process Builders to Flows |
| `sf-integration` | Configure Salesforce integrations: Named Credentials, Connected Apps, External Services, Platform Events, CDC, and auth flows |
| `sf-lwc` | Scaffold Lightning Web Components with HTML templates, JS controllers, CSS with SLDS compliance, js-meta.xml config, and Jest tests |
| `sf-omnistudio` | Comprehensive OmniStudio / Salesforce Industries development skill covering OmniScripts, FlexCards, Integration Procedures, Data Mappers (Da |
| `sf-permissions` | Manage and audit Salesforce permissions: Permission Sets, Profiles, Permission Set Groups, object/field-level security (CRUD/FLS), custom pe |
| `sf-schema` | Scaffold custom objects, fields, validation rules, permission sets, and other schema metadata as SFDX source XML |
| `sf-security` | Audit Apex code for CRUD/FLS violations, sharing rule compliance, SOQL injection risks, and PII exposure |
| `sf-soql` | Build and optimize SOQL queries including relationship queries, aggregate functions, polymorphic TYPEOF, and selective filters |
| `sf-test` | Generate comprehensive Apex test classes with @TestSetup methods, TestFactory patterns, bulk data (200 records), positive/negative/permissio |
