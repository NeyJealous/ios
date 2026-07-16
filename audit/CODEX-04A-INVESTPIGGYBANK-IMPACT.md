# CODEX-04A Invest Piggy Bank Impact

## Target

- Display name: `На тату`
- Account type: `Инвесткопилка`
- Status: `Да`
- Account ID suffix: `…864109`
- Registry row: 3
- Descriptor match: exactly one
- Account ID match: exactly one
- Current five flags: absent
- Proposed five flags: `false / false / false / false / false`

The display name and type were used only to discover the candidate in the
read-only snapshot. The pinned full Account ID in the ignored private archive is
the only migration predicate.

## Exact-ID impact

| Sheet | Exact ID rows | Legacy name-only rows | Action |
|---|---:|---:|---|
| Счета | 1 | 0 | preserve row; write five flags |
| Стратегии счетов | 1 | 0 | preserve link for reversible re-enable |
| Сделки | 160 | 0 | purge after approval |
| Операции | 0; sheet absent | 0 | no row delete |
| Портфель | 1 | 0 | purge current row |
| Данные источников | 17 | 0 | clear exact account cache records |
| Лоты FIFO | 6 | 0 | rebuild from remaining history |
| Продажи FIFO | 131 | 0 | rebuild from remaining history |
| Интеллект портфеля | 0 | 1 | rebuild; never delete by name |
| Здоровье портфеля | 0 | 1 | rebuild; never delete by name |
| Советник | 0 | 1 | rebuild; never delete by name |
| Визуализация | 0 | 1 | rebuild; never delete by name |
| Кэш | 0 | 1 | clear by exact account cache key, then rebuild |

Exact Account ID rows total 317: 160 history, 19 current/registry and 138
classified derived/registry rows. Controlled direct purge is 178 rows (160
Trades + 1 Portfolio + 17 data-cache records). The 137 FIFO rows are rebuild
outputs, not an independent manual history purge. Two registry/link rows are
preserved.

Required zero-count outputs in the snapshot: Main, Tax, Rebalance, TradePlan,
Decisions, Facts, Features, Scores and Diagnostics. They still require rebuild
or validation because aggregate contamination can exist without an Account ID
column.

## History invariant

- Trades before: 166
- Target trades: 160
- Other-account trades before: 6
- Other-account trades expected after: 6
- Operations before/target/other: 0 / 0 / 0

No delete predicate uses display name, row number or account type.

## Backup and archive

- Google Sheets backup suffix: `…965QXM`
- Local XLSX SHA-256:
  `DFC1A78DF402304D0057A6009AD257E98B3F65B738266A30A5A516B9ECC7C751`
- Private archive is under `audit/account-archive/invest-piggy-bank/` and is
  ignored by Git.
- Archive contains manifest, Trades, Operations, Portfolio, derived data and a
  migration summary.

