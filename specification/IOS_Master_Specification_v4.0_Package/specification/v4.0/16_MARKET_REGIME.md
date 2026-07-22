# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Market Regime v3.2

## Назначение

Market Regime классифицирует рыночную среду и передаёт диагностический контекст в Decision Engine.

## Факторная модель

```text
OpportunityScore
StructuralRiskScore
```

`CapacityScore` относится к downstream capacity logic.

## Обязательный статус

```text
INSUFFICIENT_DATA
```

## Drawdown ladder

```text
1.0 / 1.5 / 2.0 / 3.0 / 4.0
```

Это ceiling-кандидат, а не команда покупки.

- `PriceDrawdown` — основной research candidate;
- Total Return — challenger;
- окно drawdown калибруется;
- веса — `RESEARCH_SEED`;
- формулы A/B/C сравниваются;
- production-влияние запрещено без PIT validation, backtest, model-risk review и approval.

## Provenance gap

Полная canonical v3.1 не подтверждена. Реконструировать её по памяти запрещено.
