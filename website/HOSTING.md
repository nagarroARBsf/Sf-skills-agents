# Docs site hosting: handoff notes

Read this at the start of a session that touches the website, Azure or deployment of the docs site.
Last verified: 2026-11-13.

The client showcase copy of this site is `sf-sdlc-client-website/` (resource group `rg-salesforce-sdlc-client`); see its own HOSTING.md.

## What is hosted
The public site for the Nagarro Salesforce SDLC kit. The source is `website/` (layout and how to change it:
[README.md](README.md)). The site is generated into `site/`, which is git-ignored. Never edit `site/` by hand.

## Azure resources

| Item | Value |
|---|---|
| Service | Azure Static Web Apps, **Free** plan |
| App name | `salesforce-sdlc-docs` |
| Resource group | `rg-salesforce-sdlc` (region: Central India) |
| App region | East Asia |
| Default URL | https://nice-plant-00b857600.8.azurestaticapps.net |
| Subscription | `ARB azure` |
| Tenant | `a45fe71a-f480-4e42-ad5e-aff33165aa35` |
| Other resources | `appi-sfsdlc-web` and `log-sfsdlc-web` (visitor analytics, 2026-11-13); `ecs-sfsdlc-web` and `acs-sfsdlc-web` (sign-up emails, 2026-11-15). See the sections below. |
| Custom domain | Planned: `www.nagarro-salesforce-sdlc.com`. **Not attached yet.** Status: waiting for Nagarro IT to buy it. |

## How files are stored
Everything, including the two videos (marketing overview and setup tutorial, served from the site since
2026-11-19), is uploaded as static files inside the Static Web App; see the Videos section of
[README.md](README.md). Site size is about 150 MB with the videos. The app serves them under these paths:

| URL path | Built from |
|---|---|
| `/` | `website/src/index.html` with its partials, sections and snippets |
| `/styles/…`, `/scripts/…` | `website/src/styles/`, `website/src/scripts/` |
| `/assets/…` | `website/assets/` (diagrams, images, video posters) and the videos from `website/media/` |
| `/api/lead` | `website/api/lead/` (managed Azure Function, sign-up form) |
| `/downloads/sf-sdlc-plugin.zip` | zip of `plugins/sf-sdlc/` |
| `/downloads/claude-folder.zip` | zip of `.claude/` |
| `/staticwebapp.config.json` | `website/staticwebapp.config.json` (page fallback, MIME types, caching, headers, API runtime) |

`website/media/` (git-ignored) is copied only for videos the page references as `assets/<name>.mp4`, so
**the videos must be in `website/media/` on the machine that builds**, or the build warns and they will not play.
The build also prints the total size: the Free plan allows 250 MB per site and 100 GB of downloads a month.
Video streaming counts toward that 100 GB: a full tutorial view is about 52 MB and a full marketing view about 66 MB, so roughly 1,500 full marketing views a
month fit (fewer for the tutorial). Watch the `video_play` events (below) and move to the Standard plan if it gets close.

## Build and deploy

```bash
# 1. Regenerate the plugin if .claude/ changed
python3 scripts/build-claude-plugin.py

# 2. Build site/ (HTML, assets, both videos from website/media/, both zips, config)
python3 scripts/build-site.py

# 3. Check that the Azure login works
az account show

# 4. Deploy (the token stays masked; never print it)
TOKEN=$(az staticwebapp secrets list --name salesforce-sdlc-docs \
  --resource-group rg-salesforce-sdlc --query properties.apiKey -o tsv)
npx --yes @azure/static-web-apps-cli deploy ./site \
  --api-location ./website/api --api-language node --api-version 20 \
  --deployment-token "$TOKEN" --env production
```

Always rebuild (step 2) before deploying. An earlier deploy went out stale because `site/` was not rebuilt.

## Visitor analytics

| Item | Value |
|---|---|
| Application Insights | `appi-sfsdlc-web` (Central India, workspace-based) |
| Log Analytics workspace | `log-sfsdlc-web`: Pay-as-you-go, **daily cap 0.05 GB**, retention 90 days |
| Connection string | in `website/site.config.json` (`analytics.connectionString`). It is not a secret: every visitor's browser receives it. |
| Cookies | none (`disableCookiesUsage`); Do Not Track and Global Privacy Control are respected |
| IP addresses | masked by Application Insights (default) |

