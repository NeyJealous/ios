# CODEX-04A Gate B Purge Report

## Controlled direct purge

The migration used exact Account ID equality. Display name, account type and row number were not purge keys.

| Data set | Before | Removed | After |
| --- | ---: | ---: | ---: |
| Trades, target | 160 | 160 | 0 |
| Portfolio, target | 1 | 1 | 0 |
| Account-specific cache, target | 17 | 17 | 0 |
| Direct total | 178 | 178 | 0 |
| Trades, other accounts | 6 | 0 | 6 |

The target account row and its Account Strategy relation remain present. Directory, Investment Universe and shared price/cache data were not purged.

## Execution and recovery

The first monolithic wrapper completed all 178 direct deletions and began Recalc, then reached the Apps Script execution-time limit before it could return or commit. A read-only incident snapshot proved `target direct rows = 0`, `Trades total = 6`, sync complete and no concurrent writer.

Recovery used the same Run ID and a persisted checkpoint. It never called the purge stages again. Each remaining Recalc step ran as a separate locked, zero-API execution.

## Final state

- Migration status: `COMMITTED`
- Target suffix: `…864109`
- Direct target rows: 0
- Other Trades: 6
- Duplicate composite TradeKeys: 0
- Trade key conflicts: 0
- Invalid Account IDs: 0
- Repeated purge dry-run: `ALREADY_EXCLUDED`
- Planned deletes after commit: 0
- Broker API calls during migration/recovery: 0
- Trades writes during Recalc: 0
- Operations writes during Recalc: 0
