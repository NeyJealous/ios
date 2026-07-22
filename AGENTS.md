# IOS repository agent governance

Эти инструкции действуют во всём репозитории. Вложенные `AGENTS.md` могут
только уточнять или усиливать их и не могут ослаблять safety, security,
privacy, approval или remote-write ограничения.

## Обязательный цикл любой задачи

1. Прочитать Master Specification, Correction Memo и связанные RFC/ADR.
2. Зафиксировать canonical base `integration/ios-current`, тип изменения и
   применимые review profiles через `tools/resolve-required-agents.mjs`.
3. Выполнить privacy/secret preflight и остановиться при dirty tree,
   неизвестном remote, baseline mismatch, незавершённой Git-операции или FAIL.
4. Работать только в отдельной task branch/worktree от актуального canonical.
5. Не менять production без отдельного versioned gate и явного разрешения.
6. Выполнить все обязательные reviews и создать contract-совместимые отчёты и
   `audit/agents/<GATE>/manifest.json`.
7. Устранить `BLOCKER` и `CRITICAL`; обязательный `NOT_EXECUTED` блокирует PR.
8. Не заявлять `PASS` без проверяемого evidence. Не выдавать
   `CODEX_ROLE_SIMULATION` за независимый `REAL_SUBAGENT`.
9. Обновить документацию, Architecture Impact Check и privacy/secret scan.
10. Создать PR в canonical branch и остановиться перед merge без отдельного
    разрешения владельца.

Полный policy и review contract:
`docs/agents/AGENT-ORCHESTRATION-POLICY.md` и
`docs/agents/AGENT-REVIEW-CONTRACT.md`.

## Source of truth и архитектура

- Master Specification — главный источник требований; Correction Memo имеет
  приоритет при известных конфликтах v3.0.
- Не создавать новый источник истины и не менять Investment Logic, Decision
  Engine, R030 или Market Regime без отдельного требования и gate.
- Архитектурное изменение требует RFC, ADR и Architecture Impact Check.
- При конфликте, отсутствующем источнике или `UNKNOWN` не угадывать:
  зафиксировать конфликт и остановить затронутую часть работы.

## Git, worktree и canonical policy

- Canonical branch: `integration/ios-current`; direct push и auto-merge
  запрещены. Force push и history rewrite запрещены.
- Каждая задача использует отдельную branch/worktree от актуального
  `origin/integration/ios-current`.
- Новые ветки наследуют governance только после merge файлов в canonical.
  Существующие ветки требуют явного merge/rebase/cherry-pick и не считаются
  покрытыми автоматически.
- Субагенты не выполняют commit, push, PR mutation, merge, deployment или
  любые remote/production writes.

## Apps Script, Sheets, production и секреты

- `clasp push`, deployment, Apps Script/Google Sheets writes и production API
  mutations запрещены без отдельного явного gate. CI никогда их не выполняет.
- Не хранить и не выводить токены, OAuth data, `.clasp.json`, Script ID,
  Account ID, production exports или machine-specific absolute paths.
- MCP используется как минимально привилегированный слой; наличие MCP не
  является разрешением на запись.

## Recovery protocol

После timeout, disconnect или потери контекста сначала выполнить read-only
проверку branch/worktree, HEAD, diff, checkpoints и внешнего статуса. Не
повторять external write, пока исход предыдущей операции не классифицирован как
`NOT_STARTED`, `SUCCEEDED`, `FAILED`, `PARTIAL` или `UNKNOWN`. При `UNKNOWN`
остановиться. Следовать `docs/governance/CODEX-CONNECTION-RECOVERY-INSTRUCTIONS.md`.

## Status и evidence

- Agent implementation: `SPECIFIED`, `PROVISIONAL`, `IMPLEMENTED`, `PARTIAL`, `MISSING`,
  `CONFLICTING`, `DEPRECATED`.
- Review: `PASS`, `PASS_WITH_WARNINGS`, `BLOCKED`, `FAIL`, `NOT_APPLICABLE`,
  `NOT_EXECUTED`.
- Severity: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `BLOCKER`.
- Evidence должно содержать команды/результаты, файлы и ссылки на требования;
  наличие файла или теста не доказывает его корректность или прохождение.
- Никогда не фабриковать запуск, роль, независимость review, разрешение,
  remote state или production result.

## Review guidelines

Применить `architecture/agents/review-matrix.yaml`. Любая задача требует
Documentation Reviewer, Test Generator и baseline security/privacy controls.
Изменение governance-файлов требует Architecture Reviewer, Security Reviewer,
Documentation Reviewer, owner approval и ADR при изменении модели.

## Provisional Agent Platform v2 workflow

Перед значимым изменением выполнить `tools/agents/preflight.mjs`, получить
детерминированный Resolver result и delegation plan `ios-agent-orchestrator`.
После изменения scope и после фактического diff повторить Resolver через
`tools/agents/postflight.mjs`, собрать отдельные commit-bound reports и
остановиться при `BLOCKER`, `CRITICAL`, `UNKNOWN`, mandatory `NOT_AVAILABLE`,
model-floor failure или stale evidence. Точки обязательного повторения:
task start, перед первым write, scope change, pre-commit, pre-push, pre-PR,
governance/profile/model/upstream changes, migrations и production-related paths.

Первая волна имеет `PlatformState=PROVISIONAL_PLATFORM_BUILD`, все пять
профилей имеют `status=PROVISIONAL`, `activationEligible=false`, а activation
gate закрыт. Поэтому tooling может только вычислять Resolver/DAG и возвращает
`AUTOMATIC_DISPATCH_CONFIGURED`, `NOT_DISPATCHED_ACTIVATION_CLOSED` и
`TRUSTED_EXTERNAL_ATTESTATION_MISSING`; он не запускает provisional agents.
Simulation и PR-authored text не заменяют обязательный независимый review.
Automatic dispatch не даёт merge, deploy, production-write или owner-approval
authority и не ослабляет sandbox permissions.
