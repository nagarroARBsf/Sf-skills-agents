# Salesforce discovery questions

Use these to find gaps the sources did not cover. Raise only the ones that affect this phase's
scope, as `Q-nn` in BRD §17, phrased for a business reader. Do not paste this list into the BRD.
Each heading names the Appendix D subsection its answers feed; an unanswered question leaves the
matching Appendix D row `[TBD]`.

## Org and licences (D.8, D.9)
- Which Salesforce edition and clouds are licensed (Sales, Service, Experience, Marketing, Data
  Cloud, Agentforce, Industries)? New org or existing org with other teams?
- How many users per persona, and which licence types (full, Platform, Experience Cloud)?
- Single or multiple currencies? Languages? Time zones?
- Which limits are already under pressure in the existing org (data or file storage, daily API
  requests, asynchronous jobs, email sends)?

## Data (D.1, D.6)
- Volumes per main entity today and growth per year (flag > 1M records/object as large data
  volume).
- What history must migrate, from which systems, and how dirty is it (duplicates, missing owners)?
- Who owns data quality after go-live? Who owns each main entity's records (drives ownership and
  sharing)?
- How do the main entities relate (one-to-many, many-to-many, must children be deleted with the
  parent)?
- Retention, archival and deletion rules (legal hold, GDPR right to erasure)?

## Security and sharing (D.5)
- Who must **not** see what (by role, region, team, account ownership)?
- Is the default "everyone sees everything" acceptable? (drives OWD)
- External users (partners, customers) needing access?
- SSO / MFA / identity provider?
- Regulated or sensitive data (PII, health, financial)? Encryption or audit requirements
  (Shield)?

## Process and automation (D.2)
- What triggers each step? Who approves what, at which thresholds?
- What must be blocked vs merely highlighted? (validation rules block; see feasibility F1)
- Time-based behaviour (escalations, reminders, overdue flags)?
- Who will maintain each automation after go-live (administrators or developers)? How often do
  the rules change?
- What automation already exists on the affected entities in the current org?

## Integrations (D.4)
- Which systems hold master data (customer, product, price, order)?
- For each interface: direction, frequency, acceptable latency, volume per run and per day,
  authentication method the other system supports, and who is told and what happens to the record
  when a message fails.
- Middleware in place (MuleSoft, Boomi, Azure)? API limits or security policies?

## Reporting (D.7)
- Which decisions does each dashboard support? Who looks at it and how often?
- Forecasting basis (stage, category, territory, product)?
- Any reporting outside Salesforce (BI tools, data warehouse)?

## UX and channels (D.3)
- Desktop, Salesforce mobile app, offline needs?
- Accessibility requirements (WCAG level)?
- Branding constraints for any custom or customer-facing UI?

## Delivery and environments (D.9)
- Go-live date and fixed constraints (fiscal year, events)?
- Environments available (sandboxes), release process, DevOps tooling?
- Training and change management owner?
- Release windows, change freezes, approval boards the deployment must pass?

## AppExchange and managed packages (D.10)
- Which managed packages are installed in the org today, and which touch the entities in scope?
- Is buying an AppExchange product acceptable for this need, or is there a build-only policy?
- Any package licences that limit which users can use a feature?
