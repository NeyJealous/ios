# CODEX-02 Account/Strategy Migration Result

## Canonical local working copy

- Path: `C:\Users\NeyJealous\Documents\Инвест`
- Branch: `codex-02-account-strategy-core`
- Git root verified before changes.
- CODEX-02 baseline tag: `codex-02-baseline-20260712`.

## Backup

- backup name: `CODEX-02 Account Strategy Backup 20260712-151842`
- original Spreadsheet ID suffix: `…nR2p_4`
- backup Spreadsheet ID suffix: `…lL1qrs`
- sheet count: 40
- sheets covered by the migration: `Стратегии счетов`

## Preconditions

All required preconditions passed in dry-run:

- exactly 3 accounts with non-empty, unique Account IDs;
- exactly 1 strategy with a non-empty, unique Strategy ID;
- exactly 1 account–strategy link;
- link Account ID empty and Strategy ID column absent;
- link display account name `Пасивный` and strategy `Базовая стратегия`;
- exactly one canonical account `Пассивный` and one matching strategy;
- all Portfolio Account IDs valid;
- link headers and row counts unchanged since the read-only audit.

## Dry run

- Result: `PRECONDITIONS_OK`
- Target: `Стратегии счетов`, row 2
- Added column: `ID стратегии`
- Account mapping: empty → `…531683`
- Strategy mapping: empty → `…efault`
- Display correction: `Пасивный` → `Пассивный`
- No live data changed by dry-run.

## Changes applied

One operation under `LockService` applied the migration using batch read/write.
The result was `MIGRATION_APPLIED`, with a masked Run ID. Post-validation passed
inside the same operation; rollback was not required.

## Sheets changed

- `Стратегии счетов`: added hidden `ID стратегии`, populated Account ID and
  Strategy ID in row 2, corrected the account display name.
- `Диагностика`: appended one masked migration-result row.

No rows were deleted or reordered. Dates, flags, limits, reserve, comments,
formulas, allocations, Portfolio data, historical trades and operations were not
changed.

## Code changed

- `Schema.gs`: added hidden `strategyId` to `ACCOUNT_STRATEGIES`.
- `MultiAccount.gs`: Account ID and Strategy ID are the only identity keys for
  account–strategy links; missing, duplicate and dangling IDs now raise explicit
  errors instead of name fallback.
- `PortfolioHealth.gs`: groups and filters positions by Account ID and resolves
  Strategy ID before rendering Russian display names; added read-only aggregate
  and per-account diagnostic wrappers.
- `Portfolio.gs`: no longer exposes a technical Account ID as a display-name fallback.
- `AccountStrategyAudit.gs`: masked read-only live audit.
- `AccountStrategyMigration.gs`: dry-run, backup and atomic apply/rollback wrappers.

`Accounts`, `Strategy` and `StrategyEngine` were inspected; no change was required
for the account–strategy link identity path. Decision Engine, Advisor, TradePlan,
Reserve/Rebalance calculations, Quick/Full/Recalc and investment formulas were not changed.

## Post-validation

- Link Account ID populated and resolves to Accounts.
- Link Strategy ID populated and resolves to Strategies.
- Display account name is `Пассивный`; strategy display name remains `Базовая стратегия`.
- No duplicate links or empty mandatory IDs.
- Portfolio digest unchanged during migration.
- Link row count remained 1; audit counts remained 3 accounts, 1 strategy,
  1 link and 1 Portfolio position.

## Account strategy audit

- `ok=true`
- errors: 0
- warnings: 0

## Portfolio Health aggregate

- `ok=true`
- Portfolio positions: 1
- Included positions: 1
- Excluded positions in current Portfolio data: 0
- Market value: 10,204
- Non-zero market value: yes

## Portfolio Health by account

- `ok=true`
- Reports available for all 3 accounts.
- Two accounts are excluded from aggregate and currently have 0 Portfolio positions.
- `Пассивный` is included, has 1 position and market value 10,204.
- Its strategy resolves by masked Account ID → masked Strategy ID.

## Remote health

- `ok=true`
- Sheet count: 40
- Project version: 1.1.0

## clasp push

- Ordinary `clasp push` completed without `--force`.
- 52 files pushed.
- No deployment command was executed; production deployments were not changed.

## Round-trip

- Pull location: isolated read-only folder under `.codex-runtime`.
- Canonical files: 52
- Exact normalized matches: 52
- Mismatches: 0

## Rollback instructions

1. For data recovery, use backup `CODEX-02 Account Strategy Backup 20260712-151842`
   (`…lL1qrs`) or restore the masked-before shape documented in
   `audit/account_strategy_before_migration.json` using authoritative full IDs.
2. For source recovery, use Git tag `codex-02-baseline-20260712` or the CODEX-02
   baseline ZIP.
3. Do not modify production deployments during rollback.

## Remaining risks

- The persisted `Здоровье портфеля` sheet contains calculation rows last updated
  on 2026-07-06. Read-only runtime diagnostics use current Portfolio data and pass;
  rebuilding that sheet was intentionally not performed because this migration
  did not authorize changes to other sheets.
- Two excluded accounts do not have active account–strategy link rows because the
  approved migration covered the single existing link only. They remain available
  in per-account diagnostics and have no current Portfolio positions.

## Readiness to finish CODEX-02

Да — для утверждённого подэтапа Account ID / Strategy ID. CODEX-03 не начат.
