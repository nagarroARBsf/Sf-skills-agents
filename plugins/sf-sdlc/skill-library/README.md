# Skill library (installed per project)

Skills here are **not loaded** by Claude Code, so they add nothing to any session. Only the SDLC
process skills in `skills/` are always available. A project installs the Salesforce skills it
actually needs:

```bash
sf-sdlc skills recommend          # what this project needs, with the evidence
sf-sdlc skills install <names>    # copy them into the project's .claude/skills/
sf-sdlc skills list               # installed skills and their listing size
sf-sdlc skills sync               # update after upgrading the kit
```

or run `/sf-sdlc:skills`. Installed skills are recorded in `.claude/sf-sdlc.skills.lock.json`; a skill
edited in the project is never overwritten by `sync`.

Sources: `official` skills are vendored unmodified from
[forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills) (Apache-2.0, see
`LICENSE-forcedotcom-sf-skills.txt`); `community` skills (`sf-*`) come from
[Clientell-Ai/salesforce-skills](https://github.com/Clientell-Ai/salesforce-skills) (Apache-2.0);
`third-party` skills are vendored unmodified from their own repositories (`drawio-skill`:
[Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill), MIT, commit 6550495).
See `NOTICE` at the repository root.

## Index

| Skill | Source | What it does |
|---|---|---|
| `agentforce-architecture-analyze` | official | Declared architecture snapshot for one Agentforce agent: planner, topics, actions, flows, Apex, prompt templates, and NGA plugins |
| `agentforce-bot-upgrade` | official | Use this skill to upgrade Einstein Bots into Agentforce agents end-to-end in a single pass, orchestrating per-bot Agent Spec generation, agentforce-ge |
| `agentforce-d360-analyze` | official | Data Cloud 360° view of a single Agentforce session |
| `agentforce-generate` | official | Build, modify, audit, repair, optimize, debug, and deploy agents with Agentforce Agent Script |
| `agentforce-observe` | official | Analyze production Agentforce agent behavior using session traces and Data Cloud, and manage Agent Health Monitoring (AHM) alerts |
| `agentforce-offline-experimentation-run` | official | Use this skill when users want to execute this workflow when a user wants to test how a different LLM model would handle existing Agentforce agent con |
| `agentforce-persona-generate` | official | Use to design an AI agent persona — identity, voice, tone, behavioral style, guardrails — and encode it into Agent Script (.agent files) or Agentforce |
| `agentforce-test` | official | Write, run, and analyze structured test suites for Agentforce agents — functional AND security |
| `automation-flow-generate` | official | Generate Salesforce Flows using the MCP tool execute_metadata_action |
| `automation-sandbox-post-copy-config-generate` | official | Generates the JSON config file that the Salesforce sandbox post-copy automation tool consumes, from a customer SOP in any format (PDF, xlsx, csv, JSON |
| `automation-sandbox-post-copy-configure` | official | Apply a Salesforce sandbox post-copy automation JSON config against a target org |
| `commerce-b2b-open-code-components-integrate` | official | Integrate Salesforce B2B Commerce open source components from GitHub into B2B Commerce stores |
| `commerce-b2b-open-code-components-replace` | official | Replace OOTB (out-of-the-box) B2B Commerce components with open source equivalents in site metadata content.json files, or look up the equivalent open |
| `commerce-b2b-store-create` | official | Interactive workflow to create Commerce B2B Stores and retrieve storefront metadata |
| `data360-code-extension-generate` | official | Develop and deploy Data Cloud Code Extensions using SF CLI plugin |
| `data360-schema-get` | official | Retrieve Data Lake Object (DLO) and Data Model Object (DMO) schema information from Salesforce Data Cloud using REST APIs |
| `design-systems-slds-apply` | official | Apply SLDS-compliant UI using the correct blueprints, styling hooks, utility classes, and icons |
| `design-systems-slds-validate` | official | Audit Lightning Web Components for SLDS design-system compliance and produce a scored quality report |
| `design-systems-slds2-migrate` | official | Migrate Lightning Web Components from SLDS 1 to SLDS 2 by running the SLDS linter and fixing violations |
| `drawio-skill` | third-party | Create and edit draw.io/diagrams.net diagrams as editable `.drawio` files |
| `dx-apexguru-scan` | official | Run an ApexGuru performance scan on a Salesforce Apex project via the ApexGuru SFAP Scan API. Zips the project's Apex (any layout), submits it, polls  |
| `dx-app-analytics-query` | official | ISV App Analytics metadata types — AppAnalyticsQueryRequest and AppAnalyticsSettings |
| `dx-code-analyzer-configure` | official | Set up, configure, and troubleshoot Salesforce Code Analyzer for any project |
| `dx-code-analyzer-custom-rule-create` | official | Create custom Code Analyzer rules for Regex (pattern matching), PMD (XPath/AST for Apex and metadata XML), and ESLint (LWC/JavaScript/TypeScript) |
| `dx-code-analyzer-run` | official | Run Salesforce Code Analyzer to scan code for security, performance, best practice, and code style violations |
| `dx-devops-conflict-resolve` | official | Use this skill to diagnose and resolve what blocks a DevOps Center promotion of a work item's feature branch: Git merge conflicts and deployment failu |
| `dx-devops-pipeline-manage` | official | Use this skill to manage the full lifecycle of a DevOps Center pipeline — list all pipelines, get a single pipeline's details, create a new pipeline l |
| `dx-devops-project-manage` | official | Use to list, view, or manage DevOps Center projects in a Salesforce org — show all projects, create a project, or update an existing project's name, d |
| `dx-devops-promote` | official | Use this skill to drive the full DevOps Center promotion workflow for work items and pipeline stages — validate preconditions, prepare work items, opt |
| `dx-devops-request-status` | official | Use this skill to poll the status of an asynchronous DevOps Center request — a promotion or deploy operation |
| `dx-devops-test-failures-analyze` | official | Analyzes DevOps Center test failures and Code Analyzer violations in plain language — failure category, offending file/class/method/line, rule violate |
| `dx-devops-test-pipeline-configure` | official | Configures DevOps Center pipeline testing infrastructure: enables a test provider so its suites become available, re-syncs a configured provider to pu |
| `dx-devops-test-suite-assignments-configure` | official | Recommends and manages DevOps Center test suite assignments for pipeline stages |
| `dx-devops-test-suite-run` | official | Runs DevOps Center test suites on a pipeline stage (Pre-Promote, Post-Promote, or Review event) end to end: triggers async execution via the Connect A |
| `dx-devops-work-item-manage` | official | Use this skill to manage the full lifecycle of DevOps Center work items — list, create, update, commit changes, perform status transitions, and create |
| `dx-lifecycle-center` | official | Lifecycle Center for DX Inspector and Builder Central |
| `dx-org-analyze` | official | Compare two Salesforce orgs side-by-side and produce a comparison report with drift score, or analyze a single org to produce an inventory covering me |
| `dx-org-devhub-configure` | official | Enable Dev Hub on a Salesforce org, view its status and scratch org allocation, or read its current DevHubSettings preferences, using the Salesforce C |
| `dx-org-manage` | official | Use to EXECUTE Salesforce org operations immediately via the sf CLI (this skill runs them, it does NOT generate scripts): create scratch orgs (from ed |
| `dx-org-permission-set-assign` | official | ALWAYS USE THIS SKILL to assign permission sets to org users |
| `dx-org-shape-manage` | official | ALWAYS USE THIS SKILL to create, list, or delete org shapes |
| `dx-org-snapshot-manage` | official | ALWAYS USE THIS SKILL to create, check the status of, list, or delete scratch org snapshots |
| `dx-org-switch` | official | Switches the active Salesforce org (default target-org) using the Salesforce CLI. Use whenever someone wants to change which org CLI commands run agai |
| `dx-org-trial-expiration-check` | official | Check when Salesforce orgs expire (or already expired) and what to do about it, for one org, the default org, or across all authenticated orgs, using  |
| `dx-packaging-convert-1gp-to-2gp-create` | official | Use this skill when users want to convert a managed-released 1GP package to a 2GP package with `sf package convert`, verify the converted package vers |
| `dx-packaging-move-to-2gp-migrate` | official | Use this skill when users want to finalize the irreversible, one-way Move-to-2GP cutover for a converted 1GP managed package — afterward, new major/mi |
| `dx-packaging-push-upgrade-configure` | official | Use this skill to plan, schedule, and monitor Salesforce package push upgrades from a Dev Hub |
| `dx-pkg-post-install-configure` | official | Use this skill to automate managed package post-install configuration |
| `dx-project-create` | official | Scaffold a Salesforce DX project from any template (standard, agent, analytics, React/Angular/Vue app), move the session in, connect an org, enable so |
| `dx-scratch-def-configure` | official | Drafts a schema-valid Salesforce DX scratch-def from natural language |
| `experience-accessibility-validate` | official | Use this skill to determine whether a Lightning Web Component (LWC) is accessible and meets WCAG accessibility guidelines |
| `experience-aura-lwc-migrate` | official | Use this skill to analyze a Salesforce Aura component bundle (.cmp, .app, .evt, .intf, Controller.js, Helper.js, Renderer.js) and produce a framework- |
| `experience-cms-brand-apply` | official | Extracts, retrieves, and applies CMS brand guidelines (voice, tone, style, colors, typography) to generated content |
| `experience-cms-brand-create` | official | Author a Salesforce Digital Experience brand (a \"brand.json\") so the VS Code Brand Toolkit can load, edit, and preview it |
| `experience-cms-content-generate` | official | Creates, edits, and publishes Salesforce CMS content of any kind — any domain, any topic |
| `experience-cms-content-render` | official | Renders, embeds, or displays existing Salesforce CMS content in a React or Angular uiBundle app: installs the CMS toolkit, registers a typed reference |
| `experience-cms-content-type-generate` | official | Salesforce CMS ContentTypeBundle creation skill |
| `experience-design-validate` | official | Use this skill to run a visual-craft audit of a rendered UI and produce an evidence-grounded Craft Report across Useful, Usable, Reliable, Coherent, a |
| `experience-lds-best-practices-apply` | official | Use when reviewing or implementing Lightning Data Service best practices in an LWC (.js, .html, .js-meta.xml) — UIAPI vs Apex, refreshApex / notifyRec |
| `experience-lds-data-requirements-generate` | official | Use when a Lightning Web Component data need is described in ambiguous natural language — turn \"get contact info\" or \"show account data\" into a cl |
| `experience-lds-graphql-generate` | official | Use ALWAYS when a prompt mentions GraphQL, lightning/uiGraphQLApi, @wire(graphql, ...), or gql template tags in an LWC context — even if the surface a |
| `experience-lwc-accessibility-jest-run` | official | Use ALWAYS when running Sa11y accessibility Jest tests for an LWC — locally before pushing, producing the command(s), running one file vs a suite, sel |
| `experience-lwc-base-components-integrate` | official | Pick the right Lightning Base Component (`lightning-*`) for a given UI task, retrieve its full API (props, methods, events, slots) from the bundled pe |
| `experience-lwc-design-generate` | official | Use when you need to create a brand new Lightning Web Component from a Figma design, a Product Requirements Document, or another design artifact — orc |
| `experience-lwc-generate` | official | Lightning Web Components with PICKLES methodology and 165-point scoring |
| `experience-lwc-legacy-migrate` | official | Migrate legacy Salesforce UI stacks onto modern LWC — Aura → LWC conversion completeness verification and Lightning Out Beta → Lightning Out 2.0 host- |
| `experience-lwc-rtl-validate` | official | Use this skill to review a Lightning Web Component (.html, .js, .css files) for right-to-left (RTL) internationalization correctness, producing a find |
| `experience-lwc-runtime-observe` | official | Use when running Salesforce Lightning Preview for an app or a single LWC component to extract the runtime DOM for inspection |
| `experience-lwc-security-validate` | official | Use this skill as THE specialized Lightning Web Security (LWS) validator for a Lightning Web Component bundle (`.js`, `.ts`, `.html`, `.css`, `.js-met |
| `experience-lwc-typescript-migrate` | official | Use when converting an existing JavaScript Lightning Web Component (.js, .html, .css) to TypeScript with full type annotations and a matching `.d.ts`  |
| `experience-lwc-widget-assess` | official | Assess whether a specific Lightning web component can serve its user's purpose as an HXL declarative widget |
| `experience-lwc-widget-migrate` | official | Convert a specific existing Lightning web component (LWC) into a declarative HXL / Agentforce widget, end to end |
| `experience-lwr-site-generate` | official | Creates, modifies, or manages Salesforce Experience Cloud LWR sites via DigitalExperience metadata |
| `experience-portal-create` | official | Create / provision / set up a NEW Digital Experience (Communities) / Experience Cloud site — employee service, IT support, help desk, HR, customer, an |
| `experience-search-coordinate` | official | Searches for and retrieves existing content and media (articles, blogs, news, FAQs, events, products, images, logos, icons, photos, graphics, banners, |
| `experience-ui-bundle-2gp-deploy` | official | MUST activate when the user wants to package, distribute, or install/upgrade/uninstall/promote a UI Bundle as a Salesforce second-generation (2GP) pac |
| `experience-ui-bundle-agentforce-client-generate` | official | Use this skill when the user asks to add, embed, integrate, configure, style, or remove an agent, chatbot, chat widget, conversation client, or AI ass |
| `experience-ui-bundle-app-coordinate` | official | MUST activate when the user wants to build, create, or generate a React application, React app, web application, single-page application (SPA), or fro |
| `experience-ui-bundle-custom-app-generate` | official | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves creating or configuring a Custom Application for hosting a  |
| `experience-ui-bundle-deploy` | official | MUST activate when the project has a uiBundles/*/src/ directory and the task involves deploying to an org or post-deploy org setup |
| `experience-ui-bundle-features-generate` | official | MUST activate when the project contains a uiBundles/*/src/ directory (React or Angular) and the user wants to add a pre-built feature — such as authen |
| `experience-ui-bundle-file-upload-generate` | official | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves uploading, attaching, or dropping files |
| `experience-ui-bundle-frontend-generate` | official | MUST activate before editing ANY file under uiBundles/*/src/ (or the bundle's index.html) for visual or UI changes to an EXISTING app — pages, compone |
| `experience-ui-bundle-localize` | official | MUST activate to localize / internationalize a uiBundles/*/src/ project (React or Angular): extract hardcoded user-facing strings into Custom Labels,  |
| `experience-ui-bundle-metadata-generate` | official | Use this skill when adding a front-end React or Angular UI bundle to an EXISTING SFDX project, or configuring UI bundle metadata and config files |
| `experience-ui-bundle-mfa-configure` | official | Configure Multi-Factor Authentication (MFA) for Salesforce Experience Site users |
| `experience-ui-bundle-project-generate` | official | Generates a minimal, ready-to-develop SFDX starter project from template instead of hand-scaffolding files |
| `experience-ui-bundle-salesforce-data-access` | official | MUST activate whenever a uiBundles/*/src/ project reads, writes, or displays Salesforce data — INCLUDING building a page, list, table, card grid, dash |
| `experience-ui-bundle-site-generate` | official | MUST activate when the project contains a uiBundles/*/src/ directory and the task involves creating or configuring site infrastructure |
| `external-diagram-mermaid-generate` | official | Salesforce architecture diagrams using Mermaid with ASCII fallback |
| `integration-connectivity-connected-app-configure` | official | Salesforce Connected Apps and External Client Apps OAuth configuration with 120-point scoring |
| `integration-connectivity-generate` | official | Salesforce integration architecture and runtime plumbing with 120-point scoring |
| `integration-eventing-cdc-configure` | official | Use to enable Salesforce Change Data Capture (CDC) on a standard or custom object, configure a custom event channel, set a filter expression, or add e |
| `integration-eventing-subscription-configure` | official | Create, read, update, and delete ManagedEventSubscription metadata in Salesforce |
| `mobile-apps-create` | official | The entry point for building any Salesforce native mobile app on iOS or Android |
| `mobile-platform-native-capabilities-integrate` | official | Build a Salesforce LWC that uses native mobile device capabilities — barcode scanner, biometrics, location, NFC, calendar, contacts, document scanner, |
| `mobile-platform-offline-validate` | official | Review a Lightning Web Component for **mobile offline** compatibility — the Komaci offline static analyzer that pre-primes the data graph for Salesfor |
| `omnistudio-callable-apex-generate` | official | Salesforce Industries Common Core (OmniStudio/Vlocity) Apex callable generation and review skill with 120-point scoring |
| `omnistudio-datamapper-generate` | official | OmniStudio Data Mapper (formerly DataRaptor) creation and validation with 100-point scoring |
| `omnistudio-datapacks-deploy` | official | Salesforce Industries DataPack deployment automation using Vlocity Build |
| `omnistudio-dependencies-analyze` | official | Cross-cutting OmniStudio analysis skill for namespace detection, dependency visualization, and impact analysis across OmniScripts, FlexCards, Integrat |
| `omnistudio-epc-catalog-generate` | official | Salesforce Industries CME EPC product-modeling skill for Product2-based catalog creation |
| `omnistudio-flexcard-generate` | official | OmniStudio FlexCard creation and validation with 130-point scoring |
| `omnistudio-integration-procedure-generate` | official | OmniStudio Integration Procedure creation and validation with 110-point scoring |
| `omnistudio-omniscript-generate` | official | OmniStudio OmniScript creation and validation with 120-point scoring |
| `platform-agentexchange-partner-offers-configure` | official | Enable or disable the org preference that controls whether a Salesforce org can receive partner offers from the Transactable Marketplace |
| `platform-agenticsetup-categories-get` | official | Get agentic setup prompt categories from a connected Salesforce org using the Connect API via sf api request rest |
| `platform-apex-anonymous-run` | official | Runs anonymous Apex against the connected org (.apex file or pasted snippet), capturing the debug log, surfacing errors |
| `platform-apex-generate` | official | Primary Apex authoring skill for class generation, refactoring, and review |
| `platform-apex-logs-debug` | official | Salesforce debug log analysis and troubleshooting with 100-point scoring |
| `platform-apex-test-generate` | official | Use to generate and validate Apex test classes with TestDataFactory patterns, bulk testing (251+ records), mocking, assertions, and disciplined test-f |
| `platform-apex-test-run` | official | Apex test execution, coverage analysis, and test-fix loops with 120-point scoring |
| `platform-architecture-analyze` | official | Use when the developer asks to \"review the architecture\", \"run a Well-Architected check\", \"audit this project\", \"is this project well-architect |
| `platform-custom-application-generate` | official | Use this skill when users need to create or configure tab-based Salesforce Custom Applications with navigation, branding, and action overrides |
| `platform-custom-field-generate` | official | Use when users create, generate, or validate Salesforce Custom Field metadata |
| `platform-custom-lightning-type-generate` | official | Use this skill when users need to create Custom Lightning Types (CLTs) for Einstein Agent actions or structured input/output schemas |
| `platform-custom-metadata-type-generate` | official | Use to create, generate, or validate Salesforce Custom Metadata Type metadata — the __mdt object, fields, and deployable records |
| `platform-custom-object-generate` | official | Use when users create, generate, or validate Salesforce Custom Object metadata |
| `platform-custom-report-type-generate` | official | Use to create, generate, or validate Salesforce Custom Report Type metadata |
| `platform-custom-setting-generate` | official | Use to create, generate, or validate Salesforce Custom Setting metadata |
| `platform-custom-tab-generate` | official | Use this skill when users need to create or configure Salesforce Custom Tabs |
| `platform-data-and-tooling-api-context-get` | official | Authoritative field/schema reference for 2130 STANDARD Salesforce objects — sObject and Tooling field API names, types, properties (filterable/sortabl |
| `platform-data-manage` | official | Salesforce data operations with 130-point scoring |
| `platform-datamask-run` | official | Data Mask end-to-end operation on a sandbox: configure a masking policy over PII, run the masking job, poll it to completion, report masked-record res |
| `platform-dataspace-access-configure` | official | Grant a permission set Data Cloud access two ways: (1) data-space (dataspace) access via dataspaceScopes in PermissionSet XML (MDAPI) — create, change |
| `platform-destructive-deploy` | official | Execute the destructiveChanges.xml delete-and-deploy workflow against a Salesforce org |
| `platform-docs-get` | official | Official Salesforce documentation retrieval skill |
| `platform-dsar-policy-manage` | official | Configure, run, and audit DsarPolicy Right-to-Portability exports end to end: author the data map over a subject's related records, resolve a request' |
| `platform-encryption-configure` | official | Configure Salesforce Shield Platform Encryption — generate deployable encryption settings and encrypted-field metadata, and answer key-model and lifec |
| `platform-environment-validate` | official | Validate and configure the local Salesforce development environment |
| `platform-flexipage-generate` | official | Use when users create, generate, modify, or validate Salesforce Lightning pages (FlexiPages) |
| `platform-headless-360-integrate` | official | Read org state and change Setup through the Headless 360 (H360) MCP tools discover, describe, dispatch_readonly, and dispatch |
| `platform-lightning-app-coordinate` | official | Build complete Salesforce Lightning Experience applications from natural language descriptions |
| `platform-lightning-type-widget-coordinate` | official | Orchestrate Apex-backed Lightning Type + HXL widget generation |
| `platform-list-view-generate` | official | Use this skill when users need to create, generate, or validate Salesforce List View metadata |
| `platform-manifest-generate` | official | Use to generate a package.xml (and optionally destructiveChanges.xml / Pre / Post) from a source dir, a component list, or org introspection |
| `platform-mcp-tool-widget-coordinate` | official | Orchestrate object-based Lightning Type + HXL widget generation to render the output of a custom MCP server tool backed by an Apex Invocable Action |
| `platform-metadata-api-context-get` | official | REQUIRED companion for Salesforce metadata generation — load this schema/API-context skill in the SAME turn as ANY metadata generator (if you load a g |
| `platform-metadata-deploy` | official | Salesforce DevOps automation using sf CLI v2 |
| `platform-metadata-discovery-get` | official | Use before creating, changing, or writing code against Salesforce metadata, to find out what already exists in the org with the right tool |
| `platform-metadata-grounding-get` | official | Find metadata that already exists in a Salesforce org by meaning, when you do not know its exact API name |
| `platform-metadata-retrieve` | official | ALWAYS USE THIS SKILL to retrieve metadata from an org to your local project with sf project retrieve start |
| `platform-models-api-configure` | official | Configure (or troubleshoot) an AI coding agent or CLI to route through the Salesforce Models API using a signed OrgJWT. Use this skill when pointing a |
| `platform-permission-set-generate` | official | Generates correct, deployable Salesforce permission set metadata (PermissionSet XML) with object, field, user, and app permissions |
| `platform-policy-rule-generate` | official | THE skill for creating a Data Cloud / Data Governance access policy — authors and deploys a PolicyRuleDefinitionSet + PolicyRuleDefinition pair (CRUD) |
| `platform-report-generate` | official | Use when users create, generate, or validate Salesforce Lightning Report metadata (.report-meta.xml) — tabular, summary, matrix, or joined reports wit |
| `platform-role-hierarchy-apply` | official | Bulk-realign an existing Salesforce UserRole hierarchy from an external org-chart artifact (PDF, xlsx, or plain-text list of role-and-parent pairs) in |
| `platform-salesforce-connect-adapter-generate` | official | Custom Apex adapter generation for Salesforce Connect — connects any external REST API to Salesforce as live, queryable External Objects without ETL o |
| `platform-sandbox-configure` | official | MUST USE this skill for ANY sandbox request — including simply getting a sandbox's details, status, license type, or pending-activation state by name  |
| `platform-sharing-owd-configure` | official | Use when the user wants to retrieve or update Organization-Wide Default (OWD) sharing settings for Salesforce objects |
| `platform-sharing-rules-generate` | official | Use when users get, create, edit, delete, or retrieve Salesforce Sharing Rules metadata for record-level access |
| `platform-soql-query` | official | Use when the user needs SOQL/SOSL authoring or optimization: natural-language-to-query generation, relationship queries, aggregates, query-plan/select |
| `platform-tracing-agentforce-configure` | official | Generate AgentforcePlatformTracingSettings metadata to enable or disable Agentforce agent execution trace spans flowing to Data Cloud |
| `platform-tracing-configure` | official | Generate EventSettings metadata to enable or disable Platform Tracing (TraceSpanEvent publishing) in Event Monitoring |
| `platform-trial-org-create` | official | Use this skill to create a Salesforce trial, developer, or Trialforce org against an already-authenticated host org, the same way a developer/Trialfor |
| `platform-trust-archive-manage` | official | ALWAYS USE THIS SKILL for anything involving Salesforce Archive (also called Trusted Services Archive) — search, view, unarchive, analyze, mask, and e |
| `platform-validation-rule-generate` | official | Use this skill when users need to create, modify, or validate Salesforce Validation Rules |
| `platform-value-set-generate` | official | Use to create, generate, or validate a Salesforce GlobalValueSet (reusable picklist shared across fields) or customize a StandardValueSet (built-in pi |
| `platform-widget-generate` | official | Use this skill to author a complete HXL WidgetBundle (UEM body + schema.json + -meta.xml) |
| `sf-agentforce` | community | \| |
| `sf-apex` | community | \| |
| `sf-data` | community | \| |
| `sf-debug` | community | \| |
| `sf-deploy` | community | \| |
| `sf-diagram` | community | \| |
| `sf-docs` | community | \| |
| `sf-eval` | community | \| |
| `sf-find` | community | \| |
| `sf-flow` | community | \| |
| `sf-integration` | community | \| |
| `sf-lwc` | community | \| |
| `sf-omnistudio` | community | \| |
| `sf-permissions` | community | \| |
| `sf-schema` | community | \| |
| `sf-security` | community | \| |
| `sf-soql` | community | \| |
| `sf-test` | community | \| |
