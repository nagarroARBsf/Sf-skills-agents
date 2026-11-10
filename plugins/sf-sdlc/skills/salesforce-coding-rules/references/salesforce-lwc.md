<!-- Generated from .claude/rules/salesforce-lwc.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->

# LWC rules

- Prefer Lightning Base Components; style with SLDS utility classes and styling hooks, not
  hard-coded colours or overrides of `slds-` classes.
- Data: Lightning Data Service (`lightning/uiRecordApi`, `lightning-record-*-form`) first; Apex
  via `@wire` with `cacheable=true` for reads; imperative Apex for writes, followed by
  `refreshApex` or `notifyRecordUpdateAvailable`.
- Field and object references via schema imports (`@salesforce/schema/Account.Name`), not strings.
- Handle the three states for every async call: loading (spinner), empty, error (user-friendly
  message with `lightning-platform-show-toast-event` or inline).
- Permissions: `@salesforce/customPermission/...` for feature visibility; never check profile names.
- User-facing text from Custom Labels (`@salesforce/label/...`).
- Accessibility: labels on inputs, `alternative-text` on icons, keyboard operable, colour never the
  only signal.
- `js-meta.xml`: set `isExposed`, targets and target configs explicitly; use the project API version.
- Public API with `@api`; communicate up with `CustomEvent` (lowercase names), down with
  properties. No direct DOM manipulation outside `this.template`.
- Jest tests in `__tests__/` for logic and rendering states; mock Apex and wire adapters.
- Use the `experience-lwc-generate` skill when creating components and `design-systems-slds-apply`
  for SLDS decisions.
