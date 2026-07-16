# CODEX-04B Gate A Report

## 1. Baseline

- Accepted CODEX-04A baseline: `86493f7`
- CODEX-06-PRE preserved at `aa2b10a`
- Original worktree remained on `codex-06-pre-market-regime-spec`
- CODEX-04B worktree was created separately.

## 2. Branch and isolation

- Branch: `codex-04b-account-control-ux`
- Worktree: `C:\Users\NeyJealous\Documents\IOS_CODEX_04B_WORKTREE`
- CODEX-06-PRE files absent from this worktree.
- Private `.clasp.json` is ignored and not Git-visible.

## 3. Current menu audit

Before CODEX-04B there was no account-management submenu. The only HTMLService pattern was the token modal. There was no preview/apply revision guard, business audit sheet, flag-only rollback or protection of flag columns.

## 4. New menu items

`Инвестиционный помощник → Счета`:

- Настроить счета
- Проверить настройки счетов
- Предпросмотр влияния
- История изменений
- Восстановить предыдущие настройки

## 5. UI implementation

`AccountControlDialog.html` displays three account cards with name, type, status, masked ID, strategies, positions, trades, history counts, warnings and five flags. Browser requests contain opaque account refs, never raw Account IDs.

Five documented presets are available. The UI explicitly separates Display from Calculation and shows the external CODEX-06 risk without changing it.

## 6. Validation rules

- Recommendations without Calculation: rejected.
- Invalid Account ID with Sync/Calculation: rejected.
- Last/current Calculation account disable: critical confirmation required.
- Zero Display accounts: warning.
- Active sync: apply blocked.
- History off: no automatic delete.
- Flags on: no archive restore.
- Raw user-entered Account ID: not accepted.

## 7. Preview wrapper

`TI_PreviewAccountScopeChanges` is read-only and returns:

- scope revision and preview hash;
- changed accounts/flags;
- enabled/disabled API paths;
- affected calculation, UI and recommendation sheets;
- Recalc requirement;
- separate purge/restore gate requirement;
- API calls 0 and writes 0.

## 8. Apply wrapper

`TI_ApplyAccountScopeChanges` implements global lock, active-sync guard, expected revision, preview hash, before snapshot, contiguous batch write, post-validation, audit rows and rollback availability.

The only production apply test returned:

- code: `NO_CHANGES`
- writes: 0
- audit rows: 0
- flags before/after: semantically identical

## 9. Revision guard

Stale preview is rejected with `ACCOUNT_SCOPE_REVISION_CONFLICT`. Preview hash mismatch is rejected with `ACCOUNT_SCOPE_PREVIEW_HASH_CONFLICT`.

## 10. Audit trail

Schema added append-only sheet «История настроек счетов». Audit contract builds a masked before/after row with reason, preview hash, revisions and rollback state. The sheet was not created during Gate A because no real apply occurred.

## 11. Rollback

`TI_PreviewAccountScopeRollback` and `TI_ApplyAccountScopeRollback` restore only flags from DocumentProperties snapshot. Trades, Portfolio, cache, purge and archive restore are explicitly excluded.

## 12. Diagnostics

`TI_AccountScopeDiagnostics` verifies:

- three accounts;
- valid/unique IDs;
- valid flags;
- Recommendations/Calculation compatibility;
- at least one Calculation account;
- orphan AccountStrategy links;
- migration state;
- revision;
- global lock;
- sheet protection.

Final remote diagnostics: PASS, errors 0, warnings 0.

## 13. Sheet protection

Warning-only range protection was applied to the five flag columns and Account ID column. Account ID remains hidden. Flags were not changed.

## 14. Excluded account

`…864109` remains `false/false/false/false/false`. UI shows:

- Счёт исключён
- Данные очищены
- Архив доступен

Enabling it only produces preview and requires a separate restore gate; production data is not restored automatically.

## 15. `…020546` semantics

Remains `true/false/true/false/true`: sync/history/display enabled; aggregate calculation and recommendations disabled.

## 16. `…531683` safety

Remains `true/true/true/true/true`. Disabling Calculation is rejected without explicit critical confirmation.

## 17. Local tests

- Apps Script syntax: PASS
- CODEX-03 regression gate: PASS
- AccountScope contract: PASS
- AccountControl static/runtime contract: PASS
- Required menu and top-level wrappers: PASS
- Presets: PASS
- Raw Account ID input absent: PASS
- No purge/archive restore calls: PASS
- Market Regime untouched: PASS

## 18. Remote tests

- UI model: PASS, 3 accounts, all IDs masked
- AccountControl contract: PASS
- Validation rules: PASS
- Revision conflict: PASS
- Remote diagnostics: PASS
- Remote Health: PASS
- Quick/Full/History scope: unchanged

## 19. No-op preview/apply

- Preview: `NO_CHANGES`, API calls 0, writes 0
- Apply: `NO_CHANGES`, writes 0, audit rows 0
- Scope before/after: identical after recursive key-normalized comparison

## 20. Source and round-trip

61 files were pushed with `force=false`. Because the installed clasp CLI cannot display its manifest prompt in the non-TTY automation shell, the same `clasp.files.push()` operation used by ordinary `clasp push` was invoked after proving `appsscript.json` exact match.

Round-trip: PASS, 61/61.

## 21. Privacy and deployments

- Full target Account ID in Git-visible files: false
- Secrets: none
- Private archive / `.clasp.json` tracked: no
- Deployments before/after: 15/15
- Production deployment changed: no

## 22. Known external risk

`CRITICAL_ACTIVE_INFLUENCE_RISK`: legacy multiplier > 1 may influence buy priority through Decision Engine / Rule R030.

- Source: CODEX-06-PRE final audit
- Status: OPEN
- AppliedMultiplier production status: NOT_APPROVED
- Outside CODEX-04B scope
- Account UI does not change Market Regime, multiplier, Rule R030 or Decision Engine.

## 23. Production changes

- Account flag cells changed: 0
- Purge/restore performed: no
- Production Recalc performed: no
- Protection metadata added: warning-only protections for flag and Account ID columns

## 24. CODEX-04B Gate A completed

Да.

## 25. Exact Gate B permission requested

Request permission for one controlled, reversible flag-only production test:

1. Preview `…020546` Display `true → false`.
2. Apply with revision/preview hash and explicit reason.
3. Verify audit row, scope response and no data deletion.
4. Preview and apply rollback Display `false → true`.
5. Verify final semantics return to `true/false/true/false/true`.

The proposed Gate B test will not run purge, restore, provider API, Market Regime changes, production deployment changes or Git remote push.
