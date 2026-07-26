# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Traceability Model

Для каждого требования строится цепочка:

```text
Requirement
→ Source Decision
→ RFC/ADR
→ Specification Section
→ Implementation Files
→ Tests
→ Audit Evidence
→ Production Status
```

Минимальные поля:

- requirementId
- title
- decisionStatus
- implementationStatus
- productionStatus
- sourceDocuments
- sourceCommits
- implementationFiles
- tests
- evidence
- risks
- owner
- nextGate
