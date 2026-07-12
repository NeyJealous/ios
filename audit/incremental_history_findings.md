# CODEX-03 incremental history findings

## Current behavior

- `Operations.fetchAccount` paginates with the remote API cursor, but the cursor is
  only a page cursor for one request window and is not persisted as a sync marker.
- Every forced operations refresh uses the global configured start date through now.
- Operations are deduplicated in memory by operation identity and cached only in
  CacheService; there is no durable last-operation timestamp/cursor.
- `Trades.sync()` reads existing `tradeId` values in one batch, filters new rows and
  appends them with one `setValues`; this is repeat-safe for stable trade IDs.
- `Trades.rebuild()` clears the complete Trades body before forcing a full operations
  reload. Full Sync currently invokes this destructive path.
- An API error during `Operations.get(true)` occurs after the Trades sheet is cleared,
  so existing local history can be lost.

## Safety assessment

- Unique row key: present (`tradeId`).
- Duplicate protection: present in `Trades.sync`, bypassed by Full.
- Durable incremental cursor/timestamp: absent.
- Backfill: possible only by moving the global start date and reloading everything.
- API failure preserves history: no, not in current Full path.
- FIFO business logic: independent and must remain unchanged.

## Minimal correction plan

1. Change the Full registry's `trades` handler from `Trades.rebuild()` to
   `Trades.sync()` so existing history is never cleared.
2. Keep the current `tradeId` uniqueness guard and batch append.
3. Record a per-account last successful operation timestamp/overlap marker only
   after a successful fetch and write; use a conservative overlap window so late
   operations can be recovered.
4. Deduplicate the overlap by `tradeId` before append.
5. Add dry-run counts and repeat-run tests; do not change operation normalization,
   trade economics or FIFO calculations.

This is a plan only. No history code or production data has been changed yet.
