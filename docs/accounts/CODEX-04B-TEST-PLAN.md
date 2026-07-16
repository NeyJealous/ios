# CODEX-04B Test Plan

## Local

- Apps Script syntax.
- Existing CODEX-03 sync regression gate.
- AccountScope contract.
- Five presets and display-without-calculation semantics.
- Recommendations-without-calculation rejection.
- Required menu/functions.
- No raw Account ID input in HTML.
- Optimistic lock and global lock presence.
- No purge/archive restore/Market Regime calls.
- Git diff and privacy checks.

## Remote Gate A

- UI model loads exactly three accounts with masked IDs.
- AccountControl contract PASS.
- Diagnostics PASS or warnings explained.
- Preview with current flags returns `NO_CHANGES`, API calls 0, writes 0.
- Apply with current flags returns `NO_CHANGES`, writes 0, audit rows 0.
- Scope flags before/after are identical.
- Quick/Full/History preview remains unchanged.
- Remote Health PASS.
- Round-trip exact match.
- Privacy PASS.
- Deployments remain 15.

No real flag change, purge, restore or production Recalc is authorized in Gate A.
