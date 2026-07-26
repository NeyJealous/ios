# IOS Agent Platform Specification v2.1 — Full Upstream, Orchestration and Automatic Codex Dispatch

**Дата фиксации:** 18 июля 2026 года  
**Статус:** `PROPOSED — расширено orchestration/upstream/auto-dispatch`  
**Класс изменения:** `MAJOR REVISION`  
**Связанная спецификация:** IOS Master Specification v4.0 — Audit Baseline  
**Каноническая ветка:** `integration/ios-current`  
**Канонический репозиторий:** `NeyJealous/ios`  
**Язык нормативной документации:** русский  
**Количество целевых агентов:** 44  

## 0. Upstream-источники

1. `https://github.com/VoltAgent/awesome-codex-subagents`
2. `https://github.com/wshobson/agents`

Импортируемая профессиональная база upstream-агентов является неизменяемой. IOS может только:

- включать профиль полностью;
- объединять несколько полных профилей;
- добавлять append-only IOS overlay;
- усиливать запреты и сужать permissions;
- добавлять triggers, inputs, outputs, evidence и model contract.

Переписывание, сокращение, смысловая адаптация или удаление частей upstream-базы запрещены.

---

# 1. Назначение

Документ определяет полный каталог агентов IOS, обязательные и условные роли, модельный контракт каждого агента, баланс цена/качество, маршрутизацию моделей, бюджетные классы, переносимость между устройствами и acceptance-процесс.

---

# 2. Официальная модельная основа

| Уровень | Назначение |
|---|---|
| `GPT-5.6 Luna` | быстрый и дешёвый preflight, классификация, schemas, summaries |
| `GPT-5.6 Terra` | основная сбалансированная модель для большинства инженерных reviews |
| `GPT-5.6 Sol` | критические, сложные, cross-module и высокорисковые reviews |
| `GPT-5.6 Sol Pro` | исключительная owner-approved эскалация |

Относительная Codex token-based стоимость:

| Модель | Input credits / 1M | Cached input | Output credits / 1M |
|---|---:|---:|---:|
| GPT-5.6 Sol | 125 | 12.5 | 750 |
| GPT-5.6 Terra | 62.5 | 6.25 | 375 |
| GPT-5.6 Luna | 25 | 2.5 | 150 |

---

# 3. Общие model invariants

1. Модель задаётся через versioned `model-registry.yaml`.
2. Точный slug проверяется smoke test.
3. Отсутствие обязательной модели даёт `NOT_AVAILABLE`.
4. Silent downgrade запрещён.
5. Luna не выдаёт финальный критический PASS.
6. Sol обязателен для security, unknown-write recovery, production influence, governance self-change и критического model risk.
7. Sol Pro требует owner approval и budget gate.
8. Изменение model assignment проходит отдельный PR и fixture regression.
9. Evidence связывается с model slug, reasoning level, profile hash, base SHA и head SHA.
10. Повторный review при неизменных SHA/profile/model не выполняется без причины.

---

# 4. Бюджетные классы

| Класс | Основная модель | Применение |
|---|---|---|
| `LOW` | Luna | поиск, редактирование, документация, preflight |
| `STANDARD` | Terra | обычный engineering/review workflow |
| `HIGH` | Sol | критические и cross-system гейты |
| `EXCEPTIONAL` | Sol Pro | только owner-approved исключения |

---

# 5. Полный каталог и модельная матрица

