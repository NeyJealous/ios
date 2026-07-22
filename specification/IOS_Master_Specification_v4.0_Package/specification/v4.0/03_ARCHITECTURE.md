# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# System Architecture

```text
External Providers
    ↓
Raw Data
    ↓
Directory
    ↓
Investment Universe
    ↓
Normalized Facts
    ↓
Features
    ↓
Ratings / Market Regime / Portfolio State
    ↓
Decision Engine
    ↓
Recommendation Builder
    ↓
TradePlan
    ↓
Google Sheets UI
```

Сквозные слои:

- AccountScope
- DataConfidence
- Freshness
- Audit Trail
- Privacy
- Recovery
- Agent Governance
- Testing

Запрещены циклические ownership-зависимости и обход Decision Engine.
