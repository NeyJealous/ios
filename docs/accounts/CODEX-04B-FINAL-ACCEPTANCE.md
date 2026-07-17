# CODEX-04B Final Acceptance

## 1. Scope

CODEX-04B delivered a safe Russian-language Google Sheets account-control UX for the five AccountScope flags:

- Sync
- Calculation
- Display
- Recommendations
- History

The implementation includes preview, validation, optimistic locking, exact-cell writes, append-only audit, RunId-bound rollback, diagnostics, sheet protection and JSON-safe history.

## 2. Baseline and branch

- CODEX-04A baseline: `86493f7`
- Final branch: `codex-04b-account-control-ux`
- Acceptance baseline commit: `b3dd0cd`
- Isolated worktree: `<WORKTREE_ROOT>`
- CODEX-06-PRE worktree unchanged: PASS

## 3. Gate A

- Account Control menu and HTMLService UI: PASS
- Preview/apply/revision guard: PASS
- Audit/rollback/diagnostics/protection: PASS
- Remote contract and no-op tests: PASS
- Gate A commit: `18ca359`

## 4. Gate B

- Controlled Display change: PASS
- Apply physical writes: 1
- Immediate rollback: PASS
- Rollback physical writes: 1
- Repeated rollback writes: 0
- Original configuration restored: PASS
- Data loss: none
- Broker API calls: 0

Gate B commits:

- `03b0bf3` — exact writes and idempotent rollback hardening
- `0c1106a` — controlled production apply/rollback evidence
- `b3dd0cd` — Gate B completion and JSON-safe history fix

## 5. Final account flags

- `…020546`: `true / false / true / false / true`
- `…531683`: `true / true / true / true / true`
- `…864109`: `false / false / false / false / false`

## 6. Exact write-set evidence

Executable tests and production results confirmed:

- Display-only apply changed exactly one flag cell
- rollback changed exactly one flag cell
- repeated apply with the same idempotency key writes zero cells
- repeated rollback returns `ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE` and writes zero cells
- the other 14 flag cells are not physically rewritten

## 7. Rollback evidence

- Apply RunId: `…c59e18`
- Rollback RunId: `…6000ca`
- rollback bound to the original RunId, preview hash, exact before snapshot and scope revision
- successful rollback consumed the snapshot
- final rollback registry: empty/consumed

## 8. Audit evidence

- Business audit rows: 2
- Results: `APPLIED`, `ROLLED_BACK`
- Timestamp: ISO-8601
- Account ID: masked
- Before/after vectors: verified
- Reasons, preview hashes and revisions: verified
- Audit read is read-only and does not change scope revision

Detailed masked evidence:
`audit/CODEX-04B-GATE-B-AUDIT-EVIDENCE.md`.

## 9. History wrapper

Final result: PASS.

- Date/Timestamp converted to ISO-8601
- invalid Date converted to `null`
- empty formatted rows excluded
- `JSON.stringify` succeeds
- full Account IDs are not returned
- stable UI field names retained
- reading history creates no audit rows
- remote history returned exactly two business entries

## 10. Final acceptance tests

- AccountScope diagnostics: PASS
- accounts: 3
- duplicate IDs: 0
- orphan links: 0
- diagnostics errors/warnings: 0/0
- global lock available: PASS
- UI model loads three accounts: PASS
- all displayed IDs masked: PASS
- menu contract and Russian labels: PASS
- account/flag column protection: PASS
- Account ID hidden: PASS
- no-op preview: `NO_CHANGES`
- no-op API calls/writes: 0/0
- history wrapper: PASS
- audit business rows: 2
- rollback registry consumed: PASS
- Recommendations without Calculation rejected: PASS
- last Calculation account guard: PASS
- excluded-account restore warning: PASS

## 11. Data integrity

- Trades: 6
- Portfolio: 1
- controlled transition deleted rows: 0
- non-audit business semantic changes: none
- purge/restore/sync/Recalc during controlled transition: not executed
- data loss: none

## 12. Remote checks

- Remote Health: PASS
- Round-trip: PASS, 61/61
- Privacy: PASS
- Remote source exact match: PASS
- Deployments: 15, unchanged
- Production deployment update: none

## 13. Acceptance criteria

1. `IOS → Счета` menu available: PASS
2. Russian-language UI: PASS
3. Full Account IDs hidden: PASS
4. Preview performs no writes: PASS
5. Revision and preview-hash guards: PASS
6. Exact write set: PASS
7. Append-only audit: PASS
8. RunId-bound rollback: PASS
9. Repeated rollback safety: PASS
10. JSON-safe history: PASS
11. Excluded account is not automatically restored: PASS
12. Display and Calculation are independent: PASS
13. Recommendations without Calculation blocked: PASS
14. Last Calculation account protected: PASS
15. Sheet protection: PASS
16. Deployments unchanged: PASS
17. No data loss: PASS
18. CODEX-06-PRE unchanged: PASS

## 14. Known external risk

`CRITICAL_ACTIVE_INFLUENCE_RISK`: legacy Market Regime multiplier greater than 1 may influence Decision Engine / Rule R030.

- Status: OPEN
- Outside CODEX-04B scope
- Market Regime, multiplier, Decision Engine, Rule R030 and TradePlan were not changed

## 15. Out of scope

- CODEX-04C
- CODEX-05
- CODEX-06A
- Market Regime remediation
- branch merge
- Git remote push
- tag push
- further production account-flag changes

## 16. Working tree and integration

- Working tree before this report: clean
- No Git remote push performed
- No merge performed
- Local acceptance tags are created only after the acceptance commit

## 17. Acceptance decision

**ACCEPTED**

All CODEX-04B acceptance criteria passed. No blockers remain.

## 18. Recommended next stage

Open a separately authorized integration gate for the accepted CODEX-04B branch. Do not merge it into CODEX-06-PRE implicitly. After integration planning, address the open `CRITICAL_ACTIVE_INFLUENCE_RISK` before starting CODEX-06A.
