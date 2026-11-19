# Browser session rules (Playwright MCP, server `sf-browser`)

The kit starts Microsoft's Playwright MCP server as `sf-browser`. Its tools (`browser_navigate`,
`browser_snapshot`, `browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`,
`browser_wait_for`, `browser_take_screenshot`, `browser_close`, …) let you run UI test cases in a
real browser against a non-production org. Plugin users see the server as `plugin:sf-sdlc:sf-browser`.

## When to use it
- Test cases of type UI, persona, LWC, page layout, validation message, list view or navigation.
- A smoke pass after a deployment to QA or UAT.
- Reproducing a reported UI defect and capturing evidence.

Apex and Jest stay with the CLI (sections 2 and 3 of the `sdlc-test-execution` skill). The browser does not replace UAT:
business sign-off is still a person's entry in the approval record.

## 1. Preconditions (stop if one fails)
1. The target org is `sandbox`, `scratch` or `developer`
   (`node .claude/bin/sf-sdlc org classify <alias> --json`). Never production, never `unknown`.
2. `node .claude/bin/sf-sdlc browser url --org <role|alias> --json` returns the Lightning address. It
   refuses production-class orgs and prints no token.
3. The `sf-browser` tools are available. If not: `node .claude/bin/sf-sdlc browser status`; the server
   needs `browser.enabled: true` and Node.js (npx); after a change the person restarts Claude Code or
   reconnects it in `/mcp`.
4. The test cases, personas and test data come from the test-case file and the test strategy.

## 2. Sign-in: the person does it, once
1. `browser_navigate` to the address from step 2. The browser keeps a persistent profile in
   `.sf-sdlc/browser-profile/` that restores the last session, so an earlier sign-in usually still
   holds, also after a restart, until the org's session timeout.
2. If the snapshot shows the Salesforce login page (Username, Password, Log In) or a verification
   code page, **stop and ask the person** to sign in in the open browser window, then to tell you when
   they are done. Wait for their reply, then take a new snapshot.
3. Never type into a password, verification-code or username field; never ask for a password in the
   chat; never read, list or copy `.sf-sdlc/browser-profile/`.
4. Never open a URL produced by `sf org open` (it carries a session token), and never put a session ID
   or token in a URL.
5. Opening a page of a production-class org, or of a Salesforce org the sf CLI does not know, asks the
   person first (the `pre-mcp` hook). Treat a "no" as final.

## 3. Personas
- Run each persona's case as that persona. In a sandbox an administrator may use **Login As** (Setup →
  Users → Login); do it only when the test strategy names the persona's test user, and record it.
- If Login As is not available, ask the person to sign in as the test user in the browser window.
- An unauthorised-persona case passes only when the UI denies the action with the expected message.

## 4. Running a case
1. Take a `browser_snapshot` and act on the element references it returns; prefer labels and exact
   on-screen text from the test case over positions.
2. Lightning loads asynchronously: after each action use `browser_wait_for` on the text the next step
   expects (or the spinner disappearing), not fixed sleeps.
3. Compare the actual result with the expected result word for word (labels, messages, values,
   field visibility). A mismatch is a failure; do not reinterpret the expected result.
4. Evidence: `browser_take_screenshot` with a file name under the run folder, for example
   `docs/sdlc/04-qa/test-runs/evidence/TR-20261116-01/TC-US-04-02-007-step3.png`. Take one per
   verified expected result and one at any failure. Do not capture screens showing real personal data.
5. Create test data only as the case says, through the UI or the CLI in the same sandbox, and remove
   it afterwards when the strategy asks for clean-up.
6. Do only what the case says. No Setup changes, deletions or bulk edits that the case does not
   describe; ask first if a case seems to need one.

## 5. Recording results
- Each UI case run in the browser is recorded with executor `Claude (browser, sf-browser)`, the org,
  the date, per-step actual results, the status and the evidence files.
- `Passed` needs every expected result checked and evidenced. A step that could not be performed is
  `Blocked` with the cause (environment, data, access), not `Failed`.
- Triage failures with the table in section 5 of the `sdlc-test-execution` skill before logging a defect; attach the
  screenshots to the `DEF-nnn` record.

## 6. Finish
Call `browser_close` at the end of the run. The profile can be used by one browser at a time; another
Claude session waits ("profile in use") until this one closes. The sign-in stays in the profile for the
next session. `node .claude/bin/sf-sdlc browser reset` signs out of every site.
