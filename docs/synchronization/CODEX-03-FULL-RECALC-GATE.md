# CODEX-03 Full Recalc Data-change Gate

## Preconditions

- Full backup exists at suffix `…RJDT0k`; Health backup exists at `…pBu3n4`.
- All 13 new trades are the accepted 162-row production baseline.
- Composite TradeKey, global lock and stable dataRevision tests pass.
- Dry-run passed with API 0 and no Trades/Operations writes.
- Round-trip PASS; privacy PASS; remote health `ok=true`; 15 deployments unchanged.

## Allowed write set

| Sheet | Reason | Expected size | Before evidence | Change type | Rollback source |
|---|---|---|---|---|---|
| Портфель | local no-API normalization | existing 2 positions; no history rows | masked digest snapshot | deterministic local refresh | full backup |
| Режим рынка | local recalculation | small derived table | before semantic hash | replace derived values | full backup |
| Инвестиционная стратегия | local strategy view | existing strategy rows | before semantic hash | derived values only | full backup |
| Ребалансировка | current targets vs portfolio | dry-run planned rows | before semantic hash | batch replace derived rows | full backup |
| План сделок | ID-safe local plan | 3 rows planned | before semantic hash | batch replace derived rows | full backup |
| Решения | local decisions | pipeline-derived row count | before semantic hash | batch replace derived rows | full backup |
| Здоровье портфеля | rebuild from current Portfolio | aggregate + account + strategy rows | stale-sheet hash and Health backup | remove stale rows, create current rows | Health backup |
| Интеллект портфеля | local portfolio analytics | pipeline-derived row count | before semantic hash | batch replace derived rows | full backup |
| Советник | local recommendations | pipeline-derived row count | before semantic hash | batch replace derived rows | full backup |
| Главная | user dashboard | existing dashboard shape | before semantic hash | refresh derived cells | full backup |
| Диагностика | run metrics | one row per run | before row count/hash | append Run ID/status/metrics | full backup |

Exact before hashes and planned row/cell counts must be captured immediately before run 1 and bound to its stable dataRevision; no stale hash is used as authorization.

## Forbidden write set

Сделки; Операции; external-source data/timestamps; Счета; Стратегии; Стратегии счетов. Quick and Full are forbidden.

## Portfolio Health preview

- Current Portfolio positions: 2 — TMON and TPAY.
- Included aggregate: 1 position; securities 13,061.12; cash 0; total 13,061.12.
- Excluded account individual view: 1 position; securities 1,121.2946094; cash 0; total 1,121.2946094.
- Strategy aggregate: one included position; 13,061.12.
- Stale saved rows are replaced through the official pipeline, including removal of stale display content.
- Current aggregate/account/strategy rows are created without visible technical IDs.

## Idempotency plan

1. Capture masked before snapshot, row counts, formulas and semantic hashes.
2. Recalc run 1; verify API 0, allowed write set, stable revision and health reconciliation.
3. Capture snapshot.
4. Recalc run 2 under the same gate.
5. Compare semantic business data. Only Run ID/timestamp diagnostic fields may differ.

## Automatic rollback triggers

Rollback allowed derived sheets if API count exceeds zero, Trades/Operations change, dataRevision changes, TradePlan fails, write set expands, Health disagrees with current Portfolio, or run 2 changes business data. Never roll back accepted Trades. Stop and report the trigger.

## Required authorization

No full Recalc has been executed. This document requests a separate explicit production data-change approval.
