# Agent Governance

Этот каталог описывает repository-wide agent governance IOS.

- `AGENT-SPECIFICATION-AUDIT.md` — что действительно требует спецификация.
- `CODEX-AGENT-CAPABILITY-AUDIT.md` — что официально поддерживает Codex.
- `AGENT-ORCHESTRATION-POLICY.md` — обязательный task lifecycle.
- `AGENT-REVIEW-CONTRACT.md` — единый формат evidence.
- `EXISTING-BRANCH-ADOPTION-PLAN.md` — наследование и старые ветки.
- `AGENT-GOVERNANCE-ROLLBACK.md` — безопасный rollback.
- `UPSTREAM-AGENT-ADAPTATION.md` — provenance и IOS-адаптация VoltAgent.

Машиночитаемые источники находятся в `architecture/agents/`; resolver и
validator — в `tools/`. Механизм становится глобальным для новых веток только
после merge governance-файлов в `integration/ios-current`.
