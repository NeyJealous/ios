# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Audit Findings and Gaps

| ID | Finding | Status | Next action |
|---|---|---|---|
| GAP-001 | Legacy multiplier/R030 influence requires canonical verification | OPEN_HIGH | Code audit |
| GAP-002 | Market Regime v3.1 artifact absent | OPEN | Record provenance gap |
| GAP-003 | Research weights may be confused with production | CONTROLLED | Keep RESEARCH_SEED |
| GAP-004 | Agent profile may be confused with real execution | CONTROLLED | Require manifest evidence |
| GAP-005 | Old branches may lack governance | OPEN | Branch coverage inventory |
| GAP-006 | Model availability may change | OPEN | Official verification and smoke test |
| GAP-007 | Historical privacy risk | DOCUMENTED_RISK | Separate from current tree |
| GAP-008 | v3.0 and runtime differ | OPEN | Full traceability audit |
