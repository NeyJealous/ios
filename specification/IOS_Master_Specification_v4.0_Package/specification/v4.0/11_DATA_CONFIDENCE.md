# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# DataConfidence Specification

DataConfidence учитывает:

- completeness;
- freshness;
- provenance;
- point-in-time validity;
- provider conflicts;
- fallback usage;
- factor coverage.

Низкая confidence приводит к:

- `INSUFFICIENT_DATA`;
- нейтральному безопасному downstream result;
- блокировке multiplier;
- запрету повышения priority и quantity.
