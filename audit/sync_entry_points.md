# CODEX-03 synchronization entry points

## Public entry points

| Mode | Menu label | Top-level function | Continuation |
|---|---|---|---|
| Quick | Быстро обновить портфель | `TI_QuickSync` | `TI_BatchSyncContinue` |
| Full | Полная синхронизация данных | `TI_FullSync` | `TI_BatchSyncContinue` |
| Recalc | Пересчитать рекомендации | `TI_RecalculateRecommendations` | `TI_BatchSyncContinue` |
| Maintenance | Обновить редкие данные сейчас | `TI_MaintenanceSync` | `TI_BatchSyncContinue` |

Scheduled entry points are `TI_AutoFullSync` (despite the name, it runs Quick)
and `TI_AutoMaintenanceSync`. Menu entries match the three requested user modes.

## State, triggers and errors

- State is serialized in Script Properties under `TI_BATCH_SYNC_STATE`.
- Recalc sets `TI_BATCH_SYNC_NO_API=Да` while active.
- Every completed step schedules a new time trigger for `TI_BatchSyncContinue`.
- On an exception, state becomes `error`, the step trigger is removed, no-API mode
  is cleared, and the original exception is rethrown.
- There is no Run ID, duration, step metrics, warning list or safe user error summary.
- There is no single lock around start/continuation/finish; parallel starts can
  overwrite the same Script Property and triggers.

## Current mode behavior

### Quick

Reads Accounts, Portfolio/FIFO, cache and strategy inputs. It refreshes account
cash and price caches through T-Invest providers, rebuilds Portfolio and writes
Market Regime, Rebalance, Trade Plan, Decisions, Portfolio Health, Portfolio
Intelligence, Advisor, Main and UI formatting.

It does not explicitly rebuild Trades or Directory, but it currently exceeds the
canonical Quick scope through Decisions, Portfolio Intelligence, Rebalance,
Market Regime and UI.

### Full

Initializes schemas; rebuilds Trades, Directory groups/prices, FIFO, Portfolio,
Visualization, Income, Inflation, account/strategy defaults, strategy and all
heavy analytics/user views. It invokes T-Invest and the external inflation source.

`trades` currently calls destructive `TI.Trades.rebuild()`, so Full is not
incremental and is unsafe if an API failure occurs after the sheet is cleared.

### Recalc

Uses `Portfolio.rebuild({skipPriceFetch:true})` and then local analytical/view
steps. Market Regime itself reads local Constitution settings. The registry does
not include Trades, Directory, Knowledge or Inflation. However, no execution-wide
API counter or hard guard proves that indirect external calls remain zero.

### Maintenance

Refreshes rare Directory/Inflation/heavy analytical data and views. It is separate
from the three user-facing modes but shares the same unprotected BatchSync state.

## Repeatability

- View rebuilds mostly clear and batch-write their own derived sheets, making a
  successful repeat deterministic but not atomic.
- Trade sync has a unique `tradeId` filter and batch append, but Full bypasses it
  by calling destructive rebuild.
- Directory merge is upsert-like, then rewrites the full derived Directory.
- A failed multi-step run can leave earlier sheets updated and later sheets stale.
