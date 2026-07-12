# Account / Strategy Dataflow

## Canonical model required by CODEX-02

```text
Счета.accountId
  -> Стратегии счетов.accountId

Стратегии.strategyId
  -> Стратегии счетов.strategyId

Портфель.accountId
  -> Счета.accountId
```

Names are display-only and must not be runtime keys.

## Static dataflow found

| Module | Reads | Writes | Current key behavior | Finding |
|---|---|---|---|---|
| `Accounts.gs` | Broker account API | none | `byId` uses account ID; display map separates name | Mostly ID-based; `cashByAccountName` is misnamed but stores ID keys plus aggregate key |
| `Strategy.gs` | Portfolio and MultiAccount accounts | Strategy sheet/validation cache | dropdown values use `accountName` | Name-based UI/runtime coupling |
| `StrategyEngine.gs` | Strategy rows | Strategy rows | target identity includes normalized `accountName` | Name is used as a persistent target key |
| `MultiAccount.gs` | Accounts, Strategies, Account Strategies | same sheets during initialization/sync | account sync falls back from `accountId` to account name; strategy maps are name-keyed | Violates ID-only rule |
| `Portfolio.gs` | Broker positions, directory, prices | Portfolio | stores both `accountId` and `accountName` | Required ID exists; downstream code often ignores it |
| `PortfolioHealth.gs` | Portfolio, MultiAccount, Rebalance cash | Portfolio Health | filters, groups and resolves strategies by `accountName` | Critical CODEX-02 defect |
| `Rebalance.gs` | Portfolio and Strategy targets | Rebalance output | portfolio scopes are matched by normalized `accountName` | Name-keyed calculations; formulas must remain unchanged while key selection changes |
| `Advisor.gs` | Portfolio, Portfolio Health, decisions | Advisor | consumes display scope names | Downstream display consumer; no direct ID model |
| `TradePlan.gs` | Rebalance/decisions/portfolio | Trade Plan | largely consumes upstream scope | Must inherit corrected IDs without changing trade formulas |
| `Schema.gs` | schema definitions | sheet structure | Accounts, Strategies and Portfolio contain IDs; Account Strategies lacks `strategyId` | Schema migration required |
| `Config.gs` / `Core.gs` | constants | none | sheet names only | No key defect found |

## Critical paths

1. `Portfolio.accountId` is present but `PortfolioHealth` groups positions by `accountName`.
2. `MultiAccount.syncAccounts` contains an exact-name fallback after ID lookup.
3. `MultiAccount` strategy mapping uses display strategy names.
4. `StrategyEngine` and `Rebalance` scope targets by account name.
5. `ACCOUNT_STRATEGIES` has `accountId` but no `strategyId` field in the current schema.

No code or sheet data has been migrated yet.

