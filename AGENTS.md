# IOS repository agent governance

Эти инструкции действуют во всём репозитории. Вложенные `AGENTS.md` могут
только уточнять или усиливать их и не могут ослаблять safety, security,
privacy, approval или remote-write ограничения.

## Обязательный цикл любой задачи

1. Прочитать Master Specification, Correction Memo и связанные RFC/ADR.
2. Зафиксировать canonical base `integration/ios-current`, тип изменения и
   review profiles через `tools/resolve-required-agents.mjs`.
3. Выполнить privacy/secret preflight и остановиться при dirty tree,
   неизвестном remote, baseline mismatch, незавершённой Git-операции или FAIL.
4. Работать только в отдельной task branch/worktree от актуального canonical.
5. Не менять production без отдельного versioned gate и явного разрешения.
6. Выполнить обязательные reviews и создать contract-совместимые отчёты и
   `audit/agents/<GATE>/manifest.json`.
7. Устранить `BLOCKER` и `CRITICAL`; обязательный `NOT_EXECUTED` блокирует PR.
8. Не заявлять `PASS` без evidence. Не выдавать `CODEX_ROLE_SIMULATION` за
   независимый `REAL_SUBAGENT`.
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
- Субагенты не выполняют commit, push, PR mutation, merge, deployment или
  remote/production writes.

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
остановиться. Следовать
`docs/governance/CODEX-CONNECTION-RECOVERY-INSTRUCTIONS.md`.

## Status и evidence

- Agent implementation: `SPECIFIED`, `PROVISIONAL`, `IMPLEMENTED`, `PARTIAL`,
  `MISSING`, `CONFLICTING`, `DEPRECATED`,
  `CANONICAL_SOURCE_PENDING_REVALIDATION`,
  `CANONICAL_SOURCE_RUNTIME_VERIFIED`.
- Review: `PASS`, `PASS_WITH_WARNINGS`, `BLOCKED`, `FAIL`, `NOT_APPLICABLE`,
  `NOT_EXECUTED`.
- Severity: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `BLOCKER`.
- Evidence содержит команды/результаты, файлы и ссылки на требования.
- Никогда не фабриковать запуск, роль, независимость review, разрешение,
  remote state или production result.

## Review guidelines

Применить `architecture/agents/review-matrix.yaml`. Любая задача требует
Documentation Reviewer, Test Generator и baseline security/privacy controls.
Изменение governance-файлов требует Architecture Reviewer, Security Reviewer,
Documentation Reviewer, owner approval и ADR при изменении модели.

## Source-authored Agent Platform workflow

Перед значимым изменением выполнить `tools/agents/preflight.mjs`, получить
Resolver result и delegation plan `ios-agent-orchestrator`. После изменения
scope и после фактического diff повторить Resolver через
`tools/agents/postflight.mjs`, собрать отдельные commit-bound reports и
остановиться при `BLOCKER`, `CRITICAL`, `UNKNOWN`, mandatory `NOT_AVAILABLE`,
model-floor failure или stale evidence. Обязательные точки повтора: task start,
перед первым write, scope change, pre-commit, pre-push, pre-PR,
governance/profile/model/upstream changes, migrations и production paths.

Канонические first-wave profiles находятся только в `.codex/agents/*.toml`.
Их целостность фиксируется в
`architecture/agents/registry/agent-integrity-registry.yaml`. Overlays,
compositions и generated provisional profiles не являются каноническими или
runtime-слоями. Capability contracts сохраняются как отдельный deny-by-default
контроль. Bootstrap только валидирует и не создаёт или копирует профили.

Профильный агент не выбирает и не меняет модель, не запускает escalation agent
и не использует silent fallback. Он может вернуть только structured
`ESCALATION_REQUIRED`. Фактический universal escalation routing не реализован.

Runtime verification пяти профилей не активирует платформу. Activation остаётся
закрытой до полного evidence, owner approval, trusted attestation и принятия
`adr/ADR-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md`. Automatic dispatch не даёт
merge, deploy, production-write или owner-approval authority и не ослабляет
sandbox permissions.
