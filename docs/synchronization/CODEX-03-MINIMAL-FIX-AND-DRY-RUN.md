# CODEX-03 Minimal Fix and Dry Run

## Canonical local working copy

`C:\Users\NeyJealous\Documents\Инвест`, branch `codex-03-sync-modes`.

## Approved trade key and new trades status

Canonical TradeKey: Account ID + Operation ID + Trade ID, with a significant-field checksum conflict guard. All 13 new rows are `VALID_NEW_TRADE`; repeated Trade ID `1094` is distinct.

## Rebalance → TradePlan fix

Explicit scopeType/accountId/accountName/strategyId/strategyName cross the boundary. Aggregate scope has null Account ID and never invokes an Account-ID lookup. Russian names are display-only.

## Global lock

Quick/Full/Recalc/Maintenance and direct Trades/Prices/Directory/manual/trigger wrappers share the project guard. Contention returns `BUSY`; remote lock test passed.

## Stable data revision

Recalc hashes semantic input data and validates it before publication/finalization. Changed inputs produce `INPUT_DATA_CHANGED_DURING_RUN` with zero external API calls.

## Files changed

Approved synchronization source, diagnostics, audit tools and CODEX-03 reports only. Investment formulas, target weights and production deployment were not changed.

## Local tests

Syntax PASS; 53 canonical `.gs`; top-level duplicates 0; TradeKey, TradePlan scopes, lock, dataRevision and zero-API path PASS; `git diff --check` PASS.

## clasp push and remote tests

Ordinary 55-file push completed without `--force`. Remote health, TradeKey, TradePlan scopes, dataRevision and global lock tests passed.

## Dry-run Recalc

- runId: `…c50850`
- apiCallCount: 0
- Trades writes: 0
- Operations writes: 0
- dataRevision: stable
- TradePlan status: `PRECONDITIONS_OK`
- expected write set: Портфель; Режим рынка; Инвестиционная стратегия; Ребалансировка; План сделок; Решения; Здоровье портфеля; Интеллект портфеля; Советник; Главная; Диагностика

Exactly one dry-run was executed. Quick, Full and full Recalc were not executed.

## Portfolio Health preview

Current Portfolio contains TMON and TPAY. Included aggregate: one position, securities 13,061.12, cash 0, total 13,061.12. Excluded account remains individually visible: one position, 1,121.2946094. This explains the stale saved Health sheet.

## Round-trip

55/55 exact matches; PASS.

## Risks and rollback

Saved derived sheets remain stale until full Recalc. Use full backup `…RJDT0k` or Health backup `…pBu3n4` for allowed derived-sheet rollback; never roll back accepted Trades.

## Request for full Recalc data-change gate

Required before any production derived-sheet write or idempotency run.
