# CODEX-04A Account Scope Dataflow Audit

Generated from the canonical `.gs` set on 2026-07-15. This is a read-only
production-data audit. Static inventory: 581 relevant references in 40 files;
see `CODEX-04A-ACCOUNT-SCOPE-REFERENCES.json`.

## Canonical rule

`Account ID` is the only scope key. Display name, row number, account type and
legacy labels must not select an account. `AccountScope` reads the five flags in
one batch and caches the registry for the current execution. Unknown IDs and
missing flags resolve to disabled.

## Module findings

| Module | Required flag | Current path without the flag | Legacy / divergence risk | Planned boundary |
|---|---|---|---|---|
| Accounts | Sync, Calculation, Display | `active()` returns every open provider account; cash loops all active accounts | provider fallback automatically includes unknown accounts | discovery may read the account list once; all detailed account calls use `AccountScope` IDs |
| Operations | Sync, History | `operationAccounts()` filters `Активен`, then falls back to all provider-open accounts | target receives paginated Operations calls; global `operations_v2` cache mixes accounts | fetch only Sync IDs; retain/write only History IDs; remove provider fallback inclusion |
| Trades | History | converts every fetched operation and appends all new trades | no History gate | filter by exact Account ID before dedupe/write |
| Portfolio | Calculation | builds from all FIFO lots | no calculation filter; shares use the unfiltered total | build calculation portfolio from Calculation IDs only |
| Prices | Sync, Calculation | refresh derives work from current portfolio | disabled-account positions can cause price/enrichment work | accept already scoped instruments/positions only |
| Tax / FIFO | Calculation, History | FIFO reads all trades; Tax aggregates all FIFO sales | target history affects lots, gains and tax base | history input by History IDs; Tax input by Calculation IDs |
| Rebalance | Calculation, Recommendations | reads all portfolio and cash; account target matching is ID-based but ungated | legacy `includeTotal` and name-keyed cash can diverge | calculate from Calculation IDs; emit account actions only for Recommendation IDs |
| TradePlan | Recommendations, Display | strong ID validation exists, but every Rebalance row may proceed | no recommendation/display gate | filter account rows by Recommendation before build and Display before write |
| Decisions | Recommendations, Display | builds all TradePlan rows | schema has no Account ID; calls `strategyForAccount(row.accountName)` | add Account ID to rows/schema; use exact ID; gate recommendation and display |
| Advisor | Recommendations, Display | consumes portfolio, Tax, Health, Intelligence, Rebalance and TradePlan without scope | account association is display-name based in parts of the module | consume scoped sources; carry Account ID internally; filter before write |
| Portfolio Health | Calculation, Display | aggregate alone uses legacy `includeTotal`; account rows include all accounts | cash is name-keyed; target still appears as an account row | calculate from Calculation IDs; emit account rows only for Display IDs |
| Portfolio Intelligence | Calculation, Recommendations, Display | iterates all `Активен` accounts | calls `strategyForAccount(accountName)` instead of Account ID | iterate intersected Calculation/Recommendation/Display IDs and carry ID |
| Main | Display | consumes portfolio, Advisor and Intelligence outputs as-is | a disabled account can leak through upstream display-name rows | consume display-scoped outputs only |
| BatchSync | Sync | orchestrates Quick/Full but has no account-scope metrics | no discovered/enabled/skipped accounting | resolve Sync IDs before detailed steps and record required metrics |
| DataCache / fast refresh | Sync | detailed cash/positions/portfolio calls loop every `Активен` registry row | three detailed API calls are spent on target each fast cycle | loop Sync IDs only; clear exact account cache keys during migration |
| Facts | Calculation | instrument-level output has no Account ID | contamination is inherited from unfiltered upstream portfolio/trades | rebuild from calculation-scoped source data |
| Features | Calculation | instrument-level output has no Account ID | same inherited contamination | rebuild from calculation-scoped Facts/portfolio |
| Ratings / Scores | Calculation | instrument-level output has no Account ID | a target-only instrument can influence ratings if upstream is not scoped | retain system-wide instruments, but compute portfolio-derived features from scoped data |
| Diagnostics | Calculation, Display | reads all accounts and multiple unfiltered derived sheets | technical output may expose disabled account by display name | calculate checks on scoped sources; user-facing account rows use Display |
| Reserve Engine / Constitution | Calculation | total cash comes from all active accounts through Rebalance cash adapter | disabled cash changes reserve share and actions | total only Calculation IDs; no provider fallback in recalc |
| Strategy / StrategyEngine | Calculation, Recommendations | account-specific keys and defaults still contain display-name logic | name can become a key; legacy account targets can survive exclusion | Account ID for account scopes; target generation restricted to enabled IDs |
| MultiAccount | Registry owner / all flags | owns `Счета`; currently has `Активен` and `Включать в общий портфель` only | `syncAccounts()` rewrites the sheet and could drop new values unless preserved | preserve five flags by Account ID; new/unknown account defaults are all false |
| Triggers / menu wrappers | Delegate | wrappers call BatchSync and rebuild functions | direct manual entry points can bypass scope if consumers do not enforce it | every leaf module enforces scope; wrappers remain thin |

## Confirmed legacy defects

- `Operations.operationAccounts()` can fall back to all open provider accounts.
- `AutoDataRefresh.refreshFastSources()` performs Withdraw limits, Positions and
  Portfolio calls for every active row.
- `PortfolioHealth` applies legacy `includeTotal` only to the aggregate, while
  still rendering per-account rows.
- `DecisionEngine` and `PortfolioIntelligence` pass `accountName` to a function
  whose contract is Account ID.
- several user sheets have no Account ID column; five current rows refer to the
  target only by display name. Those rows must be removed by rebuild, never by a
  name-based delete.
- the generic schema preparer rewrites headers by ordinal position and does not
  insert middle columns safely. The five new fields therefore append after the
  existing `ID счёта` column (`J:N`).

## Required sync metrics

The planned BatchSync result contains `accountsDiscovered`,
`accountsSyncEnabled`, `accountsSkipped`, `skippedAccountIdSuffixes` and
`savedApiCallsEstimate`. Account discovery is allowed once; detailed requests
begin only after scope resolution.
