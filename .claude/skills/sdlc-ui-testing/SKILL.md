---
name: sdlc-ui-testing
description: "Test Salesforce user interfaces in a real browser through the Playwright MCP server (sf-browser): a Lightning Web Component, a record or app page, a screen flow, an Experience Cloud page, a list view or layout, in a sandbox, scratch or developer org. Finds where the component is placed, has the person sign in (never a password), runs the UI test cases or a component check derived from the source and acceptance criteria (states, data, interactions, messages, permissions per persona, keyboard accessibility, mobile width, console and server errors), takes a screenshot per verified result, writes the test-run report and logs defects. Never opens production. TRIGGER when: user asks to test, check or smoke-test an LWC, component, page, screen or any UI in the browser, reproduce a UI defect, check UI accessibility or mobile layout, or runs /sdlc-ui-test. DO NOT TRIGGER when: the user wants Apex or Jest tests run (use sdlc-test-execution) or test cases designed (use sdlc-qa-test-case-generate)."
metadata:
  version: "1.0"
  author: "Nagarro Salesforce CoE"
---

# sdlc-ui-testing

Check a Salesforce screen the way a user meets it: in a browser, signed in as the right person, against
an org that is not production. Apex and Jest tests prove the logic; this proves what people see.

The work runs in the **sdlc-qa-test-agent** (`/sdlc-ui-test`, or `/sdlc-test-run` for UI test cases):
browser snapshots are long, and keeping them out of the main conversation keeps it usable. The browser
tools are those of the `sf-browser` server (plugin users: `plugin:sf-sdlc:sf-browser`):
`browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`,
`browser_select_option`, `browser_press_key`, `browser_wait_for`, `browser_take_screenshot`,
`browser_resize`, `browser_console_messages`, `browser_network_requests`, `browser_tabs`,
`browser_close`.

## Non-negotiables
- **Never production.** The org is `sandbox`, `scratch` or `developer`
  (`node .claude/bin/sf-sdlc org classify <alias> --json`); `unknown` counts as production. The address
  comes from `node .claude/bin/sf-sdlc browser url --org <role|alias> --json`, which refuses production
  and carries no session token. A guard hook asks before the browser opens a production-class or
  unknown org; a "no" is final.
- **The person signs in.** Never type into a username, password or verification-code field, never ask
  for a password, never open an `sf org open` URL (it carries a session), never read
  `.sf-sdlc/browser-profile/` (it holds live session cookies).
- **Do only what the test says.** No Setup changes, no edits to Lightning pages, no deletions or bulk
  edits a case does not describe. Placing a component on a page for testing is a change: ask first.
- **Evidence or it did not happen.** `Passed` needs every expected result compared word for word and a
  screenshot. A step that could not be run is `Blocked` with its cause.
- **No real personal data** in typed values or screenshots. Test data is synthetic, named with the run
  ID, and cleaned up when the strategy asks.
- `browser_evaluate` and `browser_run_code_unsafe` only for read-only inspection the snapshot cannot
  answer; never to change data, bypass validation or read cookies, storage or tokens.

Session rules (sign-in, personas, evidence paths, finishing): [references/browser-session.md](references/browser-session.md).

## 1. Decide what to test
| Request | Mode | Source of the checks |
|---|---|---|
| Test case IDs, a story, "run the UI cases" | **Test cases** | `docs/sdlc/04-qa/test-cases/<story>.md`, cases of type UI, persona, LWC, layout, validation, navigation |
| "Test my component `accountHealthCard`", "check this page" | **Component check** | The component source, its spec ACs (`specs/<story>/spec.md`) when present, and the checklist in [references/lwc-ui-checklist.md](references/lwc-ui-checklist.md) |
| After a deployment to QA or UAT | **Smoke** | The P1 UI cases marked for smoke, or one happy path per changed page |
| A reported UI problem | **Reproduce** | The defect's steps; capture evidence of actual vs expected |

For a component check with no test cases, read first: the bundle's `.js` (`@api` properties, `@wire`
and imperative Apex calls, events dispatched, error handling), `.html` (states rendered, labels),
`.js-meta.xml` (targets: record page, app page, home, flow screen, Experience Cloud) and the Custom
Labels it imports. Derive 5-15 checks from the checklist; list them before running them.

