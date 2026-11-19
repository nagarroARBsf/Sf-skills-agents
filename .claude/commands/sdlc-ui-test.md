---
description: Test an LWC, a Lightning page or any Salesforce UI in a real browser (Playwright) in a sandbox, with screenshots, a test-run report and defects
argument-hint: "<component, page, story ID or TC IDs> [org role or alias, default qa]"
---
Use the **sdlc-qa-test-agent** subagent to test the user interface in the browser.

What to test, and where: $ARGUMENTS

The agent follows the `sdlc-ui-testing` skill: confirms the org is a sandbox, scratch or developer org
(never production), gets its address with `node .claude/bin/sf-sdlc browser url`, finds where the
component is placed, and runs the UI test cases — or, for a component with no test cases, a component
check derived from its source and acceptance criteria (states, data, interactions, messages,
permissions, accessibility, mobile width, console and server errors) — through the `sf-browser`
(Playwright MCP) tools. The person signs in in the browser window the first time; the agent never
types a password. It takes a screenshot per verified result, writes the test-run report under
`docs/sdlc/04-qa/test-runs/`, logs defects, and closes the browser. Stop after the report.
