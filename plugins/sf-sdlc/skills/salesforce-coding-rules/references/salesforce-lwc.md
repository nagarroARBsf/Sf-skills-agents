<!-- Generated from .claude/rules/salesforce-lwc.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# LWC rules

Sources: LWC Developer Guide, Lightning Web Security guide, `@salesforce/eslint-plugin-lwc` and
`eslint-plugin-lightning` rules, trailheadapps/lwc-recipes, and Salesforce's `experience-lwc-generate`,
`experience-lds-best-practices-apply`, `experience-lwc-security-validate`, `design-systems-slds-apply`
and `experience-accessibility-validate` skills. Lint rule names are in brackets.

## Templates and structure
- Conditionals with `lwc:if` / `lwc:elseif` / `lwc:else`; never `if:true` / `if:false`, never both on
  one element. `lwc:if` removes the element from the DOM.
- Every `for:each` / `iterator` item has a stable `key` (a record ID, never the index or an object).
- Element access with `lwc:ref` and `this.refs`, or `this.template.querySelector`; never `document` or
  `window` queries. [no-document-query]
- Never reassign or mutate an `@api` property inside the component: keep a private copy. One decorator
  per field; `@api` on the getter of a getter/setter pair; `@track` only for mutated nested
  properties. [no-api-reassignments, valid-api, valid-track]
- Down through properties, up through `CustomEvent` (lowercase name, no `on` prefix), `bubbles` and
  `composed` false unless a distant ancestor needs the event; pass copies in `detail`. Lightning
  Message Service between unrelated components. [prefer-custom-event]
- Light DOM only with a recorded reason, and never for sensitive data.
- `js-meta.xml`: `isExposed`, targets and target configs set explicitly, project API version, and
  only the targets the design needs.

## Data access
- Order of preference: base record forms (`lightning-record-form`, `-edit-form`, `-view-form`, with
  listed fields) → Lightning Data Service wire adapters and functions (`lightning/uiRecordApi`) or the
  GraphQL wire adapter `lightning/graphql` (read `errors` in the callback) → Apex, only for what UI API
  cannot do (unsupported objects, multi-record transactions, complex logic).
- Field and object references through schema imports (`@salesforce/schema/Account.Name`), never strings.
- Reads: `@wire` to `@AuraEnabled(cacheable=true)` methods; keep the wired result for refresh.
  Writes: imperative calls.
- Refresh: `refreshApex(wiredResult)` only for Apex wire results; after imperative Apex DML on records
  LDS may hold, `notifyRecordUpdateAvailable(recordIds)`. LDS functions and record forms refresh
  themselves.
- Every async path renders loading, empty and error states; errors shown in plain language inline or
  with `ShowToastEvent` from `lightning/platformShowToastEvent`.
- Treat data from wires and parents as read-only; copy before changing.

## Security (Lightning Web Security)
- Write for Lightning Web Security; do not rely on Locker wrappers.
- No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`, `new Function`, `document.write` or
  assignments to `window`; `lwc:inner-html` only for trusted, sanitized content; no `javascript:` or
  `data:` URLs; `<iframe>` with `sandbox`. [no-inner-html]
- Third-party libraries from static resources via `lightning/platformResourceLoader`; library-managed
  DOM inside `lwc:dom="manual"`.
- Feature visibility with `@salesforce/customPermission/...`, never profile names. Hiding something in
  the UI is not security: the Apex behind it enforces sharing and user mode.
- User-facing text from Custom Labels (`@salesforce/label/...`).

## Performance and lifecycle
- The constructor does not touch attributes or the DOM; `connectedCallback` does not mutate the host;
  `renderedCallback` changes state only behind a guard. [no-attributes-during-construction]
- Every listener, interval and subscription is removed in `disconnectedCallback`. `setTimeout` only to
  debounce, with a comment. [no-leaky-event-listeners, no-async-operation]
- Request the least data; render large sections only when shown; infinite loading for long
  `lightning-datatable` lists.

## Accessibility (WCAG 2.2)
- Base components get a `label` (use `variant="label-hidden"` to hide it visually, never omit it);
  every `lightning-icon` and `lightning-button-icon` has `alternative-text`.
- Custom controls are keyboard operable with visible focus; errors identified in text; colour is never
  the only signal; ARIA only where semantic HTML cannot do the job.
- A Sa11y assertion (`@sa11y/jest`, `toBeAccessible`) per rendered state in Jest.

## Styling (SLDS 2)
- Base component → SLDS blueprint → global styling hooks `var(--slds-g-…, fallback)` → custom CSS.
- Never override `.slds-*` classes or base-component internals; add a prefixed class of your own. No
  hard-coded colours, no `--lwc-*` tokens as primary values. Selectors use `:host` and classes, not
  IDs or `*`.
- `npx @salesforce-ux/slds-linter lint <path>` shows no violations; check dark mode and density.

## Testing and linting
- Jest tests in `__tests__/` with `sfdx-lwc-jest`: every state (loading, data, empty, error), events
  and interactions; Apex mocked with `jest.mock`, wire adapters with the test adapters; DOM reset in
  `afterEach`.
- ESLint with `@salesforce/eslint-config-lwc/recommended` (and `@salesforce/eslint-plugin-lightning`)
  shows no errors before commit.
- UI behaviour in a real org is checked in the browser with the `sdlc-ui-testing` skill (`/sf-sdlc:ui-test`).
- If installed, load `experience-lwc-generate` before creating a component and
  `design-systems-slds-apply` for styling decisions.
