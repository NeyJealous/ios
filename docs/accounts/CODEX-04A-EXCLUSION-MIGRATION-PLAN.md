# CODEX-04A Exclusion Migration Plan

> Gate A completed without purge. Gate B direct controlled delete set is confirmed at 178 exact Account-ID rows and still requires separate authorization.

## Gate 0 — completed read-only preparation

- branch `codex-04a-account-scope` created;
- tag `codex-04a-baseline-20260715` created;
- Git ZIP and Google Sheets backup created;
- target Account ID uniquely pinned and archived privately;
- static dataflow and references inventories created;
- offline dry-run passed with zero broker API calls;
- no purge, source-sheet mutation, clasp push or deployment change performed.

## Gate A — non-delete staging (requires separate approval)

1. Complete leaf-module integration with `AccountScope`.
2. Run local scope/API-guard tests.
3. Ordinary `clasp push`; never `--force`; do not change deployments.
4. Append `Счета!J:N` and initialize the 15 boolean cells shown in the audit.
5. Run `TI_DryRunExcludeAccount` with the privately pinned exact Account ID.
6. Confirm zero provider calls for the skipped ID and required BatchSync metrics.
7. Run Recalc preview against backup/fixture and prove idempotence.

No history/current row deletion is authorized by Gate A.

## Gate B — controlled production purge (not yet requested)

Execute under the global lock and migration journal:

1. PRECHECK — compare target suffix, backup/archive hashes and before counts.
2. SET_FLAGS — verify target five flags false.
3. PURGE_HISTORY — delete 160 Trades and zero Operations rows by exact ID.
4. PURGE_CURRENT — delete one Portfolio row.
5. CLEAR_ACCOUNT_CACHE — remove 17 exact-ID records plus known exact account
   cache keys and the hashed incremental marker.
6. RECALC_DERIVED — rebuild FIFO, Tax, Rebalance, Decisions, TradePlan,
   Advisor, Health, Intelligence, Visualization and Main.
7. VALIDATE — run the 20 acceptance checks and reconcile six remaining Trades.
8. COMMIT — write the migration completion marker. A repeated run returns
   `ALREADY_EXCLUDED`.

## Exact write set

- `Счета!J1:N1`: five headers.
- `Счета!J2:N4`: 15 explicit booleans.
- BatchSync diagnostics/metrics after approved execution.
- Full rewrite of listed derived sheets by their canonical rebuild functions.

## Exact direct delete set

- `Сделки`: 160 archived exact-ID rows.
- `Операции`: 0 rows; sheet absent.
- `Портфель`: row 2 in the audited snapshot.
- `Данные источников`: 17 audited exact-ID/key rows.

FIFO and name-only user rows are rebuild outputs. `Счета` row 3 and `Стратегии
счетов` row 4 are preserved. Directory/Universe are untouched.

## Rollback before COMMIT

Restore the target Trades, Portfolio and account cache records from the private
archive; restore the prior five flags; rebuild derived sheets. Never restore or
replace other-account rows. If row-level rollback fails, stop and use the full
Google Sheets backup `…965QXM`; record an incident report.

## Acceptance checks

The final gate covers exact-ID flag reads, conservative unknown IDs, zero target
provider calls, zero target Trades/Operations/Positions/cache, unchanged other
history, zero duplicates, scoped aggregate/Health/Tax/Rebalance/Reserve,
zero target Advisor/TradePlan/Decisions/Main, idempotent Recalc and sync, and
`ALREADY_EXCLUDED` on repeat.
