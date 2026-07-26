# Investment Operating System (IOS)

# Master Specification v4.0 — Audit Baseline

**Дата фиксации:** 18 июля 2026 года  
**Статус:** Канонический аудитный baseline, подготовленный для полного аудита проекта  
**Предшествующая версия:** Master Specification v3.0 от 6 июля 2026 года  
**Каноническая ветка проекта:** `integration/ios-current`  
**Канонический репозиторий:** `NeyJealous/ios`  
**Язык пользовательской документации:** русский  
**Класс изменения:** MAJOR REVISION  
**Назначение документа:** объединить исходную архитектуру v3.0, принятые решения и подтверждённые изменения после 6 июля 2026 года, отделив действующую реализацию от исследований, планов и неутверждённого production-влияния.

---

## 0. Юридический и инженерный статус документа

Master Specification v4.0 является главным сводным источником требований IOS для проведения архитектурного, функционального, технического, инвестиционного и governance-аудита.

Документ не объявляет реализованным то, что существует только в виде:

- исследовательского отчёта;
- задания Codex;
- незавершённой ветки;
- неслитого commit;
- RFC без принятого ADR;
- preview;
- role simulation;
- локального артефакта без подтверждения canonical branch;
- production gate без итогового PASS и approval.

При конфликте между данным документом и фактическим состоянием кода:

1. фиксируется расхождение;
2. определяется production-active source;
3. оценивается риск;
4. создаётся ADR или remediation gate;
5. Master Specification обновляется после подтверждения решения.

---

# 1. Система статусов

## 1.1. Статусы решений

| Статус | Значение |
|---|---|
| `ACCEPTED` | Решение принято и является нормативным |
| `PROVISIONAL` | Временно принято до дополнительной проверки |
| `RESEARCH_SEED` | Начальная исследовательская гипотеза или параметр |
| `EXPERIMENTAL` | Разрешено только в изолированном эксперименте |
| `NOT_APPROVED` | Не разрешено для production-влияния |
| `SUPERSEDED` | Заменено более новым решением |
| `REJECTED` | Явно отклонено |
| `UNRESOLVED` | Требуется отдельное решение |

## 1.2. Статусы реализации

| Статус | Значение |
|---|---|
| `IMPLEMENTED_AND_VERIFIED` | Реализовано, проверено и подтверждено evidence |
| `IMPLEMENTED_NOT_VERIFIED` | Код существует, но полного подтверждения нет |
| `PARTIALLY_IMPLEMENTED` | Реализована только часть контракта |
| `DOCUMENTED_ONLY` | Есть нормативный документ, реализации нет |
| `RESEARCH_ONLY` | Есть исследование, production-реализации нет |
| `SUPERSEDED` | Реализация заменена |
| `CONFLICTING` | Код и документация противоречат друг другу |
| `MISSING` | Требуемый элемент отсутствует |
| `UNKNOWN` | Недостаточно доказательств |

## 1.3. Статусы production-влияния

| Статус | Значение |
|---|---|
| `CLOSED` | Любое новое влияние на реальные действия запрещено |
| `PREVIEW_ONLY` | Разрешён расчёт и отображение без изменения действий |
| `SHADOW` | Разрешён параллельный расчёт и сравнение без исполнения |
| `LIMITED_APPROVAL` | Разрешено ограниченное влияние по отдельному ADR/gate |
| `OPEN` | Полное утверждённое production-влияние |

---

# 2. Executive Summary

IOS — долгосрочная инвестиционная операционная система, предназначенная для:

- консолидации данных по нескольким брокерским счетам;
- построения объяснимого портфеля;
- управления резервом;
- анализа акций, облигаций и фондов;
- формирования рекомендаций;
- управления TradePlan;
- контроля качества данных;
- воспроизводимого принятия решений;
- безопасной разработки через Git, PR, CI и специализированных агентов.

После Master Specification v3.0 были приняты значимые изменения:

1. введён единый `AccountScope` с пятью независимыми флагами;
2. завершён пользовательский Account Control UX;
3. исключён целевой счёт из синхронизации, расчётов, отображения, рекомендаций и истории;
4. сформирована каноническая ветка `integration/ios-current`;
5. включена защита canonical branch через pull request ruleset;
6. введён Connection Recovery Protocol;
7. введён repository-wide Agent Governance Layer;
8. принята модель гибридного governance: repository instructions + CI;
9. зафиксировано различие между real subagent, role simulation и CI validation;
10. подготовлена новая архитектура Market Regime v3.2;
11. обнаружен риск неутверждённого legacy-влияния Market Regime через R030;
12. принято fail-closed правило: до отдельного approval `AppliedMultiplier = 1.00`.

---

# 3. Канонические инварианты v4.0

## 3.1. Инвестиционные инварианты

1. Горизонт стратегии — 10+ лет.
2. Решения должны быть объяснимыми.
3. Недостаток данных приводит к `INSUFFICIENT_DATA`, а не к агрессивному предположению.
4. Ни один одиночный фактор не определяет действие.
5. Decision Engine остаётся единственным владельцем итогового action.
6. Reserve Engine остаётся единственным владельцем reserve logic.
7. AccountScope является обязательным upstream guard.
8. Investment Universe отделён от полного Directory.
9. TradePlan не может исполнять исследовательские параметры.
10. Production-влияние Market Regime закрыто до отдельного gate.

## 3.2. Production safety

