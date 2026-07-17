# CODEX-03 Synchronization Report

## Canonical local working copy

`<REPO_ROOT>`, branch `codex-03-sync-modes`, baseline commit `57ef293`.

## Baseline and incident

The 13 concurrent manual-sync Trades rows are legitimate and preserved. The accepted production history has 162 rows. Trade ID `1094` is not a duplicate under the approved Account ID + Operation ID + Trade ID key.

## Quick Sync

Entry point, steps, lock and expected write scope were audited. Quick was not run in the recovery or finalization gates.

## Full Sync

Incremental composite-key deduplication and conflict detection are implemented. Full was not run.

## Recalc

The ID boundary defect was fixed. One dry-run passed; full Recalc was not run.

## Execution context, lock and API accounting

Run ID, timings, status, steps, row/sheet metrics, warnings/errors and project version are JSON-safe. Direct and orchestrated writers share the project guard. Recalc has a zero-API guard and stable semantic dataRevision.

## Incremental history

TradeKey is Account ID + Operation ID + Trade ID. Matching keys with matching checksums are duplicates; matching keys with different significant-field checksums raise `TRADE_KEY_CONFLICT` and are not overwritten silently.

## Sheet performance

Critical sync-path writes were batched; broad refactoring was intentionally avoided. Details are in `CODEX-03-PERFORMANCE-REPORT.md`.

## Portfolio Health preview

Preview used the current Portfolio with TMON and TPAY. Included aggregate: one position, securities 13,061.12, cash 0, total 13,061.12. Excluded-account individual view: one position, 1,121.2946094. The saved sheet remains stale until the final Recalc gate.

## Tests

- syntax: PASS (53 `.gs` files)
- top-level duplicates: 0
- TradeKey: PASS local and remote
- TradePlan scopes: PASS local and remote
- global lock: PASS local and remote
- dataRevision: PASS local and remote
- zero-API Recalc path: PASS
- dry-run: `apiCallCount=0`, Trades writes 0, Operations writes 0, stable revision, TradePlan preconditions passed

## clasp push and remote diagnostics

Ordinary push without `--force` completed. Remote health `ok=true`. Production deployments remained at 15; no deployment command changed them.

## Round-trip and privacy

Round-trip: 55/55 exact source matches, PASS. Privacy scan: PASS; no full protected IDs, tokens, secrets, `.clasprc.json`, Script Properties or production composite TradeKey were included.

## Production data changes

Authorized Recalc, Quick and Full pipelines were executed against production data
after backups and dry runs. Full history was preserved; Full run 2 added no Trades.
Derived views were rebuilt through official pipelines.

## Risks and rollback

Full Sync remains long-running and depends on checkpoint continuation. Historical
Git objects retain three Script IDs; current-tree `.clasp.json` files are untracked
and ignored. Production history rollback remains prohibited.

## Readiness for CODEX-04

Да — Recalc 2/2, Quick 2/2 and Full 2/2 passed. Full run 2 completed 32/32
from checkpoint 26 without additional API calls. A separate user confirmation is
still required before CODEX-04.
