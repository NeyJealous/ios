# CODEX-03 Post-Incident Data Baseline

## Backup

- Name: `CODEX-03 Post Incident Full Backup 20260712-1616`
- Spreadsheet suffix: `…RJDT0k`
- Type: full Google Sheets copy
- Original suffix: `…nR2p_4`
- Source sheet count: 40

## Accepted production state

- `Сделки`: 162 rows (149 prior + 13 owner-confirmed legitimate rows)
- `Портфель`: 2 rows
- `Главная`: 19 rows
- `Здоровье портфеля`: 4 rows (still stale)
- `Советник`: 18 rows
- `План сделок`: 3 rows
- `Диагностика`: 41 rows
- `Справочник`: 1,895 rows
- `Кэш`: 1,895 rows
- `Данные источников`: 37 rows

The JSON baseline contains masked IDs and digest suffixes for 14 relevant and
concurrently changed sheets. Full source IDs and tokens are not stored.

There is no standalone `Операции` sheet. Operations are fetched/cached and
normalized into `Сделки`. There is no standalone `Цены` sheet; price state is
represented by Portfolio, Directory, Cache and Source Data.

## New trades

- New rows validated: 13
- Valid: 13
- Full duplicates: 0
- Invalid: 0
- Requires key-model review: 0
- Latest new trade timestamp: 2026-07-12T07:45:44.337500Z

All 13 rows are preserved as production data. The repeated Trade ID `1094` is
`VALID_NEW_TRADE`: its composite Account ID + Operation ID + Trade ID key is unique.

## Artifacts

- `audit/CODEX-03-POST-INCIDENT-DATA-BASELINE.json`
- `audit/CODEX-03-NEW-TRADES-VALIDATION.json`
- `audit/codex03_post_incident_digests.json`
- `audit/codex03_post_incident_masked_sheets.json`