До отдельного утверждения:

```text
AppliedMultiplier = 1.00
ProductionInfluenceGate = CLOSED
MarketRegimeProductionInfluence = NOT_APPROVED
ReserveUseByMarketRegime = NOT_APPROVED
clasp push = только по отдельному разрешённому gate
deployment update = запрещено без отдельного gate
production writes = должны быть явно посчитаны
```

## 3.3. Engineering safety

1. Canonical branch изменяется только через PR.
2. Force push запрещён.
3. Переписывание Git history запрещено.
4. `reset --hard` не используется как средство штатной синхронизации.
5. Task и research работа выполняются в отдельных worktree.
6. После timeout неизвестный write не повторяется.
7. При статусе `UNKNOWN` выполнение останавливается.
8. Credentials, tokens, full Account ID и Script ID не публикуются.
9. Существующие ветки не считаются покрытыми новым governance автоматически.
10. Governance self-change требует усиленного review.

---

# 4. Архитектурная модель IOS

## 4.1. Основные слои

```text
External Providers
    ↓
Raw Data
    ↓
Directory
    ↓
Investment Universe
    ↓
Normalized Facts
    ↓
Features
    ↓
Ratings / Market Regime / Portfolio State
    ↓
Decision Engine
    ↓
Recommendation Builder
    ↓
TradePlan
    ↓
Presentation / Google Sheets UI
```

Сквозные слои:

```text
AccountScope
DataConfidence
Freshness
Audit Trail
Privacy
Recovery
Agent Governance
Testing
```

## 4.2. Запрет циклической ответственности

- Provider не принимает инвестиционные решения.
- Directory не определяет Investment Universe автоматически.
- Market Regime не создаёт сделки.
- Rating не обходит Risk Guards.
- UI не является источником инвестиционной логики.
- Recommendation Builder не изменяет решение, а формирует представление.
- TradePlan не активирует неутверждённые параметры.
- Agent не имеет права обходить governance gate.

---

# 5. Источники истины

Приоритет источников:

1. фактическая canonical branch;
2. принятые ADR;
3. merged PR и merge commit;
4. Master Specification v4.0;
5. acceptance reports;
6. утверждённые gate reports;
7. RFC;
8. research reports;
9. задания Codex;
10. upstream templates.

Upstream-репозитории, включая шаблоны VoltAgent, не являются проектным source of truth после адаптации.

---

# 6. AccountScope

## 6.1. Назначение

`AccountScope` — единый сервис, определяющий участие каждого брокерского счёта в независимых контурах IOS.

## 6.2. Канонические флаги

| Пользовательское имя | Внутреннее имя |
|---|---|
| Синхронизировать | `Sync_Enabled` |
| Учитывать в расчётах | `Calculation_Enabled` |
| Показывать | `Display_Enabled` |
| Использовать в рекомендациях | `Recommendations_Enabled` |
| Хранить историю | `History_Enabled` |

## 6.3. Контракт

```javascript
getAllAccounts()
getSyncEnabledAccountIds()
getCalculationEnabledAccountIds()
getDisplayEnabledAccountIds()
getRecommendationEnabledAccountIds()
getHistoryEnabledAccountIds()

isSyncEnabled(accountId)
isCalculationEnabled(accountId)
isDisplayEnabled(accountId)
isRecommendationEnabled(accountId)
isHistoryEnabled(accountId)
```

## 6.4. Правила

1. Единственный ключ — Account ID.
2. Название счёта не используется как ключ.
3. Неизвестный Account ID по умолчанию выключен.
4. Отсутствующий или невалидный флаг трактуется консервативно.
5. Фильтрация не должна дублироваться вручную в каждом модуле.
6. Сервис читается пакетно и кэшируется на один execution context.
7. Diagnostics маскируют ID.
8. Display и Calculation являются независимыми флагами.
9. Recommendations без Calculation блокируются.
10. Выключение последнего расчётного счёта должно быть защищено validation guard.

## 6.5. Подтверждённое состояние CODEX-04A

Был выполнен контролируемый purge исключённого счёта:

- удалено 160 Trades;
- удалена 1 строка Portfolio;
- удалено 17 cache rows;
- всего удалено 178 строк;
- остальные 6 Trades сохранены;
- повторный purge вернул `ALREADY_EXCLUDED`;
- reconciliation delta составила 0,00 RUB;
- provider calls во время migration/recovery — 0;
- production deployments остались без изменений;
- rollback evidence сохранён.

Статус: `IMPLEMENTED_AND_VERIFIED`.

## 6.6. Account Control UX

CODEX-04B закрепил:

- русскоязычное меню `IOS → Счета`;
- preview без записи;
- apply с revision/hash guard;
- exact write set;
- append-only audit trail;
- rollback по RunId;
- JSON-safe history;
- защиту исключённого счёта от неявного восстановления;
- diagnostics;
- sheet protection;
- masked identifiers;
- отсутствие data loss.

Статус: `ACCEPTED`, `IMPLEMENTED_AND_VERIFIED`.

---

# 7. Google Sheets Architecture

Google Sheets является presentation и controlled-configuration layer, но не самостоятельным владельцем инвестиционной логики.

## 7.1. Требования

