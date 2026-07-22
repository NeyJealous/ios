# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Rollback and Recovery

## Git rollback

- revert merge commit;
- новый PR;
- без force push;
- без history rewrite.

## Data rollback

- pre-change backup;
- exact write set;
- RunId;
- rollback registry;
- idempotency;
- reconciliation.

## Governance rollback

- revert governance merge;
- required check изменяется отдельно;
- reports сохраняются как audit history.
