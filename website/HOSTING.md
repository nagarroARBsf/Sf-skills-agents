# Docs site hosting: handoff notes

Read this at the start of a session that touches the website, Azure or deployment of the docs site.
Last verified: 2026-11-13.

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
| Other resources | `appi-sfsdlc-web` (Application Insights) and `log-sfsdlc-web` (Log Analytics workspace) for visitor analytics, created 2026-11-13. See "Visitor analytics" below. |
| Custom domain | Planned: `www.nagarro-salesforce-sdlc.com`. **Not attached yet.** Status: waiting for Nagarro IT to buy it. |

## How files are stored
Everything, including the zips and the video, is uploaded as static files inside the Static Web App.
No separate storage is used. The app serves them under these paths:

| URL path | Built from |
|---|---|
| `/` | `website/src/index.html` with its partials, sections and snippets |
| `/styles/…`, `/scripts/…` | `website/src/styles/`, `website/src/scripts/` |
| `/assets/…` | `website/assets/` (diagrams and images) |
| `/assets/sf_sdlc_tutorial.mp4` | `website/media/sf_sdlc_tutorial.mp4` (about 60 MB; git-ignored) |
| `/api/lead` | `website/api/lead/` (managed Azure Function, sign-up form) |
| `/downloads/sf-sdlc-plugin.zip` | zip of `plugins/sf-sdlc/` |
| `/downloads/claude-folder.zip` | zip of `.claude/` |
| `/staticwebapp.config.json` | `website/staticwebapp.config.json` (page fallback, MIME types, caching, headers, API runtime) |

Videos live in `website/media/`, which is git-ignored. The build warns if a video the page uses is missing.
The build also prints the total size: the Free plan allows 250 MB per site and 100 GB of downloads a month.

## Build and deploy

```bash
# 1. Regenerate the plugin if .claude/ changed
python3 scripts/build-claude-plugin.py

# 2. Build site/ (HTML, assets, video, both zips, config)
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
customEvents | where timestamp > ago(30d) and name in ("download", "video_play", "video_complete", "lead_submitted")
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

## Sign-up form (switched off)

The form, the "Talk to us" button, the corner nudge and the download prompt are built and deployed but
hidden (`lead.enabled: false` in `website/site.config.json`). The function `website/api/lead` is
deployed and answers 503 until it has somewhere to store sign-ups.

Blocked by policy: on 2026-11-13 creating a storage account (`sfsdlcleads`) was denied by the Nagarro
management-group policy **"Restrict Storage Account network access from all networks"**
(`restrict-storage-network-access`, effect deny). Storage accounts must not be reachable from the
internet, and the Free plan's managed function has no fixed IP or private network to allow in. Do not
work around the policy. To turn the form on, one of:

1. Nagarro IT grants an exemption for one storage account used only through an add-only SAS token; then
   create the account and table `leads`, set the Static Web App app setting `LEADS_TABLE_SAS_URL`
   (`https://<account>.table.core.windows.net/leads?<SAS, permission a only>`, never in git; the SAS
   expires, so note the date here), and set `lead.enabled: true`.
2. Send the form to Nagarro marketing's own form or CRM tool instead: change `lead.endpoint` and the
   field names in `scripts/lead.js`.
3. Standard plan (about US$9/month) with a private endpoint to a closed storage account.

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