- заголовки определяются по именам, а не по жёстким номерам столбцов;
- технические ID скрываются от обычного пользовательского представления;
- audit trail append-only;
- пользовательские операции имеют preview;
- apply защищён revision/hash;
- rollback имеет одноразовую или явно управляемую семантику;
- даты сериализуются в ISO-8601;
- UI wrappers возвращают JSON-safe значения;
- формулы не должны обходить AccountScope, DataConfidence или Decision Engine.

## 7.2. Production data rules

Любое изменение production sheets должно указывать:

- точный write set;
- строки до/после;
- RunId;
- masked target;
- reason;
- previewHash;
- revision before/after;
- rollback state;
- API calls;
- deployment impact.

---

# 8. Apps Script Architecture

## 8.1. Роль

Apps Script реализует:

- синхронизацию;
- нормализацию;
- расчёты;
- UI wrappers;
- diagnostics;
- AccountScope;
- Decision Engine;
- Rule Engine;
- TradePlan;
- audit trail.

## 8.2. Ограничения

- `clasp push --force` запрещён;
- deployment update выполняется только отдельным gate;
- source push не означает deployment;
- round-trip compare обязателен после push;
- количество deployments контролируется;
- private `.clasp.json` не отслеживается Git;
- Script ID не публикуется;
- timeout не является доказательством неуспеха write.

---

# 9. Data Architecture and DataConfidence

## 9.1. Классы данных

```text
Raw
Normalized
Derived
Decision
Presentation
Audit
```

## 9.2. Обязательные атрибуты критических данных

- source;
- observedAt;
- effectiveAt;
- retrievedAt;
- freshness;
- quality status;
- confidence;
- fallback status;
- point-in-time validity.

## 9.3. Fail-closed правила

При отсутствии, устаревании или конфликте данных:

- не увеличивать риск;
- не повышать buy priority;
- не увеличивать quantity;
- не активировать multiplier;
- не подменять неизвестное нейтральным фактом без маркировки;
- возвращать `INSUFFICIENT_DATA` либо нейтральный безопасный результат.

---

# 10. Investment Universe

Directory содержит доступные инструменты, но не является списком допустимых инвестиций.

Investment Universe формируется отдельными правилами:

- поддерживаемый тип инструмента;
- доступность данных;
- валидность идентификаторов;
- ликвидность;
- валюта;
- AccountScope;
- стратегия;
- risk limits;
- исключения;
- санкционные и инфраструктурные ограничения при наличии утверждённого источника.

---

# 11. Portfolio Engine

Portfolio Engine отвечает за:

- позиции;
- cash;
- оценку;
- allocation;
- concentration;
- currency exposure;
- account-level и consolidated view;
- reconciliation;
- portfolio health.

Portfolio Engine не формирует action самостоятельно.

Все consolidated-расчёты используют только счета с `Calculation_Enabled = true`.

---

# 12. Reserve Engine

Reserve Engine является единственным владельцем резервной логики.

Он определяет:

- target reserve;
- minimum reserve;
- current reserve;
- deficit;
- restoration priority;
- eligible money-market instruments;
- lot rounding;
- ограничения использования резерва.

Market Regime не может использовать резерв без отдельного принятого ADR.

Текущий статус `ReserveUseByMarketRegime = NOT_APPROVED`.

---

# 13. Bond and Coupon Engine

Bond Engine отвечает за:

- номинал;
- купон;
- accrued interest;
- maturity;
- amortization;
- yield;
- duration;
- credit quality;
- liquidity;
- налоговые и валютные атрибуты при наличии данных.

Coupon Ladder отвечает за распределение денежных потоков по месяцам.

Решение о покупке облигации проходит через Decision Engine и AccountScope.

---

# 14. Company Rating

Company Rating оценивает качество эмитента и не является прямой торговой командой.

Принципы:

- качество важнее максимальной ожидаемой доходности;
- отсутствие данных снижает confidence;
- значения должны быть объяснимыми;
- веса и thresholds versioned;
- изменение методологии проходит RFC/ADR;
- rating не обходит portfolio limits и risk guards.

---

# 15. Investment Strategy

## 15.1. Цель

Создать долгосрочный портфель, который:

- увеличивает капитал;
- создаёт устойчивый денежный поток;
- требует минимального ручного сопровождения;
- адаптируется к рыночной среде;
- сохраняет объяснимость.

## 15.2. Поддерживаемые классы активов

- акции;
- облигации;
- биржевые фонды.

Расширение требует обновления Master Specification.

## 15.3. Основные принципы

1. Качество важнее доходности.
2. Диверсификация важнее концентрации.
3. Риск контролируется заранее.
4. Решения основаны на данных.
5. Любая рекомендация объяснима.
6. Недостаток данных ведёт к `INSUFFICIENT_DATA`.
7. Исследовательские параметры не являются production-параметрами.
8. Любое усиление покупки требует отдельного approval.

---

# 16. Market Regime v3.2

## 16.1. Назначение

Market Regime классифицирует рыночную среду и формирует диагностический контекст для Decision Engine.

Market Regime не создаёт BUY, SELL или TradePlan.

## 16.2. Разделение факторов

Новая модель разделяет:

```text
OpportunityScore
StructuralRiskScore
```

`CapacityScore` не входит непосредственно в определение режима и относится к downstream capacity/portfolio logic.

## 16.3. Режимы

Каноническая пользовательская модель содержит четыре режима и обязательный статус:

```text
INSUFFICIENT_DATA
```

Точные названия и границы режимов должны быть закреплены в отдельной принятой спецификации Market Regime v3.2 и versioned registry.

