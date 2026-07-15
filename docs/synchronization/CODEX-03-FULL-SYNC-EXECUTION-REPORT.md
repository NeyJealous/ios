# CODEX-03 Full Sync Execution Report

## Backup

- pre-Full backup suffix: `…YpOSkA`
- sheets: 40
- production deployment changed: no

## Dry run

- status: PASS
- planned steps: 32
- pipeline writes during dry run: none

## Run 1

- run ID: `…69ad20`
- status: complete, 32/32
- duration: 3,529,865 ms
- API calls: 29
- rows written: 11,661
- incremental Trades rows added: 3 legitimate rows
- resulting Trades rows: 166

## Run 2 and checkpoint recovery

- run ID: `…f239c5`
- status: complete, 32/32
- persisted checkpoint accepted at index 26
- continuation range: Portfolio Intelligence through UI
- final API calls: 18
- API calls in steps 26–31: 0
- rows written: 11,658
- sheet reads/writes: 35/35
- errors/warnings: 0/0
- Trades rows added: 0

The reported 243,191,925 ms duration includes the intentional multi-day pause
between checkpoint creation and recovery and is not the active execution time.

## Incremental and idempotency validation

- Trades rows: 166 → 166 on run 2
- composite TradeKey duplicates: 0
- TradeKey conflicts: 0
- missing required trade IDs: 0
- repeated short Trade IDs: 9, allowed by the composite key
- Portfolio rows: 2 → 2
- Trades and Portfolio semantic hashes matched between completed runs

Full Sync result: **PASS**.