## 2. Find where the UI lives
- **Placed on a page:** search `flexipages/*.flexipage-meta.xml` for `<componentName>c:<name>` (or the
  namespace) to find the record, app or home page; read its object and app. Then navigate by URL
  pattern ([references/lightning-ui-patterns.md](references/lightning-ui-patterns.md)) instead of
  clicking through menus.
- **Record page:** you need a record ID. Use test data named in the case, or find one with a read-only
  query on the same non-production org (`sf data query --query "SELECT Id FROM <Object> WHERE …
  LIMIT 1" --target-org <alias> --json`), or create one only when the case says so.
- **Not placed anywhere:** ask the person where it should be tested. Options: they add it to a page in
  the sandbox (or agree that you add it, as a recorded change); or they run Local Dev / Lightning
  Preview themselves (`sf lightning dev component`, see the installed `experience-lwc-runtime-observe`
  skill) and tell you the local address. Do not open the front-door URL that Local Dev prints: it
  carries a session.
- **Not deployed yet:** UI tests run against deployed metadata. Say so and stop; deploying to the test
  org is `/sdlc-deploy`.

## 3. Run
1. Preconditions and sign-in exactly as [references/browser-session.md](references/browser-session.md)
   sections 1-2 describe. Each persona's case runs as that persona (section 3 there).
2. Navigate by URL, then `browser_wait_for` the text the page is expected to show (the component's
   heading or a field label) — never a fixed sleep. Lightning renders asynchronously: also wait for any
   spinner to disappear before reading values.
3. Take a `browser_snapshot` and act on its element references; take a new one after every
   navigation, modal or re-render, because references go stale. Choose elements by role and
   accessible name, label or exact visible text — what the user sees — never by CSS classes, XPath,
   generated IDs or positions. The snapshot reads through Lightning's shadow DOM; XPath and CSS class
   selectors do not survive it. Patterns: [references/lightning-ui-patterns.md](references/lightning-ui-patterns.md).
4. After each action, wait for the expected outcome (toast text, new value, navigation), then compare
   the actual result with the expected result word for word. Toasts disappear by themselves: read and
   screenshot them at once. Elements hidden with `lwc:if` are absent from the snapshot, not hidden.
5. Collect the signals a screenshot does not show: `browser_console_messages` (errors from the
   component) and `browser_network_requests` (failed server calls — Apex and UI API requests returning
   errors). A JavaScript error during a passing flow is still a finding.
6. Evidence: `browser_take_screenshot` per verified expected result and at every failure, saved as
   `<paths.docs>/04-qa/test-runs/evidence/<TR-id>/<TC-id>-step<n>.png`.
7. Accessibility and layout checks from the checklist: keyboard (Tab, Shift+Tab, Enter, Space, Escape
   with `browser_press_key`), names and roles in the snapshot, and narrow widths with `browser_resize`
   (375 × 812 for a phone, 768 × 1024 for a tablet). For a full WCAG review use the installed
   `experience-accessibility-validate` skill on the source.
8. `browser_close` at the end of the run, also after a failure.

## 4. Record
- Test cases: a test-run report `TR-<YYYYMMDD>-<nn>` per the `sdlc-test-execution` skill (section 7),
  executor `Claude (browser, sf-browser)`, the org, per-step actual results and evidence files.
- Component check or smoke: the same TR format with scope "UI check of `<component>`" and one row per
  check (ID `UI-01`…), so it is traceable and repeatable.
- Failures: triage (product defect, test defect, environment or data) per `sdlc-test-execution`
  section 5, then a `DEF-nnn` with steps, expected, actual, screenshots and console or network errors.
  Creating a Jira bug needs a preview and an explicit yes.
- Report: what was tested where, as whom; passed, failed, blocked; defects; what was not checked and why.

## 5. Make it repeatable (optional)
When the project already uses Playwright Test (`@playwright/test` in `package.json`) and the person
asks, turn a passed case into a spec file under the project's test folder: role and label locators
from the run, `expect` assertions for each expected result, the org address from an environment
variable, and sign-in through a saved storage state the team produces outside the kit. Never write a
credential, session ID or frontdoor URL into a test file. Without Playwright Test in the project,
offer it as a suggestion only; do not add dependencies unasked.
