# Аудит агентных требований IOS

## Результат

В canonical Master Specification найдено ровно 10 именованных субагентов.
До этого изменения ни один не имел repository-scoped executable profile,
registry или CI evidence contract: исходный статус реализации — `MISSING`.
В этом PR для десяти ролей добавлены `.codex/agents/*.toml`, поэтому целевой
статус — `IMPLEMENTED`, но фактический запуск каждого review по-прежнему должен
доказываться `ExecutionMode` и evidence.

Профили адаптированы из MIT-коллекции
`VoltAgent/awesome-codex-subagents` на pinned commit
`5605c9c18b3687993919d6cc467af4a34898fee2`. Соответствие upstream → IOS и
отклонения описаны в `docs/agents/UPSTREAM-AGENT-ADAPTATION.md`.

Главный источник: `IOS_HANDOFF_v4/master_specification/21_Development_Platform_IOS_Master_Specification_v3.0.md:69-84`.

| AgentId | Каноническое имя | Основные источники/область | Trigger | Status после PR |
|---|---|---|---|---|
| ARCHITECTURE_REVIEWER | Architecture Reviewer | 03, 21, 22, Correction Memo | architecture, governance, investment | IMPLEMENTED |
| APPS_SCRIPT_REVIEWER | Apps Script Reviewer | 09, 21, 22 | Apps Script/API | IMPLEMENTED |
| PERFORMANCE_AUDITOR | Performance Auditor | 20, 21, 22 | Apps Script, Sheets, API, performance | IMPLEMENTED |
| INVESTMENT_LOGIC_REVIEWER | Investment Logic Reviewer | 12, 15.*, 21, 22 | investment, Decision Engine, Market Regime | IMPLEMENTED |
| BOND_SPECIALIST | Bond Specialist | 15.4, 17, 21 | bonds/coupon ladder | IMPLEMENTED |
| COMPANY_RATING_REVIEWER | Company Rating Reviewer | 16, 21 | company rating | IMPLEMENTED |
| GOOGLE_SHEETS_REVIEWER | Google Sheets Reviewer | 08, 21, 28 | Sheets schema/formulas/migration | IMPLEMENTED |
| DOCUMENTATION_REVIEWER | Documentation Reviewer | 21, 22, 23 | любая задача | IMPLEMENTED |
| UX_REVIEWER | UX Reviewer | 21, 22, 28, Correction Memo §10 | UI/UX, Sheets | IMPLEMENTED |
| TEST_GENERATOR | Test Generator | 21, 22, 24 | любая задача | IMPLEMENTED |

Полные inputs/checks/forbidden actions/outputs/severity/permissions находятся в
`architecture/agents/agent-registry.yaml`; requirement traceability — в
`architecture/agents/agent-requirement-map.json`.

## Кандидатные роли

Точный поиск по canonical документам не нашёл названия Security Reviewer,
Privacy Reviewer, Data Quality Reviewer, Quantitative Validation Reviewer,
Release Reviewer, Observability Reviewer, Git Integration Reviewer и Market
Regime Reviewer.

- Security/Privacy имеют связанные обязательные требования в Master
  Specification 26 и существующие privacy policies, поэтому реализованы только
  как `PARTIAL` profiles/CI controls в предложенном RFC.
- Data Quality имеет проверки в 07 и 27, Release — checklist в 25,
  Observability — требования в 27; наличие предметной области не доказывает
  существование именованного агента.
- Quantitative Validation, Git Integration и Market Regime Reviewer не
  включены в mandatory set. Требуется отдельный RFC/ADR.
- Canonical baseline содержит Market Regime v3.0; документ v3.2 отсутствует.
  Это `CONFLICTING` с входным требованием проверить v3.2, поэтому новая policy
  не выдумана.

## Separation of duties и authority

Master Specification 26 разделяет Пользователя, Разработчика, Codex, MCP и
Субагентов по least privilege. Ни один review agent не утверждает merge, не
выполняет remote write/deploy/production write и не изменяет секреты. Approval
authority остаётся у владельца/ruleset; субагент возвращает только findings.

## Конфликты и ограничения источников

- README v3.0 упоминает поток «Codex → Субагенты», но не определяет протокол
  исполнения или evidence.
- Completion Pack содержит шаблон `01_AGENTS.md`, но в baseline не было
  корневого `AGENTS.md`; шаблон не действовал как repository instruction.
- Master Specification описывает идеальные `/apps-script` и `/specification`,
  тогда как фактические canonical пути находятся в
  `IOS_SOURCE_SNAPSHOT/work/apps-script` и
  `IOS_HANDOFF_v4/master_specification`; scoped instructions покрывают оба
  фактических каталога и сохраняют указанные идеальные scopes.
