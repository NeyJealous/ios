# IOS repository agent governance

Эти инструкции действуют во всём репозитории. Вложенные `AGENTS.md` могут
только уточнять или усиливать safety, security, privacy, production и
remote-write ограничения.

## Режим проекта

IOS является личным проектом владельца. Для внутренней разработки действует
упрощённый source-authored workflow, принятый в
`adr/ADR-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md`.

- Канонические профили находятся только в `.codex/agents/*.toml`.
- Допустимые статусы профиля: `DRAFT` и `READY`.
- Overlays, generator, generated profiles и composition pipeline не являются
  действующими слоями.
- Production-grade trusted attestation, обязательный внешний reviewer и
  отдельная activation system отложены до production-hardening фазы.
- Локальные проверки и обычный read-only GitHub CI являются достаточным gate
  для внутренней разработки при явном решении владельца.

## Обязательный цикл задачи

1. Прочитать Master Specification, Correction Memo и связанные RFC/ADR.
2. Проверить canonical base `integration/ios-current`, remote, branch, HEAD,
   clean status и отсутствие незавершённой Git-операции.
3. Выполнить privacy/secret preflight.
4. Работать только в отдельной task/feature branch.
5. Для значимого изменения получить resolver/preflight result. Resolver и
   review profiles помогают определить scope, но external attestation и
   независимый review не являются обязательными для personal development.
6. Выполнить подходящие локальные validators, tests, privacy scan и
   `git diff --check`.
7. Не заявлять `PASS` без фактического evidence и не выдавать
   `CODEX_ROLE_SIMULATION` за независимый `REAL_SUBAGENT`.
8. Создать PR в canonical branch. Merge выполняется только после явного
   разрешения владельца.

## Source of truth и архитектура

- Master Specification — главный источник требований; Correction Memo имеет
  приоритет при известных конфликтах v3.0.
- Не менять Investment Logic, Decision Engine, R030 или Market Regime без
  отдельного требования и gate.
- Архитектурное изменение требует RFC/ADR либо явного owner decision,
  зафиксированного в существующем принятом ADR.
- При конфликте или `UNKNOWN` не угадывать: зафиксировать состояние и
  остановить затронутую часть работы.

## Git и canonical policy

- Canonical branch: `integration/ios-current`.
- Изменения в canonical вносятся через PR; direct push запрещён.
- Force push, rebase опубликованной истории и history rewrite запрещены.
- Canonical синхронизируется только fast-forward.
- Удаление веток и тегов не выполняется автоматически.
- GitHub ruleset должен требовать PR, запрещать deletion и non-fast-forward.
  Для личного проекта обязательное approval другого reviewer не требуется.

## Agent Platform

- Пять принятых профилей:
  `ios-agent-orchestrator`, `agent-governance-auditor`,
  `security-privacy-auditor`, `audit-traceability-reviewer`,
  `ios-codebase-auditor`.
- Целостность фиксируется в
  `architecture/agents/registry/agent-integrity-registry.yaml`.
- Capability contracts остаются отдельным deny-by-default контролем.
- Профиль не выбирает и не меняет модель, не запускает escalation agent и не
  использует silent fallback. Допустим только structured
  `ESCALATION_REQUIRED`.
- Self-review запрещён: orchestrator исключается из review собственного
  изменения. Это ограничение не превращает personal-development preflight в
  автоматический blocker при наличии owner decision.
- Статус `READY` не означает production readiness или production activation.

## Reviews и evidence

- Review Matrix и Resolver используются для выбора полезных локальных review
  profiles и controls.
- Для personal development review reports и manifests создаются только когда
  они требуются задачей или владельцем.
- Для production, deployment, внешнего развёртывания либо работы с реальными
  секретами требуется отдельная hardening фаза с versioned gate.
- Исторические audit artifacts не переписываются и не удаляются.

## Apps Script, Sheets, production и секреты

- `clasp push`, deployment, Apps Script/Google Sheets writes и production API
  mutations запрещены без отдельного явного gate.
- CI не выполняет production writes.
- Не хранить и не выводить токены, OAuth data, `.clasp.json`, Script ID,
  Account ID, production exports или machine-specific absolute paths.
- Наличие MCP или GitHub permission не является разрешением на production
  write.

## Recovery

После timeout, disconnect или потери контекста сначала выполнить read-only
проверку branch/worktree, HEAD, diff, checkpoints и remote status. Не
повторять external write, пока предыдущий результат не классифицирован как
`NOT_STARTED`, `SUCCEEDED`, `FAILED`, `PARTIAL` или `UNKNOWN`. При `UNKNOWN`
остановиться.
