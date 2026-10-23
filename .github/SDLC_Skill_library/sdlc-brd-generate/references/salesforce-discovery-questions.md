# Salesforce discovery questions

Use these to find gaps the sources did not cover. Raise only the ones that affect this phase's
scope, as `Q-nn` in BRD §17, phrased for a business reader. Do not paste this list into the BRD.

## Org and licences
- Which Salesforce edition and clouds are licensed (Sales, Service, Experience, Marketing, Data
  Cloud, Agentforce, Industries)? New org or existing org with other teams?
- How many users per persona, and which licence types (full, Platform, Experience Cloud)?
- Single or multiple currencies? Languages? Time zones?

## Data
- Volumes per main entity today and growth per year (flag > 1M records/object as large data
  volume).
- What history must migrate, from which systems, and how dirty is it (duplicates, missing owners)?
- Who owns data quality after go-live?
- Retention, archival and deletion rules (legal hold, GDPR right to erasure)?

## Security and sharing
- Who must **not** see what (by role, region, team, account ownership)?
- Is the default "everyone sees everything" acceptable? (drives OWD)
- External users (partners, customers) needing access?
- SSO / MFA / identity provider?
- Regulated or sensitive data (PII, health, financial)? Encryption or audit requirements
  (Shield)?

## Process and automation
- What triggers each step? Who approves what, at which thresholds?
- What must be blocked vs merely highlighted? (validation rules block; see feasibility F1)
- Time-based behaviour (escalations, reminders, overdue flags)?

## Integrations
- Which systems hold master data (customer, product, price, order)?
- For each interface: direction, frequency, acceptable latency, volume, error handling owner.
- Middleware in place (MuleSoft, Boomi, Azure)? API limits or security policies?

## Reporting
- Which decisions does each dashboard support? Who looks at it and how often?
- Forecasting basis (stage, category, territory, product)?
- Any reporting outside Salesforce (BI tools, data warehouse)?

## UX and channels
- Desktop, Salesforce mobile app, offline needs?
- Accessibility requirements (WCAG level)?
- Branding constraints for any custom or customer-facing UI?

## Delivery
- Go-live date and fixed constraints (fiscal year, events)?
- Environments available (sandboxes), release process, DevOps tooling?
- Training and change management owner?
