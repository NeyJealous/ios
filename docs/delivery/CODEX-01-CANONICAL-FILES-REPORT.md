# CODEX-01 Canonical Files Report

## Baseline

- branch: `codex-01-canonical-files`
- baseline commit: `0446536b3336120ddfdd2ec476306d6d6334d24f`
- tag: `codex-01-baseline-20260712`
- backup: `backups/CODEX-01-baseline-20260712.zip`
- backup SHA-256: `7ce510ac6f7d1bc8b51c2c6626046341688739197bdc0393c917b6cc894a71b8`

## Local inventory

- `.gs`: 48
- `.js`: 31
- paired basenames: 31
- identical pairs: 11
- non-identical pairs: 20
- heuristic `GS_SUPERSET`: 17
- heuristic `JS_SUPERSET`: 3 (`Accounts`, `Tax`, `TradePlan`)

## Remote inventory

- Remote baseline was pulled into a separate `%TEMP%` folder.
- Remote files: 50 project files plus the local temp `.clasp.json` control file in inventory output.
- The working repository was not overwritten by pull.
- Detailed hashes: `audit/remote_baseline_inventory.json` and `.md`.

## Canonical delivery format

`CANONICAL_DELIVERY_FORMAT = GS`

- `.claspignore` excludes `**/*.js`.
- `filePushOrder` contains no `.js` entries.
- Actual clasp status contains 48 `.gs`, `TokenDialog.html` and `appsscript.json`.
- `spec_unpack`, backups and temporary files are outside the push set.

## .gs/.js comparison

All 31 pairs are recorded in:

- `audit/gs_js_diff.json`
- `audit/gs_js_diff.md`

No `.js` file was deleted, moved or edited. The three `JS_SUPERSET` classifications require a later explicit decision before archival/removal; they do not affect the canonical clasp delivery set.

## Top-level duplicates

Before change:

- `TI_AutoMaintenanceSync`: `AutoMaintenance.gs`, `BatchSync.gs`
- `TI_MaintenanceSync`: `AutoMaintenance.gs`, `BatchSync.gs`
- `TI_AutoRefreshFastData`: `AutoMaintenance.gs`, `DataCache.gs`

After change: zero duplicate top-level names in the canonical `.gs` set.

Canonical ownership:

- maintenance sync wrappers: `BatchSync.gs`
- legacy fast-refresh disabled wrapper: `AutoMaintenance.gs`

## Changes made

- Removed duplicate wrappers only; internal namespace implementations were unchanged.
- Added `projectVersion` to `TI_RemoteHealthCheck` using existing `CORE.PROJECT.VERSION`.
- Added generated audit inventories and validation tooling.
- Added `backups/` to `.gitignore`.

## Dead code removed

None. Static absence of callers was not accepted as proof because Apps Script may invoke globals through menus, triggers, deployments or HTML.

## Project version

Existing `CORE.PROJECT.VERSION` is the single Project Version source. Current value: `1.1.0`. No second version constant was introduced.

## Local checks

- Syntax checks for 48 canonical `.gs`: passed.
- Duplicate top-level scan: zero duplicates.
- `appsscript.json`: valid JSON.
- `.clasp.json`: valid JSON.
- `git diff --check`: passed; line-ending warnings only.
- clasp push set: verified; `.js` excluded.

## clasp push

- Ordinary interactive `clasp push`: successful.
- `--force`: not used.
- Files pushed: 50.
- Production deployment: unchanged.

## Remote health check

- `ok = true`
- `projectVersion = 1.1.0`
- `sheetCount = 40`
- Sheet list returned.

## Round-trip result

- Separate pull completed after push.
- 50/50 files match byte-for-byte after `.gs` → `.js` extension mapping.
- Mismatches: 0.
- Delivery is reproducible.

## Files requiring user decision

- Legacy `.js` disposition remains open.
- Safe current choice: **A — leave `.js` in place and excluded from clasp/Git delivery workflow**.
- `Accounts.js`, `Tax.js`, and `TradePlan.js` were classified as `JS_SUPERSET` by static heuristics and must not be deleted without semantic resolution and separate approval.

## Risks

- Legacy `.js` files remain potentially confusing to humans, but cannot enter the current clasp push set.
- Static function-call analysis cannot detect every Apps Script dynamic entry point; all public names were preserved.
- No production deployment was created or modified.

## Rollback instructions

1. Switch to tag `codex-01-baseline-20260712` or restore the verified ZIP backup.
2. Use the baseline reports to verify credentials remain outside Git.
3. Do not use `clasp push --force` during rollback.

## Readiness for CODEX-02

**Да**, subject to the user's explicit approval to start CODEX-02. CODEX-01 stops here.
