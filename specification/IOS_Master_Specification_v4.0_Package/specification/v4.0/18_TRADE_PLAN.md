# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Recommendation Builder and TradePlan

Recommendation Builder формирует объяснение решения.

TradePlan хранит планируемые действия, но не является decision owner.

Обязательные свойства:

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

Research branch не изменяет production TradePlan.
