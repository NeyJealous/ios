# CODEX-03 Lock Coverage Audit

## Covered by the shared BatchSync Script Lock

- `TI_QuickSync`
- `TI_FullSync`
- `TI_RecalculateRecommendations`
- `TI_MaintenanceSync`
- `TI_BatchSyncContinue`
- `TI_AutoFullSync`
- `TI_AutoMaintenanceSync`

BatchSync acquires a Script Lock before start/state mutation and around each full
step execution. Persistent `running` state blocks another BatchSync mode between
trigger executions. The parallel hold/probe test passed.

## Previously independent lock

- `TI_RefreshFastDataNow` uses a Script Lock, but its entry point is not unified
  with a common public execution wrapper and its one-second timeout differs.

## Covered direct write entry points after the minimal diff

- `TI_SyncTrades`
- `TI_RebuildTrades`
- `TI_UpdatePrices`
- `TI_UpdateDirectory`
- `TI_OptimizeDirectoryExchangeOnly`
- `TI_StartDirectoryBatch` / `TI_DirectoryBatchContinue`

Trades, Prices, Directory and DirectoryBatch public/manual/trigger paths now
delegate through the shared project guard. Batch Quick/Full/Recalc/Maintenance use
the same Script Lock and persistent active-run state.

## Applied behavior

1. Uses `TI.SyncGuard.run(mode, source, callback)` with the project Script Lock.
2. Batch modes retain persistent active-run ownership between continuations.
3. Trades, Prices, Directory and DirectoryBatch wrappers delegate to guarded internals.
4. Trigger continuations validate ownership before writing.
5. A contender returns `BUSY`, writes one conflict diagnostic, and performs no work.
6. Lock release remains in `finally`; orchestration does not reacquire it in inner steps.

## Stable Recalc snapshot

- Captures dataRevision, startedAt, row counts and hashes for Trades, Portfolio,
  Accounts, Strategies, Account Strategies, Directory and relevant cached inputs.
- Validates the revision before write steps and again before finalization.
- On mismatch returns `INPUT_DATA_CHANGED_DURING_RUN`, writes no subsequent view,
  and records a warning with masked Run ID.
- Recalc snapshot/validation performs no external API calls.

`TI_TestGlobalSyncLock` passed remotely. A contender receives `BUSY`, records the
conflict and performs no protected work; release is in `finally`.
