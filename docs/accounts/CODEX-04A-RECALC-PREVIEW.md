# CODEX-04A Recalc Preview

## Result

- Status: PASS
- Read-only: yes
- API calls: 0
- Trades writes: 0
- Operations writes: 0
- Derived writes: 0
- Production purge: not performed

## Logical post-exclusion state

- Remaining Portfolio positions: 1
- Excluded target positions: 1
- Remaining market value: 13,061.12 RUB
- Target FIFO lots to rebuild away: 6
- Target FIFO sales to rebuild away: 131
- Target Portfolio Health rows to rebuild away: 1
- Target Portfolio Intelligence rows to rebuild away: 1
- Target Advisor rows to rebuild away: 1
- Target Visualization rows to rebuild away: 1
- Current target TradePlan rows: 0
- Current target Decision rows: 0

The preview did not modify any derived or UI sheet. The rebuild is reserved for Gate B.

## Recovery after network interruption

- what completed before interruption: the original zero-write Recalc preview returned PASS.
- what was verified: API, Trades, Operations and derived writes remain zero; production purge remains false.
- what was resumed: preview was rerun after the Display-versus-Calculation source fix.
- duplicate writes avoided: no production derived sheet was rebuilt.
- final remote state: PASS; Gate B rebuild remains pending authorization.
