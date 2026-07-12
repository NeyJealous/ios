# CODEX-02 — Account/Strategy ID migration plan

## Status

- Planning only; migration has not been applied.
- Source: read-only live audit on 2026-07-12 (`persist=false`).
- All identifiers below are masked to their last six characters.

## Confirmed live state

| Area | Result |
|---|---:|
| Accounts | 3 rows; ID column present; 0 empty IDs; 0 duplicate IDs |
| Strategies | 1 row; ID column present; 0 empty IDs; 0 duplicate IDs |
| Account–strategy links | 1 row |
| Portfolio positions | 1 row; account ID present and resolves to Accounts |
| Portfolio health | 4 rows |

The only account–strategy link has these defects:

- `ID счёта` is empty;
- `ID стратегии` column is absent;
- account display name is `Пасивный`, while the canonical Accounts row is `Пассивный`;
- the strategy display name resolves uniquely to the sole strategy.

Safe proposed mapping:

| Link display value | Canonical entity | Target ID suffix |
|---|---|---|
| `Пасивный` | account `Пассивный` | `…531683` |
| `Базовая стратегия` | strategy `Базовая стратегия` | `…efault` |

## Proposed live-data migration

1. Re-run the read-only preflight and require the same invariants: three unique accounts, one unique strategy, one link, no unknown portfolio account IDs.
2. Add `ID стратегии` to `Стратегии счетов` without deleting or reordering existing columns.
3. Populate the single link with account ID `…531683` and strategy ID `…efault`, using the full values read from the authoritative `Счета` and `Стратегии` rows at execution time—not hard-coded IDs.
4. Correct the link's display-only account name from `Пасивный` to `Пассивный`.
5. Preserve dates, active flag, limits, reserve, comment, allocation formulas and every unrelated cell unchanged.
6. Validate referential integrity and uniqueness, then persist a masked diagnostic summary.

## Proposed minimal code diff after migration

- `Schema.gs`: declare `ID стратегии` for `Стратегии счетов`.
- `MultiAccount.gs`: resolve account–strategy links by Account ID and Strategy ID; names remain display fields only. Remove name fallback only after migrated rows validate.
- `PortfolioHealth.gs`: group/filter/join account data by Account ID; render the account name from the Accounts lookup.
- `StrategyEngine.gs`: use Account ID in target keys and Strategy ID for strategy selection.
- `Rebalance.gs`: scope/filter by Account ID; keep names only in user-facing output.
- Add read-only diagnostics covering missing IDs, duplicate IDs, dangling references and name/ID disagreement.

No strategy formulas, allocations, Decision logic, Reserve logic, synchronization semantics or production deployment access will be changed.

## Validation and rollback

Validation after the data migration:

- all Account IDs in links and Portfolio resolve to `Счета`;
- all Strategy IDs in links resolve to `Стратегии`;
- no identity join depends on `Счёт` or `Стратегия` display text;
- `TI_AuditAccountStrategyLinks()` returns no missing-column or name-only-link finding;
- `TI_RemoteHealthCheck` remains `ok=true`;
- ordinary `clasp push` only, never `--force`;
- remote/local round-trip remains exact after `.gs`/`.js` normalization.

Rollback:

- restore the affected `Стратегии счетов` row and schema from the CODEX-02 baseline backup;
- restore source from tag `codex-02-baseline-20260712` if code validation fails;
- do not alter production deployments during rollback.

## Approval gate

Applying the migration changes live Google Sheets data and requires explicit user approval. This document does not authorize that write.