## 16.4. Drawdown ladder

Исследовательская шкала:

```text
1.0 / 1.5 / 2.0 / 3.0 / 4.0
```

является ceiling-кандидатом и не является прямой командой покупки.

`PriceDrawdown` — основной research-кандидат.  
Total Return — challenger.  
Окно drawdown должно калиброваться.

Статус: `RESEARCH_SEED`.

## 16.5. Формулы и веса

- веса факторов являются `RESEARCH_SEED`;
- сравниваются формулы A/B/C;
- bottleneck formula является стартовым кандидатом;
- ни одна формула не получает production-влияние без backtest, PIT validation, model-risk review и approval gate.

## 16.6. DataConfidence

Market Regime обязан учитывать:

- completeness;
- freshness;
- provenance;
- point-in-time validity;
- provider conflicts;
- fallback usage;
- missing factor coverage.

Низкая confidence приводит к `INSUFFICIENT_DATA` или нейтральному downstream result.

## 16.7. Provenance gap

Историческая версия v3.1 упоминается, но её полный канонический артефакт не подтверждён.

Следствия:

- запрещено реконструировать v3.1 по памяти;
- точный clause-by-clause diff v3.1 → v3.2 считается `MISSING`;
- v3.2 может использоваться как новая спецификация при наличии собственных источников и acceptance;
- исторический provenance gap фиксируется в audit register.

---

# 17. PreviewMultiplier и AppliedMultiplier

## 17.1. Контракт

```text
PreviewMultiplier
AppliedMultiplier
MultiplierApprovalStatus
MultiplierReason
MarketRegimeDataConfidence
MarketRegimeFreshness
MarketRegimeSource
```

## 17.2. Инварианты

1. PreviewMultiplier может рассчитываться и отображаться.
2. AppliedMultiplier до approval всегда равен `1.00`.
3. R030 может читать только AppliedMultiplier.
4. R030 не должен читать raw legacy multiplier.
5. invalid/missing/stale/low-confidence input приводит к `1.00`.
6. неизвестный approval status приводит к `1.00`.
7. PreviewMultiplier не влияет на action, score, priority, quantity, urgency или executable TradePlan fields.
8. Market Regime не обходит Reserve, AccountScope, Rating, Limits или Risk Guards.

## 17.3. Аудитный статус

На дату v4.0 наличие отдельного задания CODEX-05 не считается доказательством merged implementation.

Следовательно:

```text
Desired contract: ACCEPTED
Verified canonical implementation: требует отдельной проверки
Production approval: NOT_APPROVED
AppliedMultiplier normative value: 1.00
```

---

# 18. Decision Engine

Decision Engine — единственный владелец итогового действия.

## 18.1. Входы

- Strategy;
- AccountScope;
- Portfolio State;
- Reserve State;
- Company Rating;
- Bond Engine;
- Market Regime context;
- DataConfidence;
- Limits;
- Risk Guards;
- Rebalance state;
- Investment Universe.

## 18.2. Выходы

- action;
- score;
- priority;
- quantity proposal;
- urgency;
- reasons;
- blockers;
- confidence;
- status.

## 18.3. Запреты

Decision Engine не должен:

- принимать raw provider data без нормализации;
- использовать выключенный account;
- обходить reserve guard;
- повышать риск при insufficient data;
- активировать research-only parameters;
- передавать preview multiplier как applied;
- считать UI-флаг production approval.

---

# 19. Rule R030

R030 связан с влиянием рыночного режима на контекст решения.

## 19.1. Обнаруженный риск

Исследование выявило legacy path, при котором multiplier > 1 мог влиять на buy priority через Decision Engine / Rule R030.

Риск был классифицирован как:

```text
CRITICAL_ACTIVE_INFLUENCE_RISK
OPEN_HIGH
UNAPPROVED_INFLUENCE
```

## 19.2. Нормативное решение v4.0

- R030 не создаёт BUY;
- R030 не повышает priority до approval;
- R030 не меняет quantity;
- R030 не меняет urgency;
- R030 читает только AppliedMultiplier;
- AppliedMultiplier равен 1.00 до approval;
- PreviewMultiplier остаётся диагностическим.

## 19.3. Реализационный статус

До подтверждения merged remediation:

```text
Specification status: ACCEPTED
Implementation status: UNKNOWN / requires canonical audit
Production gate: CLOSED
```

---

# 20. Recommendation Builder и TradePlan

Recommendation Builder преобразует решение в пользовательское объяснение.

TradePlan хранит планируемые действия, но не является независимым decision owner.

## 20.1. Обязательные свойства

- explainability;
- AccountScope filtering;
- DataConfidence;
- decision trace;
- rule trace;
- portfolio impact;
- reserve impact;
- executable/non-executable status;
- preview/applied distinction;
- deterministic rebuild.

## 20.2. Запреты

- исследовательский branch не изменяет production TradePlan;
- PreviewMultiplier не меняет executable fields;
- исключённый account не появляется в Advisor/TradePlan;
- UI не может сделать plan executable без Decision Engine.

---

# 21. Repository and Branch Governance

## 21.1. Canonical branch

```text
integration/ios-current
```

является канонической общей линией проекта.

## 21.2. Защита

- прямой push запрещён ruleset;
- изменения проходят PR;
- required checks не обходятся обычным workflow;
- force push запрещён;
- history rewrite запрещён;
- merge strategy должна сохранять auditability.

