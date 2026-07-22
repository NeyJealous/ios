# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Production Influence Gates

До отдельного approval:

```text
AppliedMultiplier = 1.00
ProductionInfluenceGate = CLOSED
MarketRegimeProductionInfluence = NOT_APPROVED
ReserveUseByMarketRegime = NOT_APPROVED
```

Уровни:

- CLOSED
- PREVIEW_ONLY
- SHADOW
- LIMITED_APPROVAL
- OPEN

Переход требует ADR, tests, risk review, rollback и owner approval.
