# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Provider Architecture

Provider layer отвечает только за получение данных.

Provider не:

- определяет action;
- выбирает Investment Universe;
- обходит normalization;
- заменяет DataConfidence;
- управляет Reserve;
- формирует TradePlan.

Каждый provider должен иметь provenance, timestamps, freshness, retry policy и fallback classification.
