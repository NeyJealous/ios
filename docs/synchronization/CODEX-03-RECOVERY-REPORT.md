# CODEX-03 Recovery Report

## Incident classification

`CONCURRENT_MANUAL_SYNC_DURING_RECALC_TEST`; primary TradePlan cause `CODE_DEFECT`, secondary `LOCK_SCOPE_DEFECT`.

## User-confirmed legitimate data

All 13 new Trades rows are preserved as production baseline. No trade rollback or deletion occurred.

## New trades validation

13 `VALID_NEW_TRADE`, 0 duplicate, 0 invalid, 0 review. Trade ID `1094` is valid because the Account ID + Operation ID + Trade ID composite key is unique.

## New data baseline

The full post-incident backup suffix is `…RJDT0k`; the accepted Trades baseline is 162 rows.

## Source state

The approved minimal CODEX-03 source is present locally and remotely. A baseline-tag rollback was not used.

## Recalc tradePlan failure

The aggregate display value `Все счета` no longer reaches an Account-ID lookup. Explicit scopeType/accountId/accountName/strategyId/strategyName fields cross the Rebalance → TradePlan boundary.

## Lock coverage

Batch modes and direct Trades/Prices/Directory/manual/trigger wrappers share the project guard. Remote lock test passed.

## Stable snapshot protection

Stable dataRevision is computed from semantic input data and checked during Recalc. A mismatch returns `INPUT_DATA_CHANGED_DURING_RUN`.

## Changes made

Instrumentation, zero-API accounting, batch/incremental hardening, composite TradeKey, ID-safe TradePlan boundary, project guard, dataRevision, diagnostics and Portfolio Health preview.

## clasp push

Ordinary 55-file push completed without `--force`; no production deployment changed.

## Dry-run

Exactly one authorized dry-run passed: run `…c50850`, API 0, Trades writes 0, Operations writes 0, stable revision, TradePlan `PRECONDITIONS_OK`.

## Recalc run 1 / run 2

Full Recalc was not run. Idempotency remains the final data-change gate.

## Trades/Operations integrity

Trades remained at the accepted 162-row baseline during the dry-run; no standalone Operations sheet exists and no Operations write occurred.

## Portfolio reconciliation and Health

Preview used the current two-position Portfolio (TMON, TPAY). Included-account aggregate: one position, securities value 13,061.12, cash 0, total 13,061.12. The excluded account remains available individually with one position and value 1,121.2946094. Saved Health remains stale pending full Recalc authorization.

## Remote health and round-trip

Remote health `ok=true`. Round-trip: 55/55 exact matches, `ROUND_TRIP_MATCH=true`.

## Remaining risks

Full Recalc and second-run idempotency have not been executed; saved derived sheets, including Portfolio Health, remain stale.

## Readiness to finish CODEX-03

Нет — final data-change gate is required.
