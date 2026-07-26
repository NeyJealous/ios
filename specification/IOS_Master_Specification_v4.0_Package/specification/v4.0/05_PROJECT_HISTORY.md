# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Project History After 6 July 2026

## PH-0100 — AccountScope
Единый сервис и пять независимых флагов.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0101 — Controlled account exclusion
Purge исключённого счёта: 178 строк; idempotent rebuild; reconciliation delta 0.00 RUB.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0102 — Account Control UX
Preview/apply/rollback/audit/history/validation.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0103 — Canonical integration branch
`integration/ios-current`.  
Статус: `ACCEPTED`.

## PH-0104 — GitHub protection ruleset
Canonical branch изменяется через PR.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0105 — Russian documentation policy
Пользовательская документация ведётся на русском языке.  
Статус: `ACCEPTED`.

## PH-0106 — Connection Recovery Protocol
Unknown write → read-only verification → STOP при UNKNOWN.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0107 — Global Agent Governance
Repository instructions, registry, matrix, resolver, manifest, CI.  
Статус: `IMPLEMENTED_AND_VERIFIED`.

## PH-0108 — Solo maintainer bypass
Документированный PR-scoped bypass без ослабления CI.  
Статус: `ACCEPTED`.

## PH-0109 — Market Regime v3.2
Новая research-архитектура.  
Статус: `RESEARCH_ONLY`.

## PH-0110 — R030 neutralization
`AppliedMultiplier = 1.00` до approval.  
Статус: нормативно `ACCEPTED`; реализация требует canonical audit.
