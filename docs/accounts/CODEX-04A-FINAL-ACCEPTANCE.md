# CODEX-04A Final Acceptance

## Outcome

CODEX-04A completed: **Да**.

Gate A introduced canonical AccountScope flags and filtering. Gate B removed exactly the approved target data and rebuilt derived views without broker API calls.

## Acceptance summary

- New pre-purge Google Sheets backup: PASS
- Private archive verification: PASS (160 + 1 + 17 = 178)
- Direct purge: PASS (exact Account ID only)
- Other Trades preserved: 6
- Target account row preserved: yes
- Account Strategy relation preserved: yes
- Directory and Universe preserved: yes
- Target flags remain false / false / false / false / false
- `…020546` remains true / false / true / false / true
- `…531683` remains true / true / true / true / true
- Zero-API rebuild: PASS
- Target derived/UI rows: 0
- Idempotency: PASS after correcting a cumulative Stabilization diagnostic
- Repeat purge: `ALREADY_EXCLUDED`, planned deletes 0
- Remote Health: PASS
- Round-trip: PASS (59/59)
- Privacy: PASS
- Production deployments: unchanged (15)
- Rollback: full backup plus scoped private archive available
- Git commit message: `CODEX-04A: purge excluded account data and rebuild derived views`

## Production data changes

- Trades removed: 160 target rows
- Portfolio removed: 1 target row
- Account-specific cache removed: 17 target rows
- Total direct removals: 178
- Rows removed from other accounts: 0

No work beyond CODEX-04A was performed.