| № | Agent ID | Назначение | Приоритет | Primary | Reasoning | Preflight | Escalation | Verdict floor | Budget |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `data-researcher` | Исследователь данных и первичных источников | P1 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 2 | `research-analyst` | Синтез исследований и аналитических выводов | P1 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 3 | `search-specialist` | Точный поиск источников, API и документов | P2 | Luna | medium | Luna | Terra | Luna | LOW |
| 4 | `data-engineer` | Архитектура ingestion, normalization и data pipelines | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 5 | `data-scientist` | Статистическая обработка, признаки и экспериментальные модели | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 6 | `quant-analyst` | Количественные модели, стратегия и sensitivity analysis | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 7 | `risk-manager` | Независимая оценка инвестиционного и операционного риска | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 8 | `architect-reviewer` | Независимый архитектурный review и ownership boundaries | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 9 | `qa-expert` | Стратегия качества, acceptance и regression coverage | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 10 | `test-automator` | Проектирование и реализация автоматизированных тестов | P1 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 11 | `documentation-engineer` | Нормативная и техническая документация | P2 | Luna | high | Luna | Terra | Luna | LOW |
| 12 | `git-workflow-manager` | Ветки, worktree, PR и auditability Git-процесса | P1 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 13 | `pit-data-quality-reviewer` | PIT-валидность, freshness, provenance и look-ahead control | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 14 | `russia-market-regime-economist` | Экономическая интерпретация режимов российского рынка | P1 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 15 | `russia-ofz-rates-specialist` | ОФЗ, кривая ставок и денежно-кредитная среда РФ | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 16 | `ios-quant-backtest-auditor` | Независимый аудит backtest, bias и robustness | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 17 | `market-regime-model-risk-reviewer` | Model-risk review Market Regime | P0 | Sol | extra_high | Terra | Sol Pro | Sol | HIGH |
| 18 | `historical-execution-simulator-reviewer` | Проверка реалистичности исторического исполнения | P1 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 19 | `ios-agent-orchestrator` | Детерминированная маршрутизация специализированных reviews | P0 | Terra | high | Luna | Sol | Terra | STANDARD |
| 20 | `ios-codebase-auditor` | Repository-wide карта runtime, legacy и active paths | P0 | Sol | high | Luna | Sol Pro | Sol | HIGH |
| 21 | `apps-script-specialist` | Apps Script runtime, quotas, triggers, cache и JSON boundaries | P0 | Terra | high | Luna | Sol | Terra | STANDARD |
| 22 | `google-sheets-systems-reviewer` | Sheets schemas, formulas, UI и controlled writes | P0 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 23 | `provider-integration-reviewer` | Broker/MOEX/API contracts, retries, mapping и provenance | P0 | Terra | high | Luna | Sol | Terra | STANDARD |
| 24 | `security-privacy-auditor` | Secrets, privacy, permissions и historical exposure | P0 | Sol | high | Luna | Sol Pro | Sol | HIGH |
| 25 | `release-deployment-gatekeeper` | Release, clasp, deployment inventory и production gates | P0 | Terra | high | Luna | Sol | Terra | STANDARD |
| 26 | `recovery-idempotency-reviewer` | UNKNOWN→STOP, checkpoints и duplicate-write prevention | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 27 | `audit-traceability-reviewer` | Requirement→decision→code→tests→evidence traceability | P0 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 28 | `agent-governance-auditor` | Registry, Matrix, Resolver, manifests и anti-tamper | P0 | Sol | high | Luna | Sol Pro | Sol | HIGH |
| 29 | `production-influence-gate-reviewer` | Research-to-production paths, R030 и executable influence | P0 | Sol | extra_high | Terra | Sol Pro | Sol | HIGH |
| 30 | `data-schema-migration-reviewer` | Schemas, migrations, exact writes и reconciliation | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 31 | `performance-quota-reviewer` | Apps Script quotas, calls, latency и rebuild performance | P1 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 32 | `portfolio-construction-reviewer` | Allocation, concentration, exposure и rebalance methodology | P1 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 33 | `reserve-cash-management-reviewer` | Reserve target, deficit, restoration и money-market rules | P0 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 34 | `fixed-income-bond-reviewer` | Bond/coupon engine, YTM, duration, amortization и ladder | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 35 | `credit-risk-reviewer` | Кредитное качество эмитента и default/concentration risk | P1 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 36 | `investment-universe-reviewer` | Eligibility инструментов и отделение Directory от Universe | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 37 | `liquidity-transaction-cost-reviewer` | Liquidity, spread, slippage, lots и transaction costs | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 38 | `performance-attribution-reviewer` | Benchmark и декомпозиция доходности портфеля | P2 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 39 | `russia-investment-regulatory-tax-reviewer` | Российское регулирование, налоги и инфраструктурные ограничения | P1 | Sol | high | Terra | Sol Pro | Sol | HIGH |
| 40 | `ui-ux-accessibility-reviewer` | UX, accessibility и safety пользовательских операций | P2 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 41 | `api-contract-documenter` | Документация API, payload schemas и versioning | P2 | Luna | high | Luna | Terra | Luna | LOW |
| 42 | `dependency-supply-chain-reviewer` | Зависимости, лицензии, actions и supply-chain risk | P1 | Terra | high | Luna | Sol | Terra | STANDARD |
| 43 | `observability-diagnostics-reviewer` | RunId, telemetry, masking и диагностический evidence | P2 | Terra | medium | Luna | Sol | Terra | STANDARD |
| 44 | `russian-technical-editor` | Русская терминология и консистентность пользовательской документации | P2 | Luna | medium | Luna | Terra | Luna | LOW |

---

# 6. Индивидуальные модельные контракты

## 6.1. `data-researcher`

**Назначение:** Исследователь данных и первичных источников.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При конфликте источников, PIT-проблемах или недоказуемом provenance.  
**Silent downgrade:** запрещён.


## 6.2. `research-analyst`

**Назначение:** Синтез исследований и аналитических выводов.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При противоречивых исследованиях или влиянии на нормативное решение.  
**Silent downgrade:** запрещён.


## 6.3. `search-specialist`

**Назначение:** Точный поиск источников, API и документов.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Luna`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Terra`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Luna`.  
**Бюджетный класс:** `LOW`.  
**Условие эскалации:** При сложном provenance, нормативном источнике или конфликте результатов.  
**Silent downgrade:** запрещён.


## 6.4. `data-engineer`

**Назначение:** Архитектура ingestion, normalization и data pipelines.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При cross-provider/PIT, миграции или production-write path.  
**Silent downgrade:** запрещён.


## 6.5. `data-scientist`

**Назначение:** Статистическая обработка, признаки и экспериментальные модели.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При model-risk, out-of-sample или production influence.  
**Silent downgrade:** запрещён.


## 6.6. `quant-analyst`

**Назначение:** Количественные модели, стратегия и sensitivity analysis.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При спорном CRITICAL, сложном backtest или cross-model конфликте.  
**Silent downgrade:** запрещён.


## 6.7. `risk-manager`

**Назначение:** Независимая оценка инвестиционного и операционного риска.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При CRITICAL, reserve use, leverage или production influence.  
**Silent downgrade:** запрещён.


## 6.8. `architect-reviewer`

**Назначение:** Независимый архитектурный review и ownership boundaries.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При repository-wide конфликте или governance self-change.  
**Silent downgrade:** запрещён.


## 6.9. `qa-expert`

**Назначение:** Стратегия качества, acceptance и regression coverage.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При safety-critical gaps или конфликтующем evidence.  
**Silent downgrade:** запрещён.


## 6.10. `test-automator`

**Назначение:** Проектирование и реализация автоматизированных тестов.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При flaky/remote/production-adjacent tests.  
**Silent downgrade:** запрещён.


## 6.11. `documentation-engineer`

**Назначение:** Нормативная и техническая документация.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Luna`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Terra`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Luna`.  
**Бюджетный класс:** `LOW`.  
**Условие эскалации:** При RFC/ADR, конфликте source of truth или audit baseline.  
**Silent downgrade:** запрещён.


## 6.12. `git-workflow-manager`

**Назначение:** Ветки, worktree, PR и auditability Git-процесса.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При recovery, history risk или governance bypass.  
**Silent downgrade:** запрещён.


