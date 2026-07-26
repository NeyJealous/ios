# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Agent Governance

## Компоненты

- Root `AGENTS.md`
- directory-scoped instructions
- Agent Registry
- Review Matrix
- Resolver
- Manifest
- Review Reports
- CI Validator
- Anti-Tamper Policy
- Owner Approval Contract

## Execution modes

```text
REAL_SUBAGENT
CODEX_ROLE_SIMULATION
CI_VALIDATOR
MANUAL_REVIEW
NOT_AVAILABLE
```

`.toml`-профиль не доказывает real execution.

Simulation не считается независимым review.

Governance self-change требует усиленного контроля.
