# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Connection Recovery Protocol

Статусная модель:

```text
NOT_STARTED
→ LOCAL_ONLY
→ PUSH_COMPLETED
→ PR_CREATED
→ MERGED
→ REMOTE_APPLY_COMPLETED
```

При недостаточном evidence:

```text
UNKNOWN → STOP
```

Применяется к Git push, PR, merge, clasp push, deployment, Sheets writes, API writes и IcePanel import.

После disconnect запрещён автоматический retry. Сначала выполняется read-only verification.
