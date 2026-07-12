# CODEX-03 Incident Report

## Classification

`CONCURRENT_MANUAL_SYNC_DURING_RECALC_TEST`

## Confirmed cause

The owner manually started trade updates and other synchronization operations
while Codex was executing the controlled Recalc test. The 13 additional Trades
rows and other sheet changes are therefore legitimate external production changes.

- This is not evidence that Recalc wrote to `Сделки`.
- Recalc itself recorded `apiCallCount=0`.
- The new Trades rows are production data and must not be rolled back or deleted.
- No Google Sheets rollback was performed.

## Recalc stop

Recalc stopped at `tradePlan` after four completed local steps. The exact error
was caused by `TradePlan` passing the display scope `Все счета` into the strict
Account-ID lookup introduced in CODEX-02. This is a deterministic code-boundary
defect, not corrupt trade data.

Primary failure classification: `CODE_DEFECT`.

The concurrent run separately demonstrates a `LOCK_SCOPE_DEFECT`: public manual
entry points such as direct Trades/Prices/Directory updates do not participate in
the BatchSync project-wide lock.

## Data preservation

- Trades before incident baseline: 149 rows.
- Trades in the accepted post-incident baseline: 162 rows.
- New rows: 13, owner-confirmed legitimate.
- Full-row duplicates among the 13: 0.
- Invalid rows: 0.
- Trade ID `1094` repeats an older short ID, but the approved composite key and
  checksum identify it as a distinct `VALID_NEW_TRADE`.

No rows were removed or modified during this investigation.

## Backups

- Full post-incident spreadsheet copy:
  `CODEX-03 Post Incident Full Backup 20260712-1616`, suffix `…RJDT0k`.
- Earlier Portfolio Health-only backup remains available at suffix `…pBu3n4`.

## Resolution status

The composite TradeKey, ID-safe TradePlan boundary, global guard and stable
dataRevision were implemented and remotely tested. The single authorized dry-run
passed with zero API calls and zero Trades/Operations writes. No full Recalc,
Quick or Full run occurred.
