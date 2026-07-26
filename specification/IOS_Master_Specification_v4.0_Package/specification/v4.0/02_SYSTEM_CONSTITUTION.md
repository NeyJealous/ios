# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# System Constitution

## Нормативные принципы

1. Горизонт стратегии — 10+ лет.
2. Решения объяснимы и воспроизводимы.
3. Недостаток данных ведёт к `INSUFFICIENT_DATA`.
4. Decision Engine — единственный владелец итогового action.
5. Reserve Engine — единственный владелец reserve logic.
6. AccountScope обязателен до расчётов и рекомендаций.
7. Market Regime не создаёт сделки.
8. UI не является владельцем инвестиционной логики.
9. Research не получает production-влияние без gate.
10. Любой неизвестный внешний write приводит к STOP до read-only verification.

## Статусы решений

`ACCEPTED`, `PROVISIONAL`, `RESEARCH_SEED`, `EXPERIMENTAL`, `NOT_APPROVED`, `SUPERSEDED`, `REJECTED`, `UNRESOLVED`.

## Статусы реализации

`IMPLEMENTED_AND_VERIFIED`, `IMPLEMENTED_NOT_VERIFIED`, `PARTIALLY_IMPLEMENTED`, `DOCUMENTED_ONLY`, `RESEARCH_ONLY`, `SUPERSEDED`, `CONFLICTING`, `MISSING`, `UNKNOWN`.
