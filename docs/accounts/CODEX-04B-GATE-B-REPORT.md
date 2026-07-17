# CODEX-04B Gate B Report

## 1. Baseline and safety-fix commit

- Branch: `codex-04b-account-control-ux`
- Worktree: `<WORKTREE_ROOT>`
- Gate A commit: `18ca359`
- Safety-fix commit: `03b0bf3` — `CODEX-04B: harden exact writes and idempotent rollback`
- Remote source before production test: 61/61 exact match
- Deployments before production test: 15

## 2. Before snapshot

Pre-flight diagnostics:

- accounts: 3
- duplicate Account IDs: 0
- orphan links: 0
- global lock: available
- active sync: false; recorded state `complete`
- active migration: none
- stored historical migration state: `EXCLUSION_COMMITTED`
- audit history business rows: 0
- rollback registry: `ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE`
- Remote Health: PASS

Initial scope:

- `…020546`: `true / false / true / false / true`
- `…531683`: `true / true / true / true / true`
- `…864109`: `false / false / false / false / false`

## 3. Final preview

`TI_PreviewAccountScopeChanges` returned:

- code: `PREVIEW_READY`
- affected accounts: 1
- account: `…020546`
- changed field: `Display_Enabled`
- before: `true / false / true / false / true`
- after: `true / false / false / false / true`
- API calls: 0
- writes: 0
- purge/restore gate: not required
- production data delete/restore: false

## 4. Controlled apply

- Function: `TI_ApplyAccountScopeChanges`
- Result: `APPLIED`
- Apply RunId: `…c59e18`
- Exact physical write set: 1 flag cell
- Changed accounts: 1
- Audit rows reported: 1
- Rollback available: true
- API calls: 0
- Deleted/restored production data: false/false

After apply:

- `…020546`: `true / false / false / false / true`
- `…531683`: unchanged
- `…864109`: unchanged

The live Account Control model no longer included `…020546` in Display-enabled scope. Calculation and Recommendations remained false; Sync and History remained true. No Recalc or production-sheet rebuild was executed.

## 5. Data integrity after apply

- Trades: 6 → 6
- Portfolio: 1 → 1
- Other business-sheet semantic digests: unchanged
- Expected append-only change: account audit row
- Expected diagnostic change: Technical Log entry
- Cache/history/business rows: unchanged
- Deleted rows: 0
- Sync/purge/restore/Recalc/Full: not executed
- Remote Health: PASS

## 6. Rollback preview

`TI_PreviewAccountScopeRollback`, bound to RunId `…c59e18`:

- result: `ROLLBACK_PREVIEW_READY`
- affected accounts: 1
- changed field: `Display_Enabled`
- before: `true / false / false / false / true`
- after: `true / false / true / false / true`
- API calls: 0
- writes: 0
- flags only: true
- restores Trades/Portfolio/cache: false
- runs purge: false

## 7. Immediate rollback

- Function: `TI_ApplyAccountScopeRollback`
- Result: `ROLLED_BACK`
- Rollback RunId: `…6000ca`
- Original apply target: `…c59e18`
- Physical writes: 1
- Audit rows reported: 1
- Snapshot consumed: true
- Rollback available after completion: false
- API calls: 0

## 8. Repeated rollback

The same rollback request returned:

- code: `ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE`
- writes: 0
- flags unchanged
- no additional transition/audit row

## 9. Final restored semantics

- `…020546`: `true / false / true / false / true`
- `…531683`: `true / true / true / true / true`
- `…864109`: `false / false / false / false / false`

The final Account scope revision equals the original revision.

## 10. Audit trail

Audit trail status: PASS.

- controlled apply reported exactly one appended audit business row
- rollback reported exactly one appended audit business row
- repeated rollback reported zero writes and did not execute an additional transition
- apply row contains masked account, RunId, before/after, reason, preview hash, revisions and rollback availability through the verified `buildAuditRows` contract
- rollback row uses result `ROLLED_BACK` and `RollbackAvailable=false`

The two business audit rows were subsequently read and verified through the fixed JSON-safe history wrapper:

- apply: RunId `…c59e18`, result `APPLIED`, rollback available
- rollback: RunId `…6000ca`, result `ROLLED_BACK`, rollback consumed
- both rows contain ISO Timestamp, masked account, before/after vectors, reason, preview hash and scope revisions

## 11. Negative read-only tests

- Recommendations=true with Calculation=false: rejected, `VALIDATION_FAILED`
- last Calculation account disable: critical confirmation required; no apply
- stale scope revision: `ACCOUNT_SCOPE_REVISION_CONFLICT`, writes=0
- excluded account enable preview: separate restore gate required; no automatic restore; no apply

Result: PASS, API calls=0, writes=0.

## 12. Final integrity and remote checks

- Trades unchanged: PASS
- Portfolio unchanged: PASS
- Cache/history/business data unchanged: PASS
- Non-audit semantic changes: none
- Deleted rows: 0
- API calls for apply + rollback: 0
- Purge/restore/sync/Recalc: not executed
- Remote Health: PASS
- Round-trip: PASS, 61/61
- Privacy: PASS
- Deployments: 15, unchanged
- Production deployments updated: no

## 13. External Market Regime risk

`CRITICAL_ACTIVE_INFLUENCE_RISK`: legacy Market Regime multiplier greater than 1 may influence Decision Engine / Rule R030.

- Status: OPEN
- Outside CODEX-04B scope
- Market Regime, multiplier, Decision Engine, Rule R030 and TradePlan source were not changed
- Gate B did not create recommendations

## 14. History wrapper incident and resolution

Incident:

- `TI_GetAccountScopeHistory` originally returned a Sheet `Date` object that Apps Script Execution API could not serialize.
- The formatted audit sheet also exposed empty preallocated rows through `TI.Data.sheetObjects()`.

Root cause:

- Timestamp was not converted to a JSON-safe primitive.
- Business rows were not filtered before applying the 100-row history limit.

Fix:

- valid Date/Timestamp values are converted to ISO-8601 strings
- invalid dates return `null`
- empty formatted rows are filtered by RunId, masked account and result
- all returned fields use stable JSON-safe primitives
- full Account IDs remain unavailable
- reading history does not append rows or change scope revision

Verification:

- local history contract: PASS
- remote `TI_TestAccountScopeHistoryJsonSafe`: PASS
- remote history business rows: exactly 2
- rows before/after read: unchanged
- scope revision before/after read: unchanged
- round-trip source match: 61/61

Incident status: RESOLVED.

## 15. Acceptance

- CODEX-04B Gate B completed: **Да**
- Controlled apply: PASS
- Exact write set: 1 cell
- Rollback: PASS
- Repeated rollback writes: 0
- Initial configuration restored: Да
- Data loss: Нет
- Audit trail: PASS
- History wrapper: PASS
- Readiness for final CODEX-04B acceptance: **Да**
