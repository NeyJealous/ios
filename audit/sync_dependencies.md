# CODEX-03 synchronization dependencies

## Step dependency summary

| Step group | Modules | Primary reads | Primary writes | External API |
|---|---|---|---|---|
| quickData | MultiAccount, Accounts, Prices, DataCache | Счета, Портфель, cache | Data source cache/properties | T-Invest accounts/cash/positions/prices |
| portfolio | FIFO, Portfolio, Prices | Лоты FIFO, Справочник, cache | Портфель | Prices unless `skipPriceFetch` |
| history | Operations, Trades, FIFO | Счета, Сделки | Сделки, FIFO sheets | T-Invest operations cursor pages |
| directory | Directory, Providers, Prices | Справочник, Портфель, Сделки | Справочник/cache | T-Invest instruments/prices |
| knowledge | KnowledgeEngine, CompanyRating, BondEngine, AssetScoring, COI | local portfolio/directory/source data | Facts/Features/scores/ratings | indirect providers where configured |
| recommendations | StrategyEngine, Rebalance, TradePlan, DecisionEngine, Advisor | local strategy/portfolio/ratings | strategy targets and user views | none intended in Recalc |
| health/views | PortfolioHealth, PortfolioIntelligence, Main, Visualization, UI | derived local sheets | user-facing sheets/formatting | none intended |
| inflation | Inflation | Settings/cache | Инфляция | direct `UrlFetchApp.fetch` |

## Cache and properties

- Provider calls can use `TI.DataCache.remember` and the `Данные источников` sheet.
- Operations also use CacheService via `TI_GetCache` under `operations_v2`.
- Batch state and no-API flag use Script Properties.
- AutoDataRefresh stores its last result in Script Properties and has its own
  one-second Script Lock, but BatchSync does not share it.

## API boundary

- T-Invest HTTP: `TI.Api.call` → direct `UrlFetchApp.fetch`.
- Inflation HTTP: direct `UrlFetchApp.fetch` in `Inflation.gs`, outside `TI.Api`.
- No `fetchAll` call was found.
- A unified execution counter does not exist.

## Investment Universe

No canonical Investment Universe / Universe Diff module or sheet-specific pipeline
step exists. CODEX-03 must not invent CODEX-04 functionality.
