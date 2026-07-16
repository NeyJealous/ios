# CODEX-04A Invest Piggy Bank Audit

> Gate A update: target `…864109` now has five explicit `false` flags. The audited 160 Trades, 1 Portfolio row and 17 cache rows remain present and unchanged.

## Outcome

The target is unique: display name `На тату`, type `Инвесткопилка`, Account ID
suffix `…864109`, registry row 3. The account row is retained permanently.

Production source data was not edited. A Google Sheets backup and a local XLSX
snapshot were created; the account archive is private and ignored by Git.

## Read-only evidence

- Exact-ID rows: 317 across seven sheets.
- Name-only legacy rows: 5 across Intelligence, Health, Advisor, Visualization
  and Cache.
- Trades: 160 target of 166 total; six other-account trades remain invariant.
- Operations: zero; the expected `Операции` sheet is absent.
- Portfolio: one target position.
- Account-specific data cache: 17 rows.
- FIFO: six open lots and 131 sale rows.
- Target account-strategy link: one, preserved.
- Broker API calls during audit/dry-run: zero.

## Dry-run

Offline preview result: `DRY_RUN_PASS_OFFLINE_PREVIEW`.

- exact direct delete set: 178 rows;
- other accounts touched by delete: false;
- other-account history decreases: false;
- delete by display name: false;
- expected future Sync IDs after flags: two enabled, one skipped;
- repeated migration expected result: `ALREADY_EXCLUDED`.

This is not yet the final remote migration dry-run. The remote check is gated on
deployment and flag initialization.

## Current flag state

The five requested columns do not exist. Legacy values are `Активен=Да` and
`Включать в общий портфель=Нет`. Legacy values are not treated as the new
canonical scope.

## Proposed initialization

| Account suffix | Sync | Calculation | Display | Recommendations | History |
|---|---:|---:|---:|---:|---:|
| `…020546` | true | false | true | false | true |
| `…864109` | false | false | false | false | false |
| `…531683` | true | true | true | true | true |

This mapping preserves the current aggregate inclusion of the non-target
accounts while making every future scope explicit.
