# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Decision Engine and R030

Decision Engine — единственный владелец action.

## Входы

Strategy, AccountScope, Portfolio, Reserve, Rating, Bond Engine, Market Regime context, DataConfidence, Limits и Risk Guards.

## R030

Нормативный контракт:

- R030 не создаёт BUY;
- не меняет quantity;
- не меняет urgency;
- не повышает priority до approval;
- читает только AppliedMultiplier;
- invalid/stale/unknown input → `1.00`.

Legacy active influence классифицируется как высокий риск до подтверждения remediation.
