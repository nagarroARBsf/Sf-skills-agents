# Component check: what to verify for an LWC in the browser

Use when there are no test cases for the component. Pick the rows that apply, derive concrete checks
from the component source and the spec's acceptance criteria, number them `UI-01…`, and list them
before running them. Every check states the exact expected text or value.

| # | Area | Check | How |
|---|---|---|---|
| 1 | Renders | The component appears where `js-meta.xml` targets say, with its title and labels as in the source and Custom Labels | Snapshot; screenshot |
| 2 | Loading | A loading indicator shows while data loads and disappears afterwards | Wait for "Loading" to go |
| 3 | Data | Values shown match the record (compare 2-3 fields with the record page or a read-only query) | Snapshot vs record |
| 4 | Empty | With no data, the empty-state message appears (not a blank card or an error) | A record or filter with no rows |
| 5 | Error | When the server call fails or access is missing, a plain-language error appears, no raw stack trace | Persona without access, or invalid input |
| 6 | Interactions | Each button, link, input and menu does what the AC says; disabled states are right | Click, type, select; wait for the result |
| 7 | Validation | Invalid input shows the exact message next to the field; the record is not saved | Boundary values from the AC |
| 8 | Save and refresh | After a save the component and the record page show the new value without a manual reload | Toast text; field value |
| 9 | Events | Navigation, toasts and parent updates the component triggers happen as specified | Next page heading; toast |
| 10 | Permissions | Each persona sees and can do exactly what the design says; an unauthorised user is refused with the expected message | One case per persona plus one unauthorised |
| 11 | Keyboard | All actions reachable with Tab / Shift+Tab, Enter and Space; Escape closes modals; focus is visible and lands sensibly | `browser_press_key`; snapshot focus |
| 12 | Names | Every input has a label, every icon button an accessible name; headings are in order | Snapshot roles and names |
| 13 | Mobile | At 375 × 812 the content fits without horizontal scrolling and actions stay reachable | `browser_resize`; screenshot |
| 14 | Console | No JavaScript errors during the checks | `browser_console_messages` |
| 15 | Server calls | No failed Apex, UI API or GraphQL requests during the checks | `browser_network_requests` |

Contrast, screen-reader wording and the full WCAG 2.2 list need a source review: suggest the installed
`experience-accessibility-validate` skill, and Sa11y Jest tests for each rendered state.
