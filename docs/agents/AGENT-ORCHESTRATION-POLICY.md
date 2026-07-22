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
4. Получить changed paths и transition result детерминированным resolver.
5. Реализовать изменение без production write.
6. В `ZERO_AGENT_TRANSITION` зафиксировать mandatory agent как
   `NOT_AVAILABLE` и остановить gate; simulation не заменяет review.
7. Материализовать JSON+Markdown reports и manifest.
8. Исправить CRITICAL/BLOCKER, повторить reviews на актуальном reviewed SHA.
9. Выполнить tests, Architecture Impact Check, privacy/secret scan и docs.
10. Создать PR в canonical; не merge без отдельного разрешения.

## Agent selection и fail closed

`tools/resolve-required-agents.mjs` нормализует Windows/Linux paths, учитывает
rename/delete/add и объединяет все matching rules. Empty diff блокируется.
Unknown path блокируется. В переходном состоянии любой diff также блокируется:
active agents отсутствуют, `BlockedByUnavailableAgents` не пуст и общий result
равен `BLOCKED`. Versioned exception не может отключить этот safety floor.

## Execution и authority

Активные project custom agents отсутствуют. Ни simulation, ни transition
metadata не получают merge/deploy/remote/production authority. Owner/ruleset —
единственная approval authority.

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

## SOLO_MAINTAINER_OWNER_BYPASS

В репозитории с единственным активным уполномоченным reviewer владелец может
однократно обойти только требование независимого approval для конкретного PR.
Bypass допустим, только если все обязательные CI checks имеют `PASS`, нет
CRITICAL/BLOCKER findings, unresolved conversations равны нулю, ветка не
отстаёт от canonical и авторизацию дал владелец репозитория.

Причина, scope и evidence фиксируются в PR и `OwnerBypass` audit manifest:
`ReviewMode=SOLO_MAINTAINER_OWNER_BYPASS`,
`IndependentReviewer=NOT_AVAILABLE`, `CIEvidence=PASS` и явная human
authorization. Bypass не является review и не может выдаваться за независимое
одобрение. Он не обходит status checks, conversation resolution, актуальность
base/head, privacy, secrets, manifest или иные protections. Он не разрешает
production write, deployment, `clasp push`, Sheets write или ослабление
ruleset. Применение ограничено approval requirement одного указанного PR.

## Recovery

После disconnect/timeout нельзя повторять external write до read-only
классификации результата. Возобновление начинается с проверки worktree,
branch, HEAD, diff, manifest/reports и remote status. `UNKNOWN` останавливает
работу. Recovery не расширяет разрешения.