## 21.3. Worktree policy

Для каждой значимой задачи:

- отдельная branch;
- отдельный worktree;
- baseline SHA;
- clean status;
- fetch;
- fast-forward only для canonical;
- запрет вмешательства в другие незавершённые worktree;
- отдельный conflict audit перед integration.

## 21.4. Existing branches

Новые ветки наследуют governance от обновлённой canonical branch.

Старые ветки не считаются автоматически покрытыми. Для них требуется:

- merge;
- rebase;
- cherry-pick governance commit;
- либо явная классификация archived/stale.

---

# 22. Pull Request Governance

Каждый значимый PR должен содержать:

- цель;
- scope;
- baseline;
- changed files;
- tests;
- privacy;
- production impact;
- Apps Script impact;
- Sheets impact;
- deployment impact;
- production writes;
- rollback;
- blockers;
- unresolved risks;
- exact next approval.

PR не должен выдавать simulation за независимый review.

---

# 23. Connection Recovery Protocol

## 23.1. Цель

Предотвратить duplicate write после timeout, disconnect, app crash или неизвестного результата.

## 23.2. Статусная модель

```text
NOT_STARTED
→ LOCAL_ONLY
→ PUSH_COMPLETED
→ PR_CREATED
→ MERGED
→ REMOTE_APPLY_COMPLETED
```

При недостаточном или противоречивом evidence:

```text
UNKNOWN → STOP
```

## 23.3. Применимость

Протокол обязателен для:

- Git push;
- PR create/update;
- merge;
- GitHub Actions write operations;
- clasp push;
- Apps Script deployment;
- Google Sheets write;
- broker/API write;
- IcePanel import;
- snapshot creation;
- любых production writes.

## 23.4. Алгоритм

Перед write:

1. создать checkpoint;
2. выполнить pre-write guard;
3. проверить отсутствие duplicate;
4. выполнить write один раз.

После write:

1. выполнить read-only verification;
2. собрать sanitized evidence;
3. классифицировать фактический статус;
4. закрыть checkpoint.

После disconnect:

1. не повторять write;
2. запустить handler;
3. выполнить read-only verification;
4. при `UNKNOWN` остановиться;
5. продолжить с первого подтверждённо незавершённого идемпотентного шага.

## 23.5. Канонический статус

Connection Recovery Protocol merged в canonical branch и является `IMPLEMENTED_AND_VERIFIED` на governance-уровне.

---

# 24. Agent Governance Layer

## 24.1. Архитектура

```text
Repository Instructions
Agent Registry
Review Matrix
Agent Resolver
Review Manifest
Review Reports
CI Validator
Anti-Tamper Policy
Owner Approval Contract
```

## 24.2. Каноническая модель

Принят гибридный вариант:

```text
HYBRID_REPOSITORY_PLUS_CI
```

Repository задаёт инструкции и профили; CI независимо проверяет обязательные reviews и evidence.

## 24.3. Компоненты

### Root instructions

Корневой `AGENTS.md` задаёт обязательные инварианты.

Directory-scoped instructions могут усиливать, но не ослаблять root safety.

### Agent Registry

Хранит:

- AgentId;
- status;
- source;
- purpose;
- model;
- permissions;
- trigger;
- inputs;
- outputs;
- forbidden actions;
- execution mode.

### Review Matrix

Определяет обязательные роли по changed paths и классу изменения.

### Resolver

Детерминированно вычисляет required agents.

### Manifest

Связывает review с:

- branch;
- base SHA;
- head SHA;
- gate;
- agent;
- execution mode;
- result;
- findings;
- evidence.

### CI Validator

Проверяет:

- registry;
- matrix;
- instruction hierarchy;
- manifest;
- reports;
- stale SHA;
- missing mandatory review;
- CRITICAL/BLOCKER;
- privacy;
- tampering.

## 24.4. Anti-tamper

Изменения governance paths требуют усиленного review:

- `AGENTS.md`;
- `.codex/agents/**`;
- `architecture/agents/**`;
- `docs/agents/**`;
- `tools/*agent*`;
- `.github/workflows/agent-governance.yml`;
- registry/matrix/schema;
- bypass policy.

---

# 25. Реальные субагенты и simulation

## 25.1. Execution modes

```text
REAL_SUBAGENT
CODEX_ROLE_SIMULATION
CI_VALIDATOR
MANUAL_REVIEW
NOT_AVAILABLE
```

## 25.2. Главное правило

Наличие `.toml`-профиля не доказывает фактический запуск реального субагента.

`REAL_SUBAGENT` допускается только при наличии:

- фактического делегирования;
- отдельного результата;
- execution evidence;
- идентифицируемой роли;
- корректного model contract;
- output contract;
- привязки к branch/base/head.

Simulation не считается независимым review.

## 25.3. Solo maintainer

При отсутствии независимого уполномоченного reviewer допускается:

```text
SOLO_MAINTAINER_OWNER_BYPASS
```

Только при условиях:

- bypass явно документирован;
- CI остаётся обязательным;
- unresolved conversations не обходятся;
- privacy и status checks не отключаются;
- production/deployment approval не выдаётся автоматически;
- фиктивный independent review запрещён.

---

# 26. Agent Catalog

## 26.1. Upstream-based project agents