## 6.13. `pit-data-quality-reviewer`

**Назначение:** PIT-валидность, freshness, provenance и look-ahead control.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При недостаточном PIT evidence или конфликте providers.  
**Silent downgrade:** запрещён.


## 6.14. `russia-market-regime-economist`

**Назначение:** Экономическая интерпретация режимов российского рынка.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При структурном сдвиге, новых режимах или спорной калибровке.  
**Silent downgrade:** запрещён.


## 6.15. `russia-ofz-rates-specialist`

**Назначение:** ОФЗ, кривая ставок и денежно-кредитная среда РФ.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При аномалиях кривой, конфликте источников или режимном выводе.  
**Silent downgrade:** запрещён.


## 6.16. `ios-quant-backtest-auditor`

**Назначение:** Независимый аудит backtest, bias и robustness.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При CRITICAL bias, нестабильности или production proposal.  
**Silent downgrade:** запрещён.


## 6.17. `market-regime-model-risk-reviewer`

**Назначение:** Model-risk review Market Regime.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `extra_high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При новой формуле, весах, threshold или production gate.  
**Silent downgrade:** запрещён.


## 6.18. `historical-execution-simulator-reviewer`

**Назначение:** Проверка реалистичности исторического исполнения.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При ликвидности, slippage, execution lag или спорном fill model.  
**Silent downgrade:** запрещён.


## 6.19. `ios-agent-orchestrator`

**Назначение:** Детерминированная маршрутизация специализированных reviews.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При governance self-change, конфликте matrix или CRITICAL route.  
**Silent downgrade:** запрещён.


## 6.20. `ios-codebase-auditor`

**Назначение:** Repository-wide карта runtime, legacy и active paths.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При cross-module conflict или неполной runtime трассировке.  
**Silent downgrade:** запрещён.


## 6.21. `apps-script-specialist`

**Назначение:** Apps Script runtime, quotas, triggers, cache и JSON boundaries.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При remote write, cross-module execution или recovery risk.  
**Silent downgrade:** запрещён.


## 6.22. `google-sheets-systems-reviewer`

**Назначение:** Sheets schemas, formulas, UI и controlled writes.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При обходе AccountScope/Decision Engine или сложной формульной цепочке.  
**Silent downgrade:** запрещён.


## 6.23. `provider-integration-reviewer`

**Назначение:** Broker/MOEX/API contracts, retries, mapping и provenance.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При provider conflict, PIT или write semantics.  
**Silent downgrade:** запрещён.


## 6.24. `security-privacy-auditor`

**Назначение:** Secrets, privacy, permissions и historical exposure.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При CRITICAL exposure, supply-chain или historical leakage.  
**Silent downgrade:** запрещён.


## 6.25. `release-deployment-gatekeeper`

**Назначение:** Release, clasp, deployment inventory и production gates.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При remote drift, unknown state или deployment conflict.  
**Silent downgrade:** запрещён.


## 6.26. `recovery-idempotency-reviewer`

**Назначение:** UNKNOWN→STOP, checkpoints и duplicate-write prevention.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При disconnect, timeout или multi-system recovery.  
**Silent downgrade:** запрещён.


## 6.27. `audit-traceability-reviewer`

**Назначение:** Requirement→decision→code→tests→evidence traceability.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При конфликтующих sources of truth или orphan runtime.  
**Silent downgrade:** запрещён.


## 6.28. `agent-governance-auditor`

**Назначение:** Registry, Matrix, Resolver, manifests и anti-tamper.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При self-change, fake REAL_SUBAGENT или bypass.  
**Silent downgrade:** запрещён.


## 6.29. `production-influence-gate-reviewer`

**Назначение:** Research-to-production paths, R030 и executable influence.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `extra_high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При любом спорном влиянии на action/priority/quantity/TradePlan.  
**Silent downgrade:** запрещён.


## 6.30. `data-schema-migration-reviewer`

**Назначение:** Schemas, migrations, exact writes и reconciliation.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При destructive migration, rollback uncertainty или production data.  
**Silent downgrade:** запрещён.


## 6.31. `performance-quota-reviewer`

**Назначение:** Apps Script quotas, calls, latency и rebuild performance.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При timeout, quota exhaustion или production degradation.  
**Silent downgrade:** запрещён.


## 6.32. `portfolio-construction-reviewer`

**Назначение:** Allocation, concentration, exposure и rebalance methodology.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При изменении лимитов, allocation или consolidated logic.  
**Silent downgrade:** запрещён.


## 6.33. `reserve-cash-management-reviewer`

**Назначение:** Reserve target, deficit, restoration и money-market rules.  
**Критичность:** `P0`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При использовании резерва, изменении floor или Market Regime link.  
**Silent downgrade:** запрещён.


## 6.34. `fixed-income-bond-reviewer`

**Назначение:** Bond/coupon engine, YTM, duration, amortization и ladder.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При сложных структурах, кредитном риске или pricing conflict.  
**Silent downgrade:** запрещён.


## 6.35. `credit-risk-reviewer`

**Назначение:** Кредитное качество эмитента и default/concentration risk.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При subordinated/perpetual issue, missing ratings или concentration.  
**Silent downgrade:** запрещён.


## 6.36. `investment-universe-reviewer`

**Назначение:** Eligibility инструментов и отделение Directory от Universe.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При санкционных/инфраструктурных ограничениях или спорной eligibility.  
**Silent downgrade:** запрещён.


## 6.37. `liquidity-transaction-cost-reviewer`

**Назначение:** Liquidity, spread, slippage, lots и transaction costs.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При thin market, backtest sensitivity или executable TradePlan.  
**Silent downgrade:** запрещён.


## 6.38. `performance-attribution-reviewer`

**Назначение:** Benchmark и декомпозиция доходности портфеля.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При конфликте cash-flow accounting или strategy evaluation.  
**Silent downgrade:** запрещён.


