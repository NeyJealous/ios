# CODEX-04B Gate B Audit Evidence

Read-only evidence captured after the controlled apply and rollback. User identity is intentionally redacted; Account ID and RunId remain masked.

## Controlled apply

- Timestamp: `2026-07-16T18:55:09.761Z`
- RunId: `…c59e18`
- Account: `…020546`
- Before: `true / false / true / false / true`
- After: `true / false / false / false / true`
- Reason: `CODEX-04B Gate B controlled Display-only production test`
- PreviewHash: `d2905e9f221001c9f732e5506a640f75c74319baf1c5d71e72a847778548e8e2`
- Scope revision before: `a7d3b535c87b8c56c7dbd2443a9a4c23c606f242329bf53176f215ae36f11557`
- Scope revision after: `ba4b53e59f7ac071ae77a3a6c352a744cb3d6f8debf5c3f71fcb816d3cf4aa84`
- Result: `APPLIED`
- RollbackAvailable: `true`

## Immediate rollback

- Timestamp: `2026-07-16T18:58:06.387Z`
- RunId: `…6000ca`
- Account: `…020546`
- Before: `true / false / false / false / true`
- After: `true / false / true / false / true`
- Reason: `CODEX-04B Gate B immediate rollback`
- PreviewHash: `fe8f1a4744a3d00adf6006ecc2e27b66ed9936d2de8672953dec391fdb79175d`
- Scope revision before: `ba4b53e59f7ac071ae77a3a6c352a744cb3d6f8debf5c3f71fcb816d3cf4aa84`
- Scope revision after: `a7d3b535c87b8c56c7dbd2443a9a4c23c606f242329bf53176f215ae36f11557`
- Result: `ROLLED_BACK`
- RollbackAvailable: `false`

## Read-only verification

- Business audit rows returned: 2
- Timestamp format: ISO-8601
- Full Account IDs returned: 0
- Rows before/after history read: unchanged
- Scope revision before/after history read: unchanged
- `JSON.stringify`: PASS
- History wrapper: PASS