- quant-analyst;
- data-scientist;
- data-engineer;
- data-researcher;
- research-analyst;
- risk-manager;
- architect-reviewer;
- qa-expert;
- test-automator;
- search-specialist;
- documentation-engineer;
- git-workflow-manager.

## 26.2. IOS-specific agents

- pit-data-quality-reviewer;
- russia-market-regime-economist;
- russia-ofz-rates-specialist;
- ios-quant-backtest-auditor;
- market-regime-model-risk-reviewer;
- historical-execution-simulator-reviewer;
- ios-agent-orchestrator.

## 26.3. Требования к каждому агенту

- upstream source;
- IOS-specific additions;
- trigger;
- gate applicability;
- permissions;
- forbidden actions;
- required inputs;
- required outputs;
- execution mode;
- relation to governance role;
- replace/supplement decision;
- model availability evidence.

Upstream текст не должен заменять исходный смысл агента бессодержательной адаптацией. IOS-изменения должны дополнять базовую специализацию, а не удалять её.

---

# 27. Agent Orchestration

`ios-agent-orchestrator` определяет порядок вызова, но не подменяет специализированные reviews.

Пример исследовательского маршрута:

```text
data-researcher
→ pit-data-quality-reviewer
→ data-engineer
→ quant-analyst
→ historical-execution-simulator-reviewer
→ ios-quant-backtest-auditor
→ market-regime-model-risk-reviewer
→ risk-manager
→ architect-reviewer
→ documentation-engineer
```

Обязательные правила:

- фактический вызов отражается в manifest;
- skipped agent имеет обоснование;
- `NOT_APPLICABLE` проверяется;
- findings CRITICAL/BLOCKER закрываются до merge;
- orchestration не даёт production approval.

---

# 28. Testing and Validation

## 28.1. Уровни

- unit;
- integration;
- regression;
- fixture;
- schema;
- privacy;
- deterministic rebuild;
- round-trip;
- remote read-only validation;
- shadow;
- backtest;
- PIT validation;
- model-risk review.

## 28.2. Минимальные regression-контуры

- Sync;
- AccountScope;
- Portfolio;
- Reserve;
- Decision Engine;
- Rule Engine;
- R030;
- Recommendation Builder;
- TradePlan;
- Advisor;
- Main;
- Full/Quick/Recalc;
- audit/history;
- recovery;
- governance resolver/manifest;
- privacy.

## 28.3. Research validation

Новая инвестиционная логика требует:

- point-in-time dataset;
- survivorship-bias control;
- look-ahead control;
- transaction costs;
- execution lag;
- missing data policy;
- benchmark;
- challenger models;
- sensitivity analysis;
- regime stability;
- out-of-sample validation;
- failure-mode analysis.

---

# 29. Security and Privacy

Запрещено публиковать:

- GitHub tokens;
- OAuth tokens;
- cookies;
- Authorization headers;
- `.clasprc.json`;
- `.env`;
- full Account ID;
- full Script ID;
- private API payloads;
- local absolute user paths;
- private backups;
- real recovery checkpoints.

Различаются:

```text
CURRENT_TREE_PRIVACY
HISTORICAL_PRIVACY
```

Текущий tree может иметь PASS при наличии отдельно документированного исторического риска. Эти статусы нельзя смешивать.

---

# 30. Observability and Audit Evidence

Каждая значимая операция должна иметь:

- timestamp;
- RunId;
- branch;
- base SHA;
- head SHA;
- actor/mode;
- masked target;
- before/after;
- reason;
- result;
- tests;
- privacy;
- production writes;
- rollback;
- unresolved status.

Evidence должна быть:

- sanitized;
- machine-readable;
- human-readable;
- immutable либо append-only;
- связана с конкретным commit.

---

# 31. RFC and ADR Governance

## 31.1. RFC обязателен, если изменение

- добавляет модуль;
- меняет архитектуру;
- меняет инвестиционную стратегию;
- меняет модель данных;
- меняет production influence;
- меняет governance;
- меняет security model;
- меняет recovery protocol.

## 31.2. ADR

ADR фиксирует принятое решение и не переписывается задним числом.

При замене создаётся новый ADR со ссылкой на superseded ADR.

## 31.3. Жизненный цикл

```text
Idea
→ RFC
→ Discussion
→ Approval
→ ADR
→ Master Specification
→ Implementation
→ Review
→ Tests
→ Acceptance
→ Merge
→ Project History
```

---

# 32. Release and Deployment Governance

Отдельно различаются:

- Git commit;
- branch push;
- PR;
- merge;
- Apps Script source push;
- deployment update;
- production data write.

Ни один предыдущий шаг не означает автоматического разрешения следующего.

Release gate обязан показывать:

- source commit;
- deployed version;
- deployment inventory;
- config diff;
- data migrations;
- rollback;
- recovery checkpoint;
- production writes;
- owner approval.

---

# 33. Rollback

## 33.1. Git rollback

Предпочтительно:

- revert merge commit;
- новый PR;
- без force push;
- без history rewrite.

## 33.2. Data rollback

Требует:

- pre-change backup;
- exact write set;
- RunId;
- rollback registry;
- idempotency;
- consumed state;
- reconciliation.

## 33.3. Governance rollback

- revert governance merge;
- отдельно изменить required check владельцем;
- сохранить старые reports как audit history;
- не затрагивать Apps Script, Sheets и deployments без необходимости.

---

# 34. Audit Traceability Model

Для каждого требования:

```text
Requirement
→ Source Decision
→ RFC/ADR
→ Specification Section
→ Implementation Files
→ Tests
→ Audit Evidence
→ Production Status
```

Минимальные поля реестра:

```json
{
  "requirementId": "",
  "title": "",
  "decisionStatus": "",
  "implementationStatus": "",
  "productionStatus": "",
  "sourceDocuments": [],
  "sourceCommits": [],
  "implementationFiles": [],
  "tests": [],
  "evidence": [],
  "risks": [],
  "owner": "",
  "nextGate": ""
}
```

---

# 35. Принятые изменения после 6 июля 2026 года

## PH-0100 — AccountScope

**Решение:** единый сервис и пять независимых флагов.  
**Статус:** `IMPLEMENTED_AND_VERIFIED`.

## PH-0101 — Controlled account exclusion

**Решение:** исключение целевого счёта с purge 178 строк, idempotent rebuild и rollback evidence.  
**Статус:** `IMPLEMENTED_AND_VERIFIED`.

## PH-0102 — Account Control UX

**Решение:** preview/apply/rollback/audit/history/validation.  
**Статус:** `ACCEPTED`, `IMPLEMENTED_AND_VERIFIED`.

## PH-0103 — Canonical integration branch

**Решение:** `integration/ios-current`.  
**Статус:** `ACCEPTED`.

## PH-0104 — GitHub protection ruleset

**Решение:** изменения canonical branch только через PR.  
**Статус:** `IMPLEMENTED_AND_VERIFIED`.

## PH-0105 — Russian documentation policy

**Решение:** пользовательские отчёты и документация ведутся на русском языке.  
**Статус:** `ACCEPTED`.

## PH-0106 — Connection Recovery Protocol

**Решение:** no retry after unknown write; read-only verification; `UNKNOWN → STOP`.  
**Статус:** `IMPLEMENTED_AND_VERIFIED`.

## PH-0107 — Global Agent Governance

**Решение:** repository instructions + registry + matrix + resolver + manifest + CI.  
**Статус:** `ACCEPTED`, `IMPLEMENTED_AND_VERIFIED`.

## PH-0108 — Solo maintainer bypass

**Решение:** документированный PR-scoped bypass без ослабления CI и safety.  
**Статус:** `ACCEPTED`.

## PH-0109 — Market Regime v3.2 research architecture

**Решение:** Opportunity/Risk split, DataConfidence, drawdown ceiling, research gates.  
**Статус:** `RESEARCH_ONLY / DOCUMENTED_ONLY` до отдельной полной проверки canonical integration.

## PH-0110 — R030 neutralization contract

**Решение:** `AppliedMultiplier = 1.00` до approval, preview отделён от applied.  
**Статус:** нормативно `ACCEPTED`; фактическая merged implementation требует аудита.

## PH-0111 — Research subagent reconciliation

**Решение:** upstream agents дополняются IOS-specific контрактами; simulation не равна real subagent.  
**Статус:** `PROVISIONAL`, требуется reconciliation acceptance и canonical evidence.

---

# 36. Текущие открытые риски

| ID | Риск | Статус | Требуемое действие |
|---|---|---|---|
| RISK-001 | Legacy multiplier может влиять через R030 | `OPEN_HIGH` до проверки remediation | Canonical code audit и CODEX-05 acceptance |
| RISK-002 | Market Regime v3.1 provenance отсутствует | `OPEN` | Зафиксировать gap, не реконструировать |
| RISK-003 | Research weights могут быть приняты за production | `CONTROLLED` | Статусы `RESEARCH_SEED`, closed gate |
| RISK-004 | `.toml` агент может быть ошибочно принят за real execution | `CONTROLLED` | Manifest evidence и execution mode |
| RISK-005 | Старые ветки не имеют нового governance | `OPEN` | Branch adoption inventory |
| RISK-006 | Model slug и Codex availability могут изменяться | `OPEN` | Smoke test и official verification |
| RISK-007 | Historical privacy risk | `DOCUMENTED_RISK` | Не смешивать с current-tree privacy |
| RISK-008 | Master Specification v3.0 и runtime расходятся | `OPEN` | v4.0 traceability audit |

---

# 37. Обязательный полный аудит v4.0

## 37.1. Архитектурный аудит

- слои;
- зависимости;
- циклы;
- ownership;
- data flow;
- active/dead/legacy paths;
- Apps Script architecture;
- Sheets formulas;
- provider boundaries.

## 37.2. Runtime audit

- фактическая canonical branch;
- Apps Script remote match;
- deployment inventory;
- AccountScope;
- R030;
- Decision Engine;
- TradePlan;
- Market Regime;
- Reserve;
- Recalc;
- Full/Quick.

## 37.3. Data audit

- schema;
- IDs;
- timestamps;
- freshness;
- duplicates;
- reconciliation;
- PIT;
- cache;
- derived data;
- audit trail.

## 37.4. Governance audit

- ruleset;
- PR checks;
- recovery;
- agent registry;
- matrix;
- resolver;
- manifests;
- anti-tamper;
- bypass.

## 37.5. Documentation audit

- v3.0 coverage;
- post-v3 decisions;
- missing ADR;
- superseded docs;
- orphan requirements;
- undocumented runtime;
- documented-only features.

---

# 38. Definition of Done для Master Specification v4.0

v4.0 считается полностью принятой только если:

1. все разделы v3.0 сопоставлены с v4.0;
2. все решения после 6 июля внесены в decision register;
3. canonical branch проверена;
4. implementation trace построен;
5. R030 active path проверен;
6. Market Regime research отделён от production;
7. AccountScope и CODEX-04B подтверждены;
8. governance merge commits подтверждены;
9. recovery подтверждён;
10. agent execution modes формализованы;
11. все открытые риски имеют owner и next gate;
12. privacy PASS для current tree;
13. исторические риски описаны отдельно;
14. сформирован machine-readable requirement register;
15. пользователь утвердил v4.0 как новый baseline.

---

# 39. Source Register

## 39.1. Baseline v3.0

- `05_Project_History_IOS_Master_Specification_v3.0.md`
- `15.1_Investment_Strategy_Foundation_IOS_Master_Specification_v3.0.md`
- `23_RFC_ADR_IOS_Master_Specification_v3.0.md`
- остальные разделы комплекта Master Specification v3.0 от 6 июля 2026 года.

## 39.2. Account governance

- `CODEX_04A_GATE_A_ACCOUNT_SCOPE_STAGING.txt`
- `CODEX_04A_FINALIZE_AND_PREPARE_CODEX_04B.txt`
- `CODEX_04B_FINAL_ACCEPTANCE.txt`
- `CODEX_04B_SAFE_INTEGRATION_GATE.txt`

## 39.3. Market Regime and R030

- `CODEX_R030_MARKET_REGIME_RESEARCH_WORKTREE.txt`
- `CODEX_05_R030_NEUTRALIZATION_GATE.txt`
- CODEX-06-PRE materials;
- Market Regime v3.2 documents and research artifacts.

## 39.4. Repository governance

- canonical branch policy commits;
- GitHub protection ruleset evidence;
- PR №1;
- PR №2;
- PR №3;
- `CODEX_GLOBAL_AGENT_GOVERNANCE_ALL_BRANCHES.txt`;
- `CODEX_AGENT_GOVERNANCE_RECONCILIATION_WITH_RESEARCH_SUBAGENTS.txt`.

## 39.5. Confirmed canonical merge commits

```text
07a9fd25946904a8241fd842b570fd18f6b67d26
  Merge PR #1: governance publication and ruleset evidence

f9fbe266265a89b0db8815c5977f3ae874703d71
  Merge PR #2: Connection Recovery Protocol

d2d60713e580fa1bcce8ba874216619598094093
  Merge PR #3: repository-wide Agent Governance
```

---

# 40. Итоговая каноническая позиция

1. Master Specification v3.0 сохраняется как неизменяемый исторический baseline.
2. Master Specification v4.0 становится основой полного аудита.
3. Подтверждённые merged governance-решения считаются действующими.
4. AccountScope и Account Control UX считаются принятыми.
5. Market Regime v3.2 остаётся исследовательской архитектурой до полного gate.
6. AppliedMultiplier нормативно равен 1.00 до отдельного approval.
7. R030 remediation считается подтверждённой только после проверки canonical implementation.
8. Real subagent и role simulation никогда не смешиваются.
9. Timeout или disconnect не разрешают повторный write.
10. Любое расхождение между спецификацией и runtime становится аудиторской находкой, а не скрытым допущением.

---

# Приложение A. Рекомендуемая структура repository package v4.0

```text
specification/v4.0/
├── 00_MASTER_INDEX.md
├── 01_EXECUTIVE_AUDIT_BASELINE.md
├── 02_SYSTEM_CONSTITUTION.md
├── 03_ARCHITECTURE.md
├── 04_DATA_ARCHITECTURE.md
├── 05_PROJECT_HISTORY.md
├── 06_TRACEABILITY_MODEL.md
├── 07_ACCOUNT_SCOPE.md
├── 08_GOOGLE_SHEETS_ARCHITECTURE.md
├── 09_APPS_SCRIPT_ARCHITECTURE.md
├── 10_PROVIDER_ARCHITECTURE.md
├── 11_DATA_CONFIDENCE.md
├── 12_PORTFOLIO_AND_RESERVE.md
├── 13_BOND_AND_COUPON_ENGINE.md
├── 14_COMPANY_RATING.md
├── 15_INVESTMENT_STRATEGY.md
├── 16_MARKET_REGIME.md
├── 17_DECISION_ENGINE_AND_R030.md
├── 18_TRADE_PLAN.md
├── 19_PRODUCTION_INFLUENCE_GATES.md
├── 20_AGENT_GOVERNANCE.md
├── 21_DEVELOPMENT_PLATFORM.md
├── 22_GIT_BRANCH_WORKTREE_POLICY.md
├── 23_CONNECTION_RECOVERY_PROTOCOL.md
├── 24_SECURITY_PRIVACY.md
├── 25_TESTING_VALIDATION.md
├── 26_RFC_ADR_GOVERNANCE.md
├── 27_ROADMAP.md
├── 28_ROLLBACK_AND_RECOVERY.md
└── 29_AUDIT_FINDINGS_AND_GAPS.md
```

# Приложение B. Рекомендуемые machine-readable registers

```text
audit/master-spec-v4/
├── decision-register.json
├── requirement-traceability-matrix.json
├── implementation-gap-register.json
├── superseded-documents.json
├── unresolved-decisions.json
├── production-influence-register.json
├── branch-governance-coverage.json
└── master-spec-v4-audit-report.md
```
