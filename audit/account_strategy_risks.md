# Account / Strategy Risks

## Critical

1. `PortfolioHealth` ignores the available `Portfolio.accountId` and keys inclusion, account grouping and strategy lookup by account name.
2. `MultiAccount.syncAccounts` can reuse an existing row through an account-name fallback when an ID lookup misses.
3. `ACCOUNT_STRATEGIES` has no `strategyId` schema field, so the required ID-to-ID strategy link cannot yet be represented canonically.

## High

1. `StrategyEngine` identifies targets by normalized account name.
2. `Rebalance` selects portfolio scopes using account names.
3. Strategy maps are keyed by display strategy names rather than Strategy ID.
4. Empty/duplicate ID validation is not centralized before calculations.

## Medium

1. Portfolio rows carry both ID and name, allowing downstream code to accidentally choose the display field.
2. Excluded-account aggregate behavior is name-dependent; individual rows may remain available but are not proven against live data.
3. The strings `Пассивный` / `Пасивный` do not occur in canonical code, indicating that the observed defect is likely caused by live data used as a key.

## Safety boundary

- No live sheet was changed.
- No strategy allocation, formula, sync mode, Decision Engine or Reserve Engine code was changed.
- Migration requires a live read-only snapshot and a separately approved plan.