## 6.39. `russia-investment-regulatory-tax-reviewer`

**Назначение:** Российское регулирование, налоги и инфраструктурные ограничения.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Sol`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Terra`.  
**Escalation:** `GPT-5.6 Sol Pro`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Sol`.  
**Бюджетный класс:** `HIGH`.  
**Условие эскалации:** При нормативном конфликте, изменении закона или production eligibility.  
**Silent downgrade:** запрещён.


## 6.40. `ui-ux-accessibility-reviewer`

**Назначение:** UX, accessibility и safety пользовательских операций.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При destructive UI, Account Control или недоступном rollback.  
**Silent downgrade:** запрещён.


## 6.41. `api-contract-documenter`

**Назначение:** Документация API, payload schemas и versioning.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Luna`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Terra`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Luna`.  
**Бюджетный класс:** `LOW`.  
**Условие эскалации:** При breaking API change или расхождении runtime/docs.  
**Silent downgrade:** запрещён.


## 6.42. `dependency-supply-chain-reviewer`

**Назначение:** Зависимости, лицензии, actions и supply-chain risk.  
**Критичность:** `P1`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `high`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При непроверенном dependency, workflow action или license conflict.  
**Silent downgrade:** запрещён.


## 6.43. `observability-diagnostics-reviewer`

**Назначение:** RunId, telemetry, masking и диагностический evidence.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Terra`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Sol`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Terra`.  
**Бюджетный класс:** `STANDARD`.  
**Условие эскалации:** При отсутствии audit trail или production incident.  
**Silent downgrade:** запрещён.


## 6.44. `russian-technical-editor`

**Назначение:** Русская терминология и консистентность пользовательской документации.  
**Критичность:** `P2`.  
**Primary:** `GPT-5.6 Luna`.  
**Reasoning:** `medium`.  
**Preflight:** `GPT-5.6 Luna`.  
**Escalation:** `GPT-5.6 Terra`.  
**Минимальная модель итогового verdict:** `GPT-5.6 Luna`.  
**Бюджетный класс:** `LOW`.  
**Условие эскалации:** При нормативном документе или смысловом конфликте перевода.  
**Silent downgrade:** запрещён.

# 7. Динамический model router

Router получает:

```yaml
agentId:
changeClass:
changedPaths:
riskLevel:
productionImpact:
deploymentImpact:
governanceSelfChange:
unknownWriteState:
findingSeverity:
contextSizeEstimate:
priorRunStatus:
ownerEscalation:
```

## 7.1. Luna

Допускается как primary или preflight только при отсутствии production/deployment impact, unknown write, governance self-change и требования критического verdict.

## 7.2. Terra

Default для большинства engineering, testing, data и documentation tasks.

## 7.3. Sol

Обязателен при security final verdict, unknown write, production influence, governance self-change, repository-wide architecture, model-risk approval, конфликтующем high-impact evidence или CRITICAL/BLOCKER validation.

## 7.4. Sol Pro

Разрешён только если Sol вернул unresolved CRITICAL либо `INSUFFICIENT_EVIDENCE`, а owner и budget gate дали явное approval.

---

# 8. Agent profile schema

```toml
agent_id = "<agent-id>"
profile_version = "1.0.0"
status = "PROVISIONAL"

