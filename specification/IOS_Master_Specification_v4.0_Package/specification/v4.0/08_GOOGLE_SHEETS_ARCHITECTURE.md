# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Google Sheets Architecture

Google Sheets — presentation и controlled-configuration layer.

Требования:

- headers определяются по именам;
- технические ID скрываются;
- audit trail append-only;
- preview предшествует apply;
- apply защищён revision/hash;
- rollback имеет управляемую семантику;
- даты сериализуются ISO-8601;
- formulas не обходят AccountScope, DataConfidence или Decision Engine.

Каждый production write фиксирует exact write set, RunId, before/after, reason, previewHash, revision и rollback state.
