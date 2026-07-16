# CODEX-04A Gate A Report

## Baseline

- Branch: `codex-04a-account-scope`
- Baseline tag: `codex-04a-baseline-20260715`
- Baseline commit: `402dbd0`
- Google Sheets backup: exists
- Private account archive: exists and is Git-ignored

## AccountScope implementation

The canonical `TI.AccountScope` reads the Accounts sheet in one batch, caches it for the execution, and makes every decision using exact Account ID. Unknown accounts and missing/invalid flags are disabled.

## Files changed

AccountScope was integrated into Accounts, Operations, Trades, FIFO, Portfolio, Tax, Rebalance, Constitution/Reserve, Portfolio Health, Portfolio Intelligence, TradePlan, Decision Engine, Advisor, Main, Strategy, Visualization, Directory enrichment, DataCache, Quick/Full telemetry and MultiAccount registry refresh.

## Flag columns

The Accounts sheet now has five boolean columns: `Синхронизировать`, `Учитывать в расчётах`, `Показывать`, `Использовать в рекомендациях`, `Хранить историю`.

## Flag values by account

| Account | Sync | Calculation | Display | Recommendations | History |
|---|---:|---:|---:|---:|---:|
| `…020546` | true | false | true | false | true |
| `…864109` | false | false | false | false | false |
| `…531683` | true | true | true | true | true |

## Sync integration

Quick and Full previews include only `…020546` and `…531683`. Target planned calls for account details, positions, withdraw limits, operations, trades, cash and enrichment are all zero. Metrics: discovered 3, enabled 2, skipped 1, saved API-call estimate 5.

## Calculation integration

Portfolio, FIFO, Tax, Rebalance, Reserve, Portfolio Health, Portfolio Intelligence, Main totals and strategy aggregates consume Calculation-enabled rows.

## Display integration

Portfolio-facing views, Portfolio Health account rows, Portfolio Intelligence, Advisor, TradePlan, Main and selectors consume Display-enabled rows.

## Recommendation integration

Decision Engine, Rebalance actions, TradePlan and Advisor reject disabled or unknown account IDs. Display names are not used as technical keys.

## History integration

Operations and Trades require both Sync and History. Existing 160 target Trades remain intact until Gate B.

## MultiAccount preservation

Registry discovery preserves existing flags by Account ID. New unknown accounts are added with five `false` values. Remote preservation test: PASS.

## Remote dry-run

PASS. API calls 0. Direct Gate B set: 160 Trades + 1 Portfolio + 17 cache = 178. Other six Trades remain.

## Recalc preview

PASS. API calls and all writes are zero. Target rows are logically excluded and identified for future rebuild.

## API impact

The target has zero planned account-specific calls in future Quick/Full runs. One of three discovered accounts is skipped before detailed API acquisition.

## Round-trip

PASS: 58/58 canonical files exactly match the pulled remote source.

## Privacy

PASS: the full target Account ID is absent from Git-visible files; `.clasp.json`, backups and the private archive are not tracked.

## Production data changes

None, except the explicitly authorized Accounts-sheet flag initialization (five headers and 15 boolean cells). No production data row was purged; no FIFO or derived/UI rebuild was executed.

## Production deployment

Unchanged: the same 15 deployments and versions remain.

## Exact Gate B requested

- Trades: delete 160 exact Account-ID rows
- Portfolio: delete 1 exact Account-ID row
- Cache: delete 17 exact Account-ID rows
- Derived rebuild: FIFO, Tax, Rebalance, Decisions, TradePlan, Advisor, Portfolio Health, Portfolio Intelligence, Visualization and Main
- Rollback: Google Sheets backup + private per-account archive + Accounts flag snapshot

Gate B requires separate user authorization.

## Recovery after network interruption

- what completed before interruption: source push, atomic 15-cell flag initialization, remote tests, dry-run, Recalc preview, health, round-trip and privacy checks.
- what was verified: remote/local 58/58, actual five-dimensional flags, zero purge/rebuild, unchanged deployment inventory.
- what was resumed: a read-only five-scope diagnostic and a minimal Display-versus-Calculation separation fix, followed by full regression.
- duplicate writes avoided: the initializer was not called again and no flag cell was rewritten.
- final remote state: Gate A checks PASS; target disabled in all scopes; `…020546` is sync/history/display-only; Gate B not executed.
