# Lightning in the browser: navigation, locators, waits

Practical patterns for driving Lightning Experience and Experience Cloud with the Playwright MCP
tools. Sources: Playwright locator docs, the Playwright MCP README, the LWC Developer Guide (shadow DOM,
`lwc:if`), and the SLDS component blueprints (spinner, toast).

## Navigate by URL
Go straight to the page under test; use the App Launcher only when navigation itself is being tested.
Prefix each path with the address from `node .claude/bin/sf-sdlc browser url --org <role> --json`.

| Page | Path |
|---|---|
| Record page | `/lightning/r/<ObjectApiName>/<RecordId>/view` |
| Record edit | `/lightning/r/<ObjectApiName>/<RecordId>/edit` |
| New record | `/lightning/o/<ObjectApiName>/new` |
| Object list view | `/lightning/o/<ObjectApiName>/list?filterName=<ListViewDeveloperName>` |
| Object home | `/lightning/o/<ObjectApiName>/home` |
| Custom tab (LWC, Visualforce, web tab) | `/lightning/n/<TabApiName>` |
| App | `/lightning/app/<AppDeveloperName>` (or the app's ID) |
| Setup page (read only, when a case says so) | `/lightning/setup/<SetupNode>/home` |

The tab path is widely used but not in Salesforce's reference docs; if it does not resolve, open the
app and select the tab by its name.

## Find elements the way users do
- Act on the element references from `browser_snapshot` (the accessibility tree). Take a **new**
  snapshot after every navigation, modal, tab switch or re-render: Lightning replaces elements and old
  references go stale.
- Choose by role and accessible name ("button Save", "combobox Stage", "link Accounts"), then by label,
  then by exact visible text; `browser_find` locates text on the page. Base components expose their
  `label` and `alternative-text` as the accessible name, so the labels in the test case are the locators.
- Lightning uses (synthetic) shadow DOM. The snapshot and Playwright's role, label and text locators
  read through open shadow roots; XPath does not, and CSS class names (`slds-*`, `lwc-*` scope tokens)
  and generated IDs change between releases. Never use them.
- Avoid picking "the first" or "the nth" match. When a label repeats (two Save buttons in a modal and
  a page), narrow by the region: the dialog, the card title, the related list.
- Experience Cloud LWR sites may render light DOM; the same role-first approach works there.

## Wait for the outcome, never for time
- After navigating: `browser_wait_for` the text the page must show (the component title, a field
  label), then wait for any loading indicator to go — the SLDS spinner is `role="status"` with the
  text "Loading".
- After an action: wait for its result — the toast text, the new field value, the next page heading.
- Toasts are `role="alert"` (errors) or `role="status"` and disappear by themselves: read and
  screenshot them straight away.
- `lwc:if` removes elements from the DOM: "not shown" means absent from the snapshot. Assert absence,
  not hidden styling.
- A time-based wait is a last resort, short, and noted in the result as a possible flake.

## What else to read after each case
- `browser_console_messages`: JavaScript errors and LWC warnings from the component.
- `browser_network_requests`: failed calls — Aura/Apex requests (`/aura`), UI API (`/ui-api/`) or
  GraphQL returning errors. Quote the failing request and status in the defect, never headers or
  cookies.

## Tools to keep away from
- `browser_evaluate` and `browser_run_code_unsafe` run code in the page. Use them only for read-only
  inspection when the snapshot cannot answer, never to change data, click past validation or read
  storage, cookies or tokens.
- Never open a front-door or `sf org open` URL, and never put a session ID in an address.

## Test data
- Create only what the case names, through the UI or the CLI in the same sandbox. Prefix names with
  the run ID (`TR-20261119-01 Acme`) so it is findable, and delete it at the end when the test strategy
  asks for clean-up. List anything left behind in the report.

## Personas and guests
- Each persona runs in its own sign-in (Login As in a sandbox when the strategy names the test user,
  or the person signs in as that user).
- Guest-user (unauthenticated) Experience Cloud cases need a browser without the internal session:
  ask the person to sign out, or run them in a private window they open; record which.
