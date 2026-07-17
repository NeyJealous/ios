# Отчёт интеграции Connection Recovery Protocol

## Gate

- Ветка: `governance/connection-recovery-integration`.
- Baseline: `07a9fd25946904a8241fd842b570fd18f6b67d26` из
  `origin/integration/ios-current`.
- Worktree: отдельный, canonical worktree не изменён.
- Функциональный scope Apps Script/CODEX-05: не изменён.

## Цель и threat model

Интеграция предотвращает duplicate external writes после timeout, network
error, app crash и потери ответа. Основные угрозы: операция завершилась после
разрыва, exit code не отражает target state, remote evidence конфликтует,
повторный PR/push/merge/deployment создаёт необратимый дубль, evidence раскрывает
secret или private identifier.

Fail-closed решение: read-only verification, единый lifecycle и обязательный
`UNKNOWN → STOP`. Автоматические retries внешних записей отсутствуют.

## Status model и tools

Реализованы `NOT_STARTED`, `LOCAL_ONLY`, `PUSH_COMPLETED`, `PR_CREATED`,
`MERGED`, `REMOTE_APPLY_COMPLETED`, `UNKNOWN`; обратный/противоречивый переход
даёт `UNKNOWN`.

Созданы:

- manifest/schema и санитизированные templates;
- `connection-recovery.mjs` с командами start, verify, classify, resume-plan,
  close и status;
- `remote-write-guard.mjs`, который сам не выполняет write;
- `remote-write-verify.mjs` с read-only post-state verification;
- `connection-disconnect-handler.mjs` с no-retry resume plan;
- audited supersede/close для доказанного `NOT_STARTED`/`LOCAL_ONLY` только по
  явному approval и закрытому successor с exact remote evidence;
- Git/GitHub read-only adapters и evidence-only fail-closed adapters для
  Apps Script, IcePanel и generic API;
- privacy/schema validators и GitHub Actions validation workflow.

Checkpoints записываются атомарно в `.audit/connection-recovery/`, история
проверок сохраняется, каталог исключён из Git.

## Gate workflow и CODEX-05

Общий CONNECTION RECOVERY CHECK добавлен в инструкции, repository merge policy
и шесть шаблонов: task gate, research worktree, release/deployment, IcePanel,
Apps Script и PR/merge. Definition of Done требует unresolved UNKNOWN = 0,
verified writes, closed checkpoints, отсутствие duplicates и явный счётчик
production writes.

CODEX-05 дополнен recovery workflow для единственного push, PR create и merge.
Merge требует отдельного разрешения; `clasp push` остаётся запрещён.

## Проверки

- JSON schema/runtime manifest: PASS.
- Node unit/integration/fixture tests: PASS, 49/49.
- CLI lifecycle всех шести команд: PASS.
- Dirty/detached/mismatch/timeout/conflicting/stale/duplicate scenarios: PASS.
- Disconnect/app crash/network restored/idempotent handler scenarios: PASS.
- Supersede success и блокировки UNKNOWN/unproved/wrong-branch successor: PASS.
- Scoped Connection Recovery privacy scan: PASS.
- Repository-wide publication privacy scan: PASS.
- Реальные checkpoints в Git: 0.

GitHub Actions workflow использует read-only permissions, не сохраняет checkout
credentials, не получает production secrets, не выполняет push/PR/merge/deploy
или production API и загружает только фиксированный санитизированный test
artifact.

## Production impact и rollback

- Apps Script changed: Нет.
- `clasp push`: не выполнялся.
- Deployments changed: Нет.
- Google Sheets/broker/IcePanel writes: 0.
- Production writes: 0.
- Ruleset changed: Нет.

Rollback после merge: revert merge commit отдельным разрешённым PR; history
rewrite и force push запрещены.
