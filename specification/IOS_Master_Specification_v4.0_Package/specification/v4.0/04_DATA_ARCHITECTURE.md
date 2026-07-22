# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Data Architecture

## Классы данных

- Raw
- Normalized
- Derived
- Decision
- Presentation
- Audit

## Обязательные атрибуты критических данных

- source
- observedAt
- effectiveAt
- retrievedAt
- freshness
- quality status
- confidence
- fallback status
- point-in-time validity

## Fail-closed

При missing, stale или conflicting data система не увеличивает риск, quantity, priority или multiplier.
