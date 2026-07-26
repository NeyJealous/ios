# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Testing and Validation

## Уровни

- unit;
- integration;
- regression;
- fixture;
- schema;
- privacy;
- deterministic rebuild;
- round-trip;
- read-only remote validation;
- shadow;
- backtest;
- PIT validation;
- model-risk review.

## Обязательные regression-контуры

Sync, AccountScope, Portfolio, Reserve, Decision Engine, R030, Recommendation Builder, TradePlan, audit/history, recovery и governance.
