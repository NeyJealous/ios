# Investment Operating System (IOS)
## Master Specification v4.0 — Audit Baseline

**Дата:** 18 июля 2026 года  
**Статус:** Audit Baseline  
**Предшествующая версия:** v3.0 от 6 июля 2026 года  
**Каноническая ветка:** `integration/ios-current`

---

# Git Branch and Worktree Policy

Canonical branch:

```text
integration/ios-current
```

Правила:

- изменения через PR;
- force push запрещён;
- history rewrite запрещён;
- task/research — в отдельных worktree;
- canonical синхронизируется fetch + fast-forward only;
- `reset --hard` не используется штатно;
- clean status обязателен;
- divergence или незавершённый merge/rebase/cherry-pick → STOP.

Старые ветки не наследуют governance автоматически.
