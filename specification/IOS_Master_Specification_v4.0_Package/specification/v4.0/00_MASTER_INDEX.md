# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Master Index

Этот пакет является модульной редакцией IOS Master Specification v4.0.

## Порядок чтения

1. `01_EXECUTIVE_AUDIT_BASELINE.md`
2. `02_SYSTEM_CONSTITUTION.md`
3. `03_ARCHITECTURE.md`
4. `04_DATA_ARCHITECTURE.md`
5. `05_PROJECT_HISTORY.md`
6. `06_TRACEABILITY_MODEL.md`
7. `07_ACCOUNT_SCOPE.md`
8. `08_GOOGLE_SHEETS_ARCHITECTURE.md`
9. `09_APPS_SCRIPT_ARCHITECTURE.md`
10. `10_PROVIDER_ARCHITECTURE.md`
11. `11_DATA_CONFIDENCE.md`
12. `12_PORTFOLIO_AND_RESERVE.md`
13. `13_BOND_AND_COUPON_ENGINE.md`
14. `14_COMPANY_RATING.md`
15. `15_INVESTMENT_STRATEGY.md`
16. `16_MARKET_REGIME.md`
17. `17_DECISION_ENGINE_AND_R030.md`
18. `18_TRADE_PLAN.md`
19. `19_PRODUCTION_INFLUENCE_GATES.md`
20. `20_AGENT_GOVERNANCE.md`
21. `21_DEVELOPMENT_PLATFORM.md`
22. `22_GIT_BRANCH_WORKTREE_POLICY.md`
23. `23_CONNECTION_RECOVERY_PROTOCOL.md`
24. `24_SECURITY_PRIVACY.md`
25. `25_TESTING_VALIDATION.md`
26. `26_RFC_ADR_GOVERNANCE.md`
27. `27_ROADMAP.md`
28. `28_ROLLBACK_AND_RECOVERY.md`
29. `29_AUDIT_FINDINGS_AND_GAPS.md`

## Основные нормативные инварианты

- `AppliedMultiplier = 1.00` до отдельного approval.
- `ProductionInfluenceGate = CLOSED`.
- `integration/ios-current` — canonical branch.
- Изменения canonical branch выполняются через PR.
- После неизвестного внешнего write запрещён автоматический retry.
- Real subagent, role simulation и CI validation — разные режимы.
- Research-параметры не являются production-параметрами.
