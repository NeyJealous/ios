# Аудит агентных требований IOS — переходное состояние

## Текущий результат

Прежний активный слой признан несовместимым с Agent Platform v2.1: профили
переписывали upstream prompts и не обеспечивали immutable composition.
Pre-cleanup inventory и причины удаления сохранены в
`audit/agents/pre-cleanup-agent-inventory.*`.

Текущее operational state:

```text
PlatformState = ZERO_AGENT_TRANSITION
Active custom agents = 0
Active registry entries = 0
Old Review Matrix bindings = 0
Old Resolver bindings = 0
Mandatory agent availability = NOT_AVAILABLE
Resolver result = BLOCKED
Activation allowed = false
```

Исторические именованные роли, прежний requirement map и старые manifests не
являются активным source of truth. Они восстанавливаются только из Git history
и audit evidence, но не принимаются новой runtime validation.

## Новая платформа

Целевой каталог из Agent Platform Specification v2.1 пока не активирован.
Тринадцать upstream compositions имеют статус `RESOLVED_CANDIDATE`, ещё 31 —
`UNRESOLVED`. До exact selection, provenance, security, model, fixture,
execution и acceptance evidence каждый новый агент считается недоступным.

## Safety boundary

Fail-closed enforcement выполняется независимым non-agent validator. Наличие
нулевого каталога не означает PASS: mandatory review получает
`NOT_AVAILABLE`, а итог — `BLOCKED`. Merge/deploy/remote/production authority
не передаётся ни одному профилю.