[model_contract]
policy_version = "2.0"
primary_model = "gpt-5.6-terra"
primary_reasoning = "high"
preflight_model = "gpt-5.6-luna"
escalation_model = "gpt-5.6-sol"
final_verdict_minimum_model = "gpt-5.6-terra"
silent_downgrade_allowed = false
availability_evidence_required = true
cost_tracking_required = true
fixture_regression_required = true
```

---

# 9. Project-local portability

Рабочие профили хранятся в `.codex/agents/**`. На новом ноутбуке:

```bash
git clone <repository>
cd ios
git checkout integration/ios-current
npm ci
npm run agents:bootstrap
```

Bootstrap проверяет upstream hashes, overlays, model registry, генерирует профили, выполняет smoke tests и не выполняет production writes.

---

# 10. CI-гейты

```text
agent-upstream-integrity
agent-overlay-append-only
agent-generated-reproducibility
agent-model-registry-schema
agent-model-contract-consistency
agent-no-silent-downgrade
agent-model-availability-evidence
agent-fixture-regression
agent-cost-policy
agent-clean-machine-bootstrap
```

---

# 11. Cost controls

1. Luna выполняет дешёвую классификацию до дорогого review.
2. Агент получает только релевантные changed files.
3. Нормативные неизменяемые документы кэшируются.
4. Output contracts ограничивают повторение исходного текста.
5. Review reuse разрешён только при совпадении `headSha`, profile hash и model contract.
6. Sol Pro запрещён без отдельного approval.
7. Фактические token/credit usage записываются по Agent ID.
8. Ежемесячно формируется cost-quality report.
9. Экономия не может ослаблять safety gate.
10. Model downgrade никогда не заменяет обязательный review.

---

# 12. Model regression

Для каждого агента обязательны fixtures: `PASS`, `FAIL`, `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE` и `CRITICAL/BLOCKER`, где применимо.

При изменении модели сравниваются false negatives, false positives, полнота findings, корректность evidence, стоимость и latency.

---

# 13. Активация

Все агенты сначала получают `PROVISIONAL`. Переход в `ACTIVE` требует provenance PASS, immutable-base hash PASS, append-only overlay PASS, model smoke-test PASS, fixture regression PASS, registry/matrix/resolver PASS, execution evidence и owner approval.

---

# 14. Порядок внедрения

1. Полная очистка старого некорректного слоя.
2. Governance и аудит.
3. Runtime/platform.
4. Research/quant.
5. Инвестиционные специализированные роли.
6. Вспомогательные роли.

---

# 15. Итоговое распределение primary-моделей

- **GPT-5.6 Luna:** 4 агентов
- **GPT-5.6 Sol:** 17 агентов
- **GPT-5.6 Terra:** 23 агентов

Sol Pro не является primary ни для одного агента и остаётся только исключительной эскалацией.

---

# 16. Definition of Done

- [ ] Старый агентный слой удалён.
- [ ] Полный каталог содержит все целевые Agent ID.
- [ ] Каждый агент имеет purpose, priority и model contract.
- [ ] Upstream-база неизменяема.
- [ ] IOS overlays append-only.
- [ ] У каждого агента заданы primary/preflight/escalation и verdict floor.
- [ ] Silent downgrade запрещён.
- [ ] Sol Pro защищён owner и budget approval.
- [ ] Model registry версируется.
- [ ] Smoke tests и fixture regression пройдены.
- [ ] Cost tracking работает по Agent ID.
- [ ] Агенты доступны после clean clone.
- [ ] Bootstrap идемпотентен.
- [ ] CI воспроизводит profiles без diff.
- [ ] Simulation не считается real review.
- [ ] Production writes при интеграции равны нулю.
- [ ] Спецификация утверждена RFC/ADR.

---

# 17. Каноническое решение

Terra является основной экономически эффективной моделью IOS. Luna используется для дешёвых preflight и низкорисковых текстовых задач. Sol применяется там, где цена ошибки выше стоимости модели. Sol Pro не используется рутинно.


---

# 18. Главный управляющий агент — `ios-agent-orchestrator`

`ios-agent-orchestrator` является обязательным верхнеуровневым supervisor агентной платформы.

## 18.1. Назначение

Он не заменяет специализированных агентов. Его функция:

1. принять задачу разработки или аудита;
2. запустить read-only preflight;
3. классифицировать changed paths и change class;
4. вызвать deterministic Agent Resolver;
5. построить execution DAG;
6. определить последовательные и параллельные reviews;
7. проверить доступность обязательных моделей;
8. запустить требуемых субагентов;
9. собрать их отдельные результаты;
10. проверить наличие manifest/evidence;
11. остановить процесс при `CRITICAL`, `BLOCKER`, `UNKNOWN` или отсутствующем mandatory review;
12. передать Codex основной ветке consolidated findings;
13. никогда не выдавать предметный PASS вместо специализированного агента.

## 18.2. Запреты

Оркестратор не имеет права:

- изменять findings других агентов;
- скрывать CRITICAL/BLOCKER;
- заменять `REAL_SUBAGENT` симуляцией;
- считать `NOT_AVAILABLE` успешным review;
- выдавать production approval;
- выполнять `clasp push`, deployment update или production write;
- самостоятельно менять Review Matrix во время текущего запуска;
- утверждать собственные изменения.

## 18.3. Model contract

```toml
[model_contract]
primary_model = "gpt-5.6-terra"
primary_reasoning = "high"
preflight_model = "gpt-5.6-luna"
escalation_model = "gpt-5.6-sol"
final_verdict_minimum_model = "gpt-5.6-terra"
silent_downgrade_allowed = false
```

Sol обязателен при governance self-change, конфликте Resolver/Matrix, цикле execution DAG или маршруте с CRITICAL production impact.

---

# 19. Полный upstream и IOS overlays для каждого агента

## 19.1. Нормативное значение поля «полный upstream»

Для каждого IOS Agent ID фиксируется **полный набор upstream-профилей**, которые должны включаться в composition без сокращений.

В спецификации указывается:

- upstream repository;
- upstream profile ID;
- все дополнительные upstream profile IDs;
- обязательный IOS overlay.

При фактической интеграции importer обязан разрешить каждый profile ID в:

```yaml
repository:
exactCommitSha:
exactSourcePath:
rawSha256:
normalizedSha256:
license:
```

Путь, commit и hashes записываются в `upstream-lock.json`. Если профиль с указанным ID не найден, импорт блокируется; Codex не создаёт приблизительную замену.

## 19.2. Composition matrix

| № | IOS Agent ID | Полный upstream composition | Обязательные IOS-дополнения |
|---:|---|---|---|
| 1 | `data-researcher` | VoltAgent/awesome-codex-subagents: docs-researcher; wshobson/agents: search-specialist + research-oriented documentation workflow | Добавить приоритет первичных источников IOS, PIT/provenance/freshness, конфликт источников, DataConfidence, запрет выдавать research seed за production parameter. |
| 2 | `research-analyst` | VoltAgent/awesome-codex-subagents: research-analyst or docs-researcher; wshobson/agents: business-analyst + docs-architect | Добавить IOS decision-status taxonomy, разделение evidence/inference, влияние на RFC/ADR и uncertainty register. |
| 3 | `search-specialist` | VoltAgent/awesome-codex-subagents: search-specialist or docs-researcher; wshobson/agents: search-specialist | Добавить hierarchy официальных источников, запрет непроверенных API, точную фиксацию URL/date/version и source gaps. |
| 4 | `data-engineer` | VoltAgent/awesome-codex-subagents: data-engineer; wshobson/agents: data-engineer | Добавить Raw→Normalized→Derived architecture, AccountScope upstream guard, PIT timestamps, idempotency, cache, provider conflict и exact write-set. |
| 5 | `data-scientist` | VoltAgent/awesome-codex-subagents: data-scientist; wshobson/agents: data-scientist + ml-engineer | Добавить research-only status, challenger models, out-of-sample validation, missing-data policy, DataConfidence и запрет production influence без gate. |
| 6 | `quant-analyst` | VoltAgent/awesome-codex-subagents: quant-analyst; wshobson/agents: quant-analyst | Добавить IOS long-horizon constraints, transaction costs, PIT/survivorship/look-ahead controls, Reserve/AccountScope, versioned formulas и explicit production gate. |
| 7 | `risk-manager` | VoltAgent/awesome-codex-subagents: risk-manager; wshobson/agents: risk-manager | Добавить IOS risk guards, fail-closed, reserve ownership, production-influence risk, concentration/currency/liquidity и независимый verdict. |
| 8 | `architect-reviewer` | VoltAgent/awesome-codex-subagents: architect-reviewer or codebase-orchestrator; wshobson/agents: code-reviewer + database-architect where data architecture is affected | Добавить IOS layer ownership, anti-cycle rules, provider boundaries, Decision/Reserve ownership, runtime/spec conflict и governance self-change. |
| 9 | `qa-expert` | VoltAgent/awesome-codex-subagents: qa-expert; wshobson/agents: code-reviewer + test-automator | Добавить IOS acceptance matrix, production-write=0 checks, regression contours, evidence freshness and masked fixtures. |
| 10 | `test-automator` | VoltAgent/awesome-codex-subagents: test-automator; wshobson/agents: test-automator + tdd-orchestrator | Добавить Apps Script/Sheets fixtures, deterministic rebuild, R030, AccountScope, recovery, resolver and privacy tests. |
| 11 | `documentation-engineer` | VoltAgent/awesome-codex-subagents: documentation-engineer or docs-researcher; wshobson/agents: docs-architect | Добавить русскую нормативную документацию, source register, status taxonomy, RFC/ADR lifecycle и запрет смешивать documented-only с implemented. |
| 12 | `git-workflow-manager` | VoltAgent/awesome-codex-subagents: git-workflow-manager; wshobson/agents: deployment-engineer + devops-troubleshooter | Добавить canonical branch, worktree policy, fast-forward only, no force push, Connection Recovery Protocol и SHA evidence. |
| 13 | `pit-data-quality-reviewer` | VoltAgent/awesome-codex-subagents: data-scientist + data-engineer; wshobson/agents: data-scientist + data-engineer | Добавить специализированный IOS PIT contract: observed/effective/retrieved time, vintage availability, look-ahead, survivorship, provider conflict, fallback and DataConfidence. |
| 14 | `russia-market-regime-economist` | VoltAgent/awesome-codex-subagents: research-analyst + quant-analyst; wshobson/agents: quant-analyst + business-analyst | Добавить российский макро/рыночный контекст, OpportunityScore/StructuralRiskScore, four regimes + INSUFFICIENT_DATA, research-only thresholds and source provenance. |
| 15 | `russia-ofz-rates-specialist` | VoltAgent/awesome-codex-subagents: quant-analyst + data-researcher equivalent; wshobson/agents: quant-analyst + search-specialist | Добавить ОФЗ, кривая доходности, ключевая ставка, инфляция, auction/secondary-market distinctions, PIT and source hierarchy. |
| 16 | `ios-quant-backtest-auditor` | VoltAgent/awesome-codex-subagents: quant-analyst + data-scientist; wshobson/agents: quant-analyst + data-scientist | Добавить независимый audit-only режим, benchmark/challenger, costs, lag, sensitivity, OOS, failure modes и запрет реализации. |
| 17 | `market-regime-model-risk-reviewer` | VoltAgent/awesome-codex-subagents: model-risk-manager if available, otherwise risk-manager + quant-analyst; wshobson/agents: risk-manager + quant-analyst | Добавить governance модели Market Regime, assumptions, instability, thresholds, DataConfidence, monitoring, Preview/Applied separation and approval gates. |
| 18 | `historical-execution-simulator-reviewer` | VoltAgent/awesome-codex-subagents: quant-analyst + performance-engineer; wshobson/agents: quant-analyst + performance-engineer | Добавить торговый календарь, execution lag, lot rounding, spread/slippage, missing liquidity, fill rules and no hindsight. |
| 19 | `ios-agent-orchestrator` | VoltAgent/awesome-codex-subagents: agent-organizer + agent-installer; wshobson/agents: conductor-validator + available multi-agent orchestration workflow | Сделать верхнеуровневым supervisor: запуск Resolver, построение DAG, контроль порядка и параллельности, проверка обязательных reviews, остановка при BLOCKER/UNKNOWN, сбор manifest; запрет самостоятельно выдавать предметный PASS или production approval. |
| 20 | `ios-codebase-auditor` | VoltAgent/awesome-codex-subagents: codebase-orchestrator + code-mapper if available; wshobson/agents: code-reviewer + c4-code | Добавить repository-wide inventory, active/dead/legacy paths, symbol-level evidence, runtime/spec trace and no code changes. |
| 21 | `apps-script-specialist` | VoltAgent/awesome-codex-subagents: typescript-pro + backend-developer/tooling-engineer equivalent; wshobson/agents: code-reviewer + deployment-engineer | Добавить Apps Script quotas, SpreadsheetApp, CacheService, PropertiesService, LockService, triggers, JSON-safe wrappers, clasp round-trip and deployment separation. |
| 22 | `google-sheets-systems-reviewer` | VoltAgent/awesome-codex-subagents: data-analyst + qa-expert; wshobson/agents: business-analyst + test-automator | Добавить header-by-name, formula dependency, protected ranges, preview/apply/hash/revision, append-only audit, hidden IDs, AccountScope and no decision logic in UI. |
| 23 | `provider-integration-reviewer` | VoltAgent/awesome-codex-subagents: fintech-engineer + api-designer; wshobson/agents: data-engineer + deployment-engineer + api-documenter | Добавить broker/MOEX provider contracts, auth boundary, pagination, quotas, retries, unknown-write behavior, identifiers, PIT provenance and fallback. |
| 24 | `security-privacy-auditor` | VoltAgent/awesome-codex-subagents: security-auditor + compliance-auditor; wshobson/agents: security-auditor + code-reviewer | Добавить IOS secret taxonomy, Account/Script ID masking, current-tree vs historical privacy, Apps Script permissions, evidence sanitization, supply-chain and no self-approval. |
| 25 | `release-deployment-gatekeeper` | VoltAgent/awesome-codex-subagents: deployment-engineer + devops-engineer/platform-engineer; wshobson/agents: deployment-engineer + devops-troubleshooter | Добавить commit≠push≠PR≠merge≠clasp push≠deployment update≠data write, deployment inventory, rollback and owner gate. |
| 26 | `recovery-idempotency-reviewer` | VoltAgent/awesome-codex-subagents: incident-responder + chaos-engineer/error-coordinator equivalent; wshobson/agents: incident-responder + devops-troubleshooter | Добавить checkpoint, one-write rule, read-only verification, UNKNOWN→STOP, idempotency keys, duplicate prevention and resume point. |
| 27 | `audit-traceability-reviewer` | VoltAgent/awesome-codex-subagents: compliance-auditor + documentation-engineer; wshobson/agents: docs-architect + business-analyst | Добавить Requirement→Decision→RFC/ADR→Spec→Code→Tests→Evidence→Production chain, orphan and documented-only detection. |
| 28 | `agent-governance-auditor` | VoltAgent/awesome-codex-subagents: ai-governance-auditor + policy-guardrail-designer/eval-engineer if available; wshobson/agents: conductor-validator + code-reviewer | Добавить Registry/Matrix/Resolver/Manifest validation, execution-mode evidence, anti-tamper, anti-self-review, stale SHA and bypass. |
| 29 | `production-influence-gate-reviewer` | VoltAgent/awesome-codex-subagents: model-risk-manager + code-mapper/compliance-auditor; wshobson/agents: risk-manager + code-reviewer + quant-analyst | Добавить R030 path, PreviewMultiplier/AppliedMultiplier, action/score/priority/quantity/urgency/TradePlan/Reserve checks and CLOSED gate. |
| 30 | `data-schema-migration-reviewer` | VoltAgent/awesome-codex-subagents: data-engineer + database-administrator/database-optimizer; wshobson/agents: database-admin + database-optimizer + data-engineer | Добавить Sheets schemas, exact write-set, backups, RunId, reconciliation, idempotency and rollback registry. |
| 31 | `performance-quota-reviewer` | VoltAgent/awesome-codex-subagents: performance-engineer + performance-monitor; wshobson/agents: performance-engineer + observability-engineer | Добавить Apps Script quotas, Spreadsheet/API call counts, cache, full/quick/recalc budgets and timeout failure modes. |
| 32 | `portfolio-construction-reviewer` | VoltAgent/awesome-codex-subagents: quant-analyst + risk-manager; wshobson/agents: quant-analyst + risk-manager | Добавить long-horizon allocation, concentration/currency limits, AccountScope consolidated view, rebalance and portfolio health. |
| 33 | `reserve-cash-management-reviewer` | VoltAgent/awesome-codex-subagents: risk-manager + quant-analyst + fintech-engineer; wshobson/agents: risk-manager + quant-analyst | Добавить exclusive Reserve Engine ownership, target/minimum/current/deficit, restoration priority, eligible instruments, lot rounding and Market Regime prohibition. |
| 34 | `fixed-income-bond-reviewer` | VoltAgent/awesome-codex-subagents: quant-analyst + fintech-engineer; wshobson/agents: quant-analyst + data-scientist | Добавить nominal, coupon, ACI, maturity, amortization, YTM, duration, tax/currency attributes, coupon ladder and data confidence. |
| 35 | `credit-risk-reviewer` | VoltAgent/awesome-codex-subagents: risk-manager + research-analyst; wshobson/agents: risk-manager + business-analyst | Добавить issuer quality, rating provenance, subordinated/perpetual structures, default risk, concentration and missing-data downgrade. |
| 36 | `investment-universe-reviewer` | VoltAgent/awesome-codex-subagents: data-researcher/docs-researcher + risk-manager + fintech-engineer; wshobson/agents: search-specialist + risk-manager | Добавить Directory≠Universe, type/ID/liquidity/currency/data/strategy eligibility, AccountScope and infrastructure restrictions. |
| 37 | `liquidity-transaction-cost-reviewer` | VoltAgent/awesome-codex-subagents: quant-analyst + performance-engineer; wshobson/agents: quant-analyst + performance-engineer | Добавить spread, depth, turnover, slippage, lots, execution lag, thin-market handling and TradePlan executability. |
| 38 | `performance-attribution-reviewer` | VoltAgent/awesome-codex-subagents: quant-analyst + data-scientist; wshobson/agents: quant-analyst + data-scientist | Добавить benchmark, cash-flow neutral returns, allocation/selection effects, realized/unrealized decomposition and reconciliation. |
| 39 | `russia-investment-regulatory-tax-reviewer` | VoltAgent/awesome-codex-subagents: legal-advisor + compliance-auditor + research-analyst; wshobson/agents: legal-advisor + search-specialist | Добавить российские налоги, брокерскую/биржевую инфраструктуру, dated official sources, uncertainty, non-legal-advice boundary and ADR impact. |
| 40 | `ui-ux-accessibility-reviewer` | VoltAgent/awesome-codex-subagents: ui-ux-tester + accessibility-tester; wshobson/agents: code-reviewer + test-automator | Добавить русскоязычный Account Control UX, preview/apply/rollback, destructive-action guards, masked IDs and accessible diagnostics. |
| 41 | `api-contract-documenter` | VoltAgent/awesome-codex-subagents: api-documenter or docs-researcher; wshobson/agents: api-documenter + reference-builder | Добавить provider version, auth/read-write classification, pagination, errors, freshness/provenance fields and runtime-doc parity. |
| 42 | `dependency-supply-chain-reviewer` | VoltAgent/awesome-codex-subagents: dependency-manager + license-engineer + security-auditor; wshobson/agents: security-auditor + deployment-engineer | Добавить pinned commits, GitHub Actions provenance, upstream agent hashes/licenses, Apps Script libraries and no floating dependencies. |
| 43 | `observability-diagnostics-reviewer` | VoltAgent/awesome-codex-subagents: ai-observability-engineer/performance-monitor; wshobson/agents: observability-engineer + incident-responder | Добавить RunId, branch/base/head, masked target, before/after, writes, rollback, unresolved status and append-only evidence. |
| 44 | `russian-technical-editor` | VoltAgent/awesome-codex-subagents: documentation-engineer; wshobson/agents: docs-architect + reference-builder | Добавить русскую терминологию IOS, внутренние identifiers без перевода, status consistency and no semantic rewriting of upstream. |

---

# 20. Автоматический запуск агентов Codex

## 20.1. Нормативное требование

Codex должен автоматически инициировать agent workflow по мере разработки проекта, когда задача или изменённые пути соответствуют Review Matrix.

Автоматический запуск строится не на предположении, что `.toml` запускается сам, а на обязательной цепочке:

```text
Codex task start
→ AGENTS.md delegation rule
→ agent preflight
→ Resolver
→ ios-agent-orchestrator
→ required subagents
→ manifests/reports
→ CI validator
→ continue or STOP
```

## 20.2. Root `AGENTS.md`

В корневом `AGENTS.md` закрепляется:

```text
Перед изменением кода, спецификации, workflow, Apps Script, Sheets,
инвестиционной логики или governance:

1. запусти `npm run agents:resolve -- --base <sha> --head <sha>`;
2. передай результат `ios-agent-orchestrator`;
3. делегируй mandatory agents в режиме REAL_SUBAGENT, если они доступны;
4. дождись отдельных reports;
5. не начинай write-часть, пока pre-change mandatory reviews не завершены;
6. после изменений повторно запусти Resolver для post-change review;
7. при BLOCKER/CRITICAL/UNKNOWN/NOT_AVAILABLE остановись;
8. не подменяй отсутствующего агента role simulation;
9. запиши branch/base/head/model/profile hashes в manifest.
```

## 20.3. Автоматические триггеры

| Триггер | Действие |
|---|---|
| Начало значимой Codex-задачи | preflight + Resolver + orchestrator |
| Изменение tracked files | пересчёт required agents |
| Перед первым write | pre-change safety gate |
| После изменения scope | incremental re-resolution |
| Перед commit | local mandatory reviews |
| Перед push/PR | governance, security, recovery, release checks по matrix |
| PR opened/updated | CI validates manifests and SHA freshness |
| Governance paths changed | anti-tamper route |
| Market Regime/R030/Decision/TradePlan changed | production influence route |
| Timeout/disconnect после write | recovery route, no retry |
| Upstream agent/model changed | full agent regression route |

## 20.4. Resolver output

```json
{
  "branch": "",
  "baseSha": "",
  "headSha": "",
  "changeClass": [],
  "requiredAgents": [],
  "advisoryAgents": [],
  "executionDag": [],
  "parallelGroups": [],
  "blockedByUnavailableAgents": [],
  "productionImpact": "NONE",
  "deploymentImpact": "NONE"
}
```

## 20.5. Automatic delegation policy

Codex имеет право автоматически запускать read-only agents.

Write-capable implementation agents запускаются только в рамках основной задачи и разрешений sandbox. Специализированные reviewer agents первого этапа по умолчанию read-only.

Автоматический запуск не означает:

- автоматический merge;
- автоматический deployment;
- автоматический production write;
- автоматическое owner approval;
- разрешение обходить пользовательские approvals.

## 20.6. Двухфазный workflow

### PRE_CHANGE

- определить scope;
- выявить safety requirements;
- назначить implementing/review agents;
- зафиксировать baseline.

### POST_CHANGE

- пересчитать changed paths;
- запустить обязательные независимые reviews;
- проверить tests/evidence;
- сформировать merge recommendation.

## 20.7. Fail-closed

```text
mandatory agent unavailable
→ NOT_AVAILABLE
→ no substitute
→ merge gate incomplete
```

```text
orchestrator/Resolver conflict
→ UNKNOWN
→ STOP
```

```text
stale head SHA
→ reports invalid
→ rerun required
```

---

# 21. Автоматизация и переносимость

Добавляются команды:

```json
{
  "scripts": {
    "agents:bootstrap": "node tools/agents/bootstrap.mjs",
    "agents:resolve": "node tools/agents/resolve.mjs",
    "agents:orchestrate": "node tools/agents/orchestrate.mjs",
    "agents:preflight": "node tools/agents/preflight.mjs",
    "agents:postflight": "node tools/agents/postflight.mjs",
    "agents:check": "node tools/agents/check.mjs"
  }
}
```

`agents:bootstrap` обеспечивает наличие project-local профилей на новом ноутбуке.  
`agents:resolve` вычисляет обязательные роли.  
`agents:orchestrate` формирует delegation plan для Codex и проверяет результаты.  
CI повторно проверяет всё независимо.

---

# 22. Дополнительные acceptance criteria

- [ ] `ios-agent-orchestrator` зарегистрирован как обязательный supervisor.
- [ ] Оркестратор не считается предметным reviewer.
- [ ] Для каждого агента указан полный upstream composition.
- [ ] Для каждого агента указан отдельный IOS overlay.
- [ ] Exact path/commit/hash фиксируется importer-ом.
- [ ] Не найденный upstream ID блокирует генерацию.
- [ ] Codex автоматически выполняет Resolver перед значимыми изменениями.
- [ ] Codex делегирует mandatory reviews согласно `AGENTS.md`.
- [ ] Pre-change и post-change phases разделены.
- [ ] Automatic delegation не даёт production approval.
- [ ] Mandatory `NOT_AVAILABLE` блокирует gate.
- [ ] CI проверяет SHA freshness, execution mode и reports.
