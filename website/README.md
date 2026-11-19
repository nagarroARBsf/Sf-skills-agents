# SF-SDLC website

The public site for the SF-SDLC Framework. It is a static page assembled from small parts, plus
one Azure Function for the sign-up form. No npm packages and no framework: the build is
`scripts/build-site.py` (Python standard library).

Hosting, Azure resources and deployment: [HOSTING.md](HOSTING.md).

## Folder layout

```
website/
├── README.md                  this file
├── HOSTING.md                 Azure resources, deploy steps, custom domain
├── site.config.json           analytics and sign-up settings (exposed to the page as window.SFSDLC_CONFIG)
├── staticwebapp.config.json   Azure Static Web Apps settings (routes, headers, API runtime)
├── src/
│   ├── index.html             page skeleton: the order of everything on the page
│   ├── partials/              parts used once per page
│   │   ├── header.html        top bar (brand, tabs, Talk to us, theme, GitHub)
│   │   ├── sidebar.html       left navigation
│   │   ├── footer.html
│   │   └── lead.html          the sign-up dialog and the corner nudge
│   ├── sections/              one file per page section (overview.html, install.html, ...)
│   ├── snippets/              code samples shown in the structure explorer (one .txt each)
│   ├── styles/                CSS, one file per concern (tokens.css holds colours and fonts)
│   └── scripts/               JavaScript, one file per feature
│       ├── explorer-data.js   rows of the plugin-structure explorer
│       ├── explorer.js        renders the explorer
│       ├── ui.js              tabs, copy buttons, theme, mobile menu, scroll spy
│       ├── agents.js          install section: coding-agent card rail, coming-soon panel; pauses the emblem for reduced motion
│       ├── showcase.js        "In action" tab: agent relay, hooks player, Playwright and Langfuse replays (styles in showcase.css)
│       ├── analytics.js       visitor counting (Application Insights, no cookies)
│       └── lead.js            sign-up dialog, download prompt, corner nudge
├── assets/                    images (logos, diagrams; sf-sdlc-emblem.svg is a standalone copy of the animated emblem)
├── media/                     videos — NOT in git (too large); see "Videos" below
└── api/                       Azure Function behind the sign-up form
    ├── host.json
    └── lead/                  POST /api/lead → email to the team (Azure Communication Services)
```

`site/` (repository root) is the build output. It is git-ignored and rebuilt from scratch every time;
never edit it.

## Common changes

| To... | Do this |
|---|---|
| Edit text in a section | Edit `src/sections/<id>.html` |
| Add a section | Create `src/sections/<id>.html` starting with `<section id="<id>" data-tab="<tab>">`, add `<!-- @include sections/<id>.html -->` in `src/index.html` where it should appear, and a link in `src/partials/sidebar.html` |
| Remove a section | Delete its include line in `src/index.html` and its sidebar link (and the file) |
| Reorder sections | Move the include lines in `src/index.html` |
| Change colours or fonts | `src/styles/tokens.css` (light and dark values are both there) |
| Add styles for a new component | New file in `src/styles/`, plus a `<link>` in `src/index.html` |
| Add behaviour | New file in `src/scripts/`, plus a `<script>` at the end of `src/index.html` |
| Add a code sample to the explorer | `src/snippets/c-<name>.txt`, then `code: 'c-<name>'` on a row in `explorer-data.js` |
| Release a package for another coding agent | In `src/sections/install.html`, change that card's badge to `Available` and replace its `data-soon` button with an `<a class="agent-dl" href="downloads/<file>.zip" download>` link; add the zip to `scripts/build-site.py` |
| Add an image | Put it in `assets/`, reference it as `assets/<file>` |
| Change when the sign-up nudge appears | `lead` in `site.config.json` (`nudgeScrollPercent`, `nudgeAfterSeconds`, `snoozeDays`, `nudge: false` to turn it off) |
| Turn the sign-up form on or off | `lead.enabled` in `site.config.json` (`false` hides Talk to us, the nudge and the download prompt) |
| Turn analytics on or off | `analytics.connectionString` in `site.config.json` (empty = off) |

Track a new event from any script with `window.sfTrack('event_name', { key: 'value' })`. Never pass
anything a visitor typed (email, name) to it.

## Build and preview

```bash
python3 scripts/build-site.py              # full build, including the two zip downloads
python3 scripts/build-site.py --no-zips    # faster, for previewing page changes
python3 -m http.server -d site 8000        # then open http://localhost:8000
```

The build stops with an error if an include is missing. It adds `?v=<hash>` to every style and
script link, so visitors get changed files at once even though they are cached for a year.
The local preview has no `/api/lead`, so the sign-up form shows an error there; that is expected.

## Videos

Both videos are hosted on Google Drive (shared "Anyone with the link") and play inside the page
through Drive's embedded player, so they are not part of the Azure package:

| Video | Where on the page | Drive file |
|---|---|---|
| Marketing overview (`sf_sdlc_marketing_v2.1.mp4`, 1:12) | top of `sections/overview.html` | `1afyGrqBLys6jbcJ0p9bd7uwJYXq1Xhn3` |
| Setup tutorial (`sf_sdlc_tutorial_v3.2.mp4`, 12:18) | `sections/tutorial.html` | `1DsP2swkd32meCzgK4f1KUX7cRQr68h26` |

To replace a video, upload the new file to Drive, share it as "Anyone with the link", and change the
file ID in the iframe's `https://drive.google.com/file/d/<id>/preview`. If the Drive file stops being
shared, visitors see a Google sign-in box instead of the video. Do not add `autoplay` to the iframe.

A video in `website/media/` (git-ignored) is copied into the package only if the page references it as
`src="assets/<name>.mp4"`. Azure Blob Storage is not an option: Nagarro policy denies storage accounts
open to the internet.

## What the site records

`scripts/analytics.js` sends visit data to Azure Application Insights **without cookies** and skips
visitors whose browser sends Do Not Track or Global Privacy Control. It records page views, engaged
visits (20 seconds visible), scroll depth, sections read, downloads, video plays, outbound clicks,
sign-up prompts and time on page. Visitor counts are therefore visits, not unique people: without a
cookie a returning visitor cannot be recognised.

`scripts/lead.js` stores in the visitor's own browser (`localStorage`) only whether they signed up
or dismissed the prompt, so it is not shown again. Sign-ups go to `/api/lead`, which emails
them, with the consent text the visitor agreed to, to the team mailbox (see [HOSTING.md](HOSTING.md)).
