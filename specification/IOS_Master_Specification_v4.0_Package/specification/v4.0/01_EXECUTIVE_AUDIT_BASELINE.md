# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Executive Audit Baseline

IOS — долгосрочная инвестиционная операционная система для консолидации счетов, анализа портфеля, формирования рекомендаций и управления TradePlan.

После v3.0 приняты крупные изменения:

- единый AccountScope с пятью независимыми флагами;
- Account Control UX;
- canonical branch и PR-only governance;
- GitHub ruleset;
- Connection Recovery Protocol;
- repository-wide Agent Governance;
- разделение REAL_SUBAGENT / simulation / CI validator;
- новая research-архитектура Market Regime v3.2;
- fail-closed контракт для R030 и AppliedMultiplier.

v4.0 служит baseline для полного аудита и не считает реализованным то, что существует только как research, task file, unmerged branch или simulation.