**Cost.** Log Analytics ingestion is free for the first 5 GB a month per billing account, then US$3.22/GB
(Central India, checked 2026-11-13 on prices.azure.com). A visit sends roughly 20-40 KB, so 5 GB is
about 150,000 visits. The free 5 GB is shared with anything else on Nagarro's billing account, so the
daily cap (0.05 GB, about 1,600 visits a day) limits the worst case to about US$5 a month. When the cap
is reached, data stops until the next day (the site keeps working). Raise it with
`az monitor log-analytics workspace update -g rg-salesforce-sdlc -n log-sfsdlc-web --quota <GB>`.

**Where to see the numbers.** Azure portal → `appi-sfsdlc-web` → *Usage → Users / Events*, or
*Logs* with these queries:

```kusto
// visits and engaged visits per day
union pageViews, customEvents
| where timestamp > ago(30d)
| summarize visits = countif(itemType == "pageView"), engaged = countif(name == "engaged") by bin(timestamp, 1d)
| order by timestamp desc

// downloads by file, video plays, sign-ups
customEvents | where timestamp > ago(30d) and name in ("download", "video_play", "video_complete", "video_chapter", "lead_submitted")
| summarize count() by name, tostring(customDimensions.file)

// which sections people read
customEvents | where timestamp > ago(30d) and name == "section_view"
| summarize readers = count() by section = tostring(customDimensions.section) | order by readers desc

// where visitors come from (country, referring site)
pageViews | where timestamp > ago(30d)
| summarize visits = count() by client_CountryOrRegion, referrer = tostring(customDimensions.referrerHost)
| order by visits desc
```

Without cookies every visit counts as a new user, so read "users" as visits.

## Sign-up form (emails the team)

"Talk to us", the corner nudge and the download prompt post to `/api/lead` (`website/api/lead/`), a managed
Azure Function that emails each sign-up to **arb.salesforce@nagarro.com** through Azure Communication
Services Email. The email is the record: nothing is stored. Reply-To is the visitor, so replying in Outlook
answers them directly. Switched on with `lead.enabled: true` in `website/site.config.json` (2026-11-15).

| Item | Value |
|---|---|
| Email Communication Service | `ecs-sfsdlc-web` (data location India) |
| Sender domain | `AzureManagedDomain` (free, Azure-managed): sends from `DoNotReply@7962bc4c-3763-48b0-a8af-6a992e3eb03a.azurecomm.net` |
| Communication Service | `acs-sfsdlc-web` (`acs-sfsdlc-web.india.communication.azure.com`), linked to the domain |
| Static Web App app settings | `ACS_CONNECTION_STRING`, `LEAD_EMAIL_FROM`, `LEAD_EMAIL_TO`. Never in git; list names with `az staticwebapp appsettings list -n salesforce-sdlc-docs -g rg-salesforce-sdlc --query "keys(properties)"` |

**Cost.** US$0.00025 per email plus US$0.00012 per MB (Microsoft's email pricing page); about US$0.25 per
1,000 sign-ups. No monthly fee.

**If sign-up emails do not arrive:** check Junk in the mailbox and mark the sender "Not junk" (or ask IT to
allow `*.azurecomm.net` for this address). Azure-managed domains have low sending limits, which is fine for
sign-ups; for higher volume or a `@nagarro-salesforce-sdlc.com` sender, add a custom domain to
`ecs-sfsdlc-web` (needs DNS records from IT). To change the recipient:
`az staticwebapp appsettings set -n salesforce-sdlc-docs -g rg-salesforce-sdlc --setting-names LEAD_EMAIL_TO=<address> -o none`.
If the access key is rotated (`az communication regenerate-key`), set `ACS_CONNECTION_STRING` again.

Storage was not used: on 2026-11-13 a storage account was denied by the Nagarro policy "Restrict Storage
Account network access from all networks". Do not work around that policy.

## If the Azure login expires
Error `AADSTS50173`. Fix:
```bash
az logout
az login --tenant "a45fe71a-f480-4e42-ad5e-aff33165aa35"
```

## Attach the custom domain (after Nagarro buys it)
1. Ask IT to add a **CNAME**: `www` → `nice-plant-00b857600.8.azurestaticapps.net`.
2. Ask IT to redirect the bare domain to `https://www.nagarro-salesforce-sdlc.com`.
3. Run `az staticwebapp hostname set --name salesforce-sdlc-docs --resource-group rg-salesforce-sdlc --hostname www.nagarro-salesforce-sdlc.com`
4. Wait for DNS and the free HTTPS certificate, then check the site loads over https.
5. Replace any hard-coded `azurestaticapps.net` links in `website/src/`, rebuild and redeploy.
   The old URL keeps working.

## Rules
- Never commit tokens or the `.env` file.
- `main` is protected. Work on a feature branch.
- The site is deployed from this machine by hand. There is no CI deploy.
