# Agent Orchestration Policy

## Scope

Политика действует для любой ветки/worktree, в checkout которой присутствуют
governance-файлы, и для каждого PR в canonical через CI. Prompt задачи не может
отключить обязательного агента или baseline control.

## Task lifecycle

1. Прочитать Master Specification, Correction Memo, связанные RFC/ADR.
2. Проверить remote, canonical base, clean status, Git operation state,
   privacy и recovery checkpoints.
3. Создать отдельную branch/worktree от `origin/integration/ios-current`.
4. Получить changed paths и required agents детерминированным resolver.
5. Реализовать изменение без production write.
6. Выполнить обязательные reviews в `REAL_SUBAGENT` либо честном fallback
   `CODEX_ROLE_SIMULATION`; выполнить CI validators.
7. Материализовать JSON+Markdown reports и manifest.
8. Исправить CRITICAL/BLOCKER, повторить reviews на актуальном reviewed SHA.
9. Выполнить tests, Architecture Impact Check, privacy/secret scan и docs.
10. Создать PR в canonical; не merge без отдельного разрешения.

## Agent selection и fail closed

`tools/resolve-required-agents.mjs` нормализует Windows/Linux paths, учитывает
rename/delete/add и объединяет все matching rules. Empty diff блокируется.
Unknown path получает широкую fail-closed комбинацию. Versioned exception
действует только до expiry и после проверенного owner approval; базовые
Documentation/Test и security/privacy controls не исключаются.

## Execution и authority

Project custom agents не получают merge/deploy/remote/production authority.
Reviewer по умолчанию read-only. Test Generator может менять только явно
назначенные test files. Main Codex материализует отчёты и отвечает за итоговую
проверку. Owner/ruleset — единственная approval authority.

## Inheritance

После merge в canonical новые branches наследуют файлы обычным Git checkout.
Существующие branches не обновляются автоматически. Worktree использует файлы
своей ветки. User-level config и local hook trust не считаются частью механизма.
CI проверяет PR независимо от локального Codex.

## Anti-tamper

Изменения `AGENTS.md`, вложенных instructions, `.codex/agents/**`,
`architecture/agents/**`, `docs/agents/**`, `tools/*agent*` и workflow требуют
Architecture Reviewer, Security Reviewer, Documentation Reviewer, owner
approval и ADR при изменении модели. CODEOWNERS рекомендуется, но адреса не
добавляются без подтверждения владельца.

## Recovery

После disconnect/timeout нельзя повторять external write до read-only
классификации результата. Возобновление начинается с проверки worktree,
branch, HEAD, diff, manifest/reports и remote status. `UNKNOWN` останавливает
работу. Recovery не расширяет разрешения.
