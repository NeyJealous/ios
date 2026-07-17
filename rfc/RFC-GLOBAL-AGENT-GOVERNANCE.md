# RFC-GLOBAL-AGENT-GOVERNANCE

- Статус: PROPOSED
- Автор: Codex по поручению владельца репозитория
- Дата: 2026-07-18
- Область: repository-wide agent governance

## Проблема

Master Specification перечисляет десять специализированных субагентов, но в
canonical branch нет исполняемой конфигурации, registry, review contract,
resolver или CI enforcement. Упоминание роли не доказывает существование
агента, а prompt одного чата не наследуется ветками и worktree.

## Варианты

1. Local user-level agents — настоящие профили возможны, но не переносятся Git
   и не являются общей гарантией.
2. Prompt-only — быстро, но не versioned, не проверяется CI и исчезает вместе с
   контекстом.
3. Repository instructions — переносимы и наследуются новыми ветками, но сами
   по себе не являются непреодолимым enforcement.
4. CI enforcement — детерминированно блокирует PR, но не направляет локальную
   работу Codex до push.
5. Hybrid repository + CI — сочетает project agents, `AGENTS.md`, registry,
   resolver, evidence contract и независимую PR-проверку.
6. External orchestration service — сильнее автоматизирует исполнение, но
   добавляет новый сервис, credentials, стоимость и операционный риск.

## Предложение

`HYBRID_REPOSITORY_PLUS_CI`: versioned root/scoped `AGENTS.md`, десять
project-scoped custom agents, registry/matrix, deterministic resolver,
manifest/review contract и GitHub Actions без production credentials.

Десять profiles адаптируются из MIT-коллекции
`VoltAgent/awesome-codex-subagents` на pinned commit
`5605c9c18b3687993919d6cc467af4a34898fee2`. Прямых upstream equivalents для
части IOS-доменов нет, поэтому mapping versioned, а Master Specification и IOS
safety overlay имеют приоритет. Все project agents используют
`gpt-5.6-terra` по явному требованию владельца.

Роли Security Reviewer и Privacy Reviewer вводятся только как `PARTIAL`
governance profiles/CI controls на основании Security & Secrets и существующих
privacy gates. Data Quality, Quantitative Validation, Release, Observability,
Git Integration и Market Regime Reviewer не становятся обязательными без
отдельного принятого решения. Market Regime v3.2 отсутствует в canonical
baseline и не реконструируется по догадке.

## Architecture impact

Добавляются Agent Governance Layer, Agent Registry, Review Matrix, Agent
Resolver, Review Manifest и CI Enforcement. Runtime IOS, Investment Logic,
Decision Engine, Reserve Engine, Market Regime, Apps Script deployment и
Google Sheets production не меняются.

Preview IcePanel diff: к Development Platform добавляется governance boundary
между repository instructions и PR enforcement; импорт в IcePanel не
выполняется.

## Security и privacy

Все агенты имеют `CanWriteRemote=false`, `CanApproveMerge=false`,
`CanDeploy=false`, `CanProductionWrite=false`, `CanModifySecrets=false`. CI
использует только checkout и локальные Node.js-проверки, не получает Apps
Script/Sheets/OpenAI credentials и не выполняет external writes.

## Exceptions

Исключение допустимо только versioned JSON с RFC/ADR reference, проверенным
owner approval, причиной, expiry и risk acceptance. Documentation Reviewer,
Test Generator и baseline security/privacy controls исключать нельзя.

## Открытые вопросы

- Утвердить ли отдельные канонические роли Security и Privacy Reviewer.
- Нужны ли именованные Release/Git Integration/Observability reviewers или
  достаточно обязательных checklist/CI controls.
- После попадания Market Regime v3.2 в canonical определить необходимость
  Market Regime/Data Quality/Quantitative Validation reviewers отдельным RFC.

## План внедрения

PR в `integration/ios-current`; после review владелец отдельно принимает
решение о merge и required status check. Существующие ветки обновляются только
по adoption plan.
