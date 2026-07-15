# CODEX-03 Sync Defects and Fixes

## DATA_REVISION_CHANGED

Recalc rewrote Constitution/cache support data during local strategy-target work.
The Recalc route now skips defaults and validation-list refresh. Verified by two
zero-API completed runs.

## TRADE_KEY_CONFLICT

API microsecond timestamps and Sheets millisecond Dates produced a false checksum
conflict. Trade timestamps are normalized to ISO millisecond precision. Composite
key remains Account ID + Operation ID + Trade ID.

## DECISION_PIPELINE_DEFECT

Advisor extracted numeric values from recommendation text as pseudo-tickers.
Text-derived candidates are now accepted only when present in the Directory ticker
map. Remote validation found zero numeric pseudo-tickers and zero ticker `00`.

## UNEXPECTED_API_CALL_DURING_LOCAL_STEP

Rebalance-derived local steps called T-Invest cash providers. The fix adds:

- ID-keyed cached-only cash reading;
- explicit `ONLINE_ALLOWED` / `CACHED_ONLY` execution policy;
- centralized pre-HTTP API guard and masked telemetry;
- `CACHED_CASH_NOT_AVAILABLE` for genuinely absent local data.

Cached empty money arrays are treated as an explicit local zero balance. Remote
tests confirmed three accounts, total cached cash 81.16, no provider calls, and a
blocked local attempt with API count unchanged.

## TIMEOUT / checkpoint execution

Long Apps Script steps were resumed through the official checkpoint entry point.
No Full restart occurred. A concurrent UI trigger caused one expected LOCK_TIMEOUT;
the global lock prevented parallel writes.
