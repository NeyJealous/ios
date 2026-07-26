# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Portfolio and Reserve

## Portfolio Engine

Отвечает за positions, cash, valuation, allocation, concentration, currency exposure и reconciliation.

Consolidated view использует только `Calculation_Enabled = true`.

## Reserve Engine

Единственный владелец reserve logic:

- target reserve;
- minimum reserve;
- current reserve;
- deficit;
- restoration priority;
- eligible instruments;
- lot rounding.

`ReserveUseByMarketRegime = NOT_APPROVED`.
