# ADR-GLOBAL-AGENT-GOVERNANCE

- Статус: ACCEPTED
- Дата: 2026-07-18
- Связанный RFC: `rfc/RFC-GLOBAL-AGENT-GOVERNANCE.md`
- Связанные спецификации: Master Specification 21, 22, 23, 24, 26

## Контекст

Требуется repository-wide и наследуемая governance-модель, которая направляет
локальный Codex и независимо блокирует неполный PR. User-level configuration и
prompt-only не удовлетворяют этому требованию.

## Рассмотренные варианты

Local user-level agents, prompt-only, repository instructions, CI enforcement,
hybrid repository + CI и external orchestration service; сравнительный анализ
зафиксирован в RFC.

## Решение

Принять `HYBRID_REPOSITORY_PLUS_CI`. Реальные project agents являются
исполняемыми профилями Codex, но каждый review обязан явно фиксировать
ExecutionMode. Детерминированный CI принимает как evidence только contract-
совместимые артефакты и не считает симуляцию независимым review.

Профили являются IOS-адаптациями pinned MIT upstream
`VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2`
и закрепляются на `gpt-5.6-terra`; обновление upstream требует отдельного
governance self-change review.

## Последствия

- Новые ветки от обновлённого canonical получают governance через Git.
- Старые ветки не покрыты до явного обновления.
- `AGENTS.md` направляет Codex, но hard gate обеспечивает CI/ruleset.
- Изменение governance становится anti-tamper change.
- Required status check включается владельцем отдельно после появления
  успешного check run.

## Решение об утверждении

Владелец репозитория явно разрешил продолжение governance gate 2026-07-18.
ADR принят как `ACCEPTED`; это решение не отменяет ruleset, обязательный review
или отдельную проверку mergeability непосредственно перед merge.
