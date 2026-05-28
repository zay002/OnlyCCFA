## OnlyCCFA v0.1.2

This release improves the Google Scholar filtering experience and adds a repeatable release packaging workflow.

### What's New

- Added configurable default filtering for Google Scholar: `ALL`, `CCF A`, `CCF B`, `CCF C`.
- Added a `Hide unmatched` option to control whether papers without recognized CCF ranks stay visible.
- Added filtering statistics in the on-page panel: visible results, hidden results and unmatched results.
- Saved filter preferences locally in the browser, without adding new extension permissions.
- Added `npm run package` to generate a Chrome Web Store / GitHub Release ready zip file.

### Verification

- `npm test`
- `npm run format:check`
- `npm run package`
