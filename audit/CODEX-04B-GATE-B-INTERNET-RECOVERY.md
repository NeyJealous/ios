# CODEX-04B Gate B Internet Recovery

## Worktree

- Path: `<WORKTREE_ROOT>`
- Branch: `codex-04b-account-control-ux`
- Gate A commit: `18ca359`
- CODEX-06-PRE worktree preserved and clean: Да
- Staged files: 0
- Private `.clasp.json`: ignored

## Preserved local changes

Only Gate B recovery changes are present in tracked source/tests:

- `IOS_SOURCE_SNAPSHOT/work/apps-script/AccountControl.gs`
- `tools/codex04b-account-control-test.mjs`

Additional untracked files are recovery tests and read-only audit artifacts.

Local SHA-256:

- `AccountControl.gs`: `d88869b1f24b647c6a3efee295275f7ff87fb69f40cda6edb2e086d271405c7c`
- `codex04b-account-control-test.mjs`: `e1441ba28eb40a259d032c7936ed7b5b7f4169279a90357c61921189b051d925`
- `codex04b-gateb-safety-test.mjs`: `2092c5a0c6cea7830a78558a4b1cddc6f810516b0f8221378585c71d604289c4`

## Remote recovery classification

- Initial classification after reconnect: `PUSH_COMPLETED`.
- Evidence: first recovery round-trip was 61/61 and `AccountControl.gs` local/remote hashes matched.
- Local safety tests then identified a response-contract gap: repeated rollback safely rejected the request but did not explicitly return `writes = 0`.
- Minimal local fix added explicit zero-write response and bound the rollback snapshot to the original audit identity.
- After all local tests passed, one ordinary `clasp push` was executed without `--force`.
- Final classification: `PUSH_COMPLETED`.
- Final round-trip: 61/61 exact.
- Final normalized `AccountControl.gs` local/remote SHA-256:
  `7bdaea6e5f675b2ab9e133dfd3ed0da8daf1e441bc87661a3716336a0eb328d3`.
- Deployments: 15, unchanged.
- Last confirmed source operation: 2026-07-16 21:43:30 Europe/Moscow.

## Production write detection

Classification: `NO_PRODUCTION_WRITE`.

- Account scope audit history rows: 0.
- Rollback registry: `ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE`, `writes = 0`.
- Global lock: available.
- Active sync: false; last recorded sync status is complete.
- Migration state: `EXCLUSION_COMMITTED` historical state, no active migration.
- Production apply: not executed.
- Production rollback: not executed.
- Purge/restore/sync/recalc: not executed.

Current flags:

- `…020546`: `true / false / true / false / true`
- `…531683`: `true / true / true / true / true`
- `…864109`: `false / false / false / false / false`

## Exact write set and rollback safety

Executable local test against the actual `AccountControl.gs` implementation:

- Display-only preview: one account, one changed flag (`Display_Enabled`).
- Preview API calls: 0.
- Preview writes: 0.
- Apply physical writes: 1.
- Rollback physical writes: 1.
- Repeated apply writes: 0.
- Repeated rollback writes: 0.
- Rollback is bound to the original RunId, preview hash, reason, before snapshot and scope revision.
- Successful rollback consumes the snapshot and sets `rollbackAvailable = false`.
- Repeated rollback returns `ACCOUNT_SCOPE_ROLLBACK_NOT_AVAILABLE`, `writes = 0`.
- Final mock semantics restored: `true / false / true / false / true`.

Remote read-only Display preview:

- Result: `PREVIEW_READY`.
- Affected accounts: 1.
- Changed flags: `Display_Enabled`.
- API calls: 0.
- Writes: 0.
- Separate purge/restore gate: false.
- Expected physical write set: 1, derived from the single changed flag and the verified remote implementation that writes only changed cell ranges.

## Tests

- AccountControl contract: PASS.
- Exact-write-set: PASS.
- Single-cell apply: PASS.
- Rollback by RunId: PASS.
- Rollback consumption: PASS.
- Repeated rollback: PASS.
- Idempotent apply: PASS.
- Revision conflict: PASS.
- AccountScope regression: PASS.
- Apps Script syntax: PASS.
- CODEX-03 regression gates: PASS.
- Remote AccountControl contract: PASS.
- Remote validation tests: PASS.
- Remote Health: PASS.
- Round-trip: PASS, 61/61.
- Privacy: PASS.

## Readiness

Readiness for controlled production apply: **Да**.

No blockers remain. Per recovery stop condition, the real Display transition and rollback were not executed and require a separate user confirmation.

## External known risk

`CRITICAL_ACTIVE_INFLUENCE_RISK`: legacy Market Regime multiplier greater than 1 may affect Decision Engine / Rule R030.

- Status: OPEN.
- Outside CODEX-04B scope.
- Market Regime, Decision Engine and multiplier were not changed during recovery.
