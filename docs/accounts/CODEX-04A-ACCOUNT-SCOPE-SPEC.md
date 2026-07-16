# CODEX-04A Account Scope and Exclusion Plan

> Gate A implementation status (2026-07-16): PASS. Five-dimensional AccountScope is deployed at HEAD; production purge remains forbidden pending Gate B authorization.

## Target account

- display name: `На тату`
- Account ID suffix: `…864109`
- type: `Инвесткопилка`
- status: active (`Да`)
- current flags: all five columns are absent
- proposed flags: Sync=false, Calculation=false, Display=false,
  Recommendations=false, History=false

The full identifier is stored only in the ignored private migration archive.
All runtime selection and deletion use exact Account ID. Name/type are display
and audit metadata only.

## Rows by sheet

The authoritative machine-readable inventory is
`audit/CODEX-04A-ACCOUNT-ROW-COUNTS.json`.

| Category | Rows | Treatment |
|---|---:|---|
| Trades history | 160 | exact-ID purge after approval |
| Operations history | 0 | sheet absent; nothing to delete |
| Portfolio current | 1 | exact-ID purge |
| Account-specific cache | 17 | exact-ID/key cleanup |
| FIFO lots/sales | 6 / 131 | rebuild, not blind deletion |
| Registry / account-strategy link | 1 / 1 | preserve |
| Name-only user/derived rows | 5 | rebuild only; never match by name |

Other-account Trades remain 6 before and after the planned purge.

## API impact

Current code spends account-specific calls on every active row. For the target,
at least Withdraw limits, Positions, Portfolio and Operations are avoidable each
cycle, plus pagination and enrichment. Planned metrics:

- `accountsDiscovered = 3`
- `accountsSyncEnabled = 2`
- `accountsSkipped = 1`
- `skippedAccountIdSuffixes = ["…864109"]`
- `savedApiCallsEstimate >= 4` detailed endpoint calls per cycle, plus pages

The general Accounts discovery call remains permitted once.

## Proposed AccountScope architecture

`AccountScope.gs` is the single registry reader. It batches `Счета`, validates
unique Account IDs and caches one immutable snapshot per execution. It exposes:

```javascript
getSyncEnabledAccountIds()
getCalculationEnabledAccountIds()
getDisplayEnabledAccountIds()
getRecommendationEnabledAccountIds()
getHistoryEnabledAccountIds()
isSyncEnabled(accountId)
isCalculationEnabled(accountId)
isDisplayEnabled(accountId)
isRecommendationEnabled(accountId)
isHistoryEnabled(accountId)
```

Unknown IDs, empty IDs and missing flag values are never enabled. The five
columns append at `J:N` to avoid the existing ordinal Schema preparer shifting
legacy data.

## Sync filtering

BatchSync resolves Sync IDs before Operations, Trades, cash, positions,
portfolio and account enrichment. `Operations.operationAccounts()` must lose
its automatic provider-open fallback. DataCache fast refresh must iterate only
Sync IDs. History writes additionally require History=true.

## Calculation filtering

Portfolio/FIFO-derived aggregates, Tax, Rebalance, Reserve/Constitution,
Portfolio Health, Intelligence, Facts, Features and portfolio-derived Ratings
use Calculation IDs. Instrument master data remains system-wide and is not
deleted merely because an instrument occurred in the target account.

## UI filtering

Main, Portfolio, Portfolio Health, Advisor, TradePlan and user reports filter
account rows with Display IDs. Outputs without an Account ID column must carry
the ID internally or be rebuilt from already display-scoped inputs.

## Recommendation filtering

Rebalance actions, TradePlan, Decisions, Advisor and Intelligence account
recommendations require Recommendations=true. Existing name-as-key calls in
DecisionEngine and PortfolioIntelligence must be replaced with Account ID.

## Data archive

- Full Google Sheets backup created: suffix `…965QXM`.
- Local read-only XLSX created and hashed.
- Private exact-ID archive created and excluded from Git and Apps Script push.
- Local code baseline: tag `codex-04a-baseline-20260715`, commit `402dbd0`.
- Local source ZIP SHA-256:
  `02A8BF84076024789BFA56DE461E7DD6B08C135676FDB42F7DC814CE0890C95B`.

## Purge plan

Direct delete after the data-change gate:

- Trades: 160 exact-ID rows.
- Operations: 0 rows.
- Portfolio: 1 exact-ID row.
- Data source/cache: 17 exact-ID/key rows.

Preserve the Accounts row and account-strategy link. Clear account cache keys.
Do not delete Directory/Universe instruments. Derived sheets are rebuilt from
remaining enabled accounts.

## Recalc plan

Rebuild FIFO, Tax, Rebalance, Decisions, TradePlan, Advisor, Portfolio Health,
Portfolio Intelligence, Visualization and Main. Validate two identical Recalc
runs and verify target zero in all outputs.

## Rollback

Stages are PRECHECK, BACKUP, ARCHIVE, SET_FLAGS, PURGE_HISTORY, PURGE_CURRENT,
CLEAR_ACCOUNT_CACHE, RECALC_DERIVED, VALIDATE and COMMIT. Before COMMIT, restore
only target rows from the private archive and restore prior flags. The full
Google Sheets backup is the external recovery point. Other accounts are never
rolled back wholesale. Any failure produces an incident report.

## Risks

- The remote code does not yet enforce the new flags; local preparation has not
  been pushed.
- A live Execution API dry-run cannot run until the safe source is deployed and
  flag columns initialized.
- Schema header preparation is ordinal; inserting columns in the middle would
  corrupt column meaning, so flags append only.
- Five derived rows expose only display name and require rebuild.
- The historical Git Script-ID caveat remains unchanged; history was not
  rewritten.

## Exact data-change gate requested

Purge authorization is deliberately **not requested yet**. First authorize the
non-delete staging gate: ordinary source push, append `J:N`, initialize all 15
flag cells for the three accounts, run the remote read-only dry-run and preview
Recalc. After those checks pass, the exact purge gate will request authorization
for 178 direct exact-ID rows plus derived rebuilds described above.
