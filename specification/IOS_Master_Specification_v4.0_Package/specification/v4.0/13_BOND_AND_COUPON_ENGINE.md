# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Bond and Coupon Engine

Bond Engine отвечает за:

- nominal;
- coupon;
- accrued interest;
- maturity;
- amortization;
- yield;
- duration;
- credit quality;
- liquidity.

Coupon Ladder распределяет денежные потоки по месяцам.

Покупка проходит через Decision Engine, AccountScope и Risk Guards.
