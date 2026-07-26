# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Apps Script Architecture

Apps Script реализует:

- sync;
- normalization;
- calculations;
- UI wrappers;
- diagnostics;
- AccountScope;
- Decision Engine;
- Rule Engine;
- TradePlan;
- audit trail.

Ограничения:

- `clasp push --force` запрещён;
- source push не равен deployment update;
- round-trip compare обязателен;
- `.clasp.json` не отслеживается;
- Script ID не публикуется;
- timeout не доказывает неуспех write.
