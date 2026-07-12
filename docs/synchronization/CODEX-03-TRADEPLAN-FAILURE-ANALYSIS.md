# CODEX-03 TradePlan Failure Analysis

## Classification

`CODE_DEFECT`

Secondary concurrency finding: `LOCK_SCOPE_DEFECT`.

## Exact failure

Recalc completed `portfolioNoApi`, `marketRegime`, `strategyTargets` and
`rebalance`, then stopped in `tradePlan` with a masked error indicating that an
active strategy could not be found for the value `Все счета`.

`TradePlan.gs` calls `TI.MultiAccount.strategyForAccount(row.accountName)` in
reserve, fallback, rebalance and position paths. `row.accountName` is a display
scope and can equal `Все счета`; `strategyForAccount` now requires Account ID.

The failure is deterministic and does not depend on the 13 new trades. Concurrent
data changes made the test snapshot inconsistent, but they did not create this call-site defect.

## Preconditions and dependencies

- Account/Strategy IDs validate successfully.
- Rebalance produces aggregate rows with display scope `Все счета`.
- TradePlan depends on persisted Rebalance rows and Portfolio.
- No stale row index is used at the failing call site.
- The lock protected BatchSync steps, but direct manual sync wrappers bypassed it.

## Applied minimal correction

1. Added hidden Account ID / Strategy ID fields to the Rebalance and TradePlan data path.
2. Account ID is propagated from account-scoped targets/positions; aggregate rows carry
   an explicit aggregate scope and no fabricated Account ID.
3. Aggregate strategy resolves through the configured default Strategy ID, never
   through the display text `Все счета`.
4. Replaced all four TradePlan `strategyForAccount(row.accountName)` calls with a
   single ID-aware helper.
5. Added remote tests covering aggregate, valid account, missing/unknown ID and
   the rule that a Russian display name is never a key.

Remote scope tests and the dry-run TradePlan preconditions passed. Technical
linkage changed; allocation, amount, lot, reserve and recommendation formulas did not.
