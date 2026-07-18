# SECURITY_REVIEWER — GLOBAL-AGENT-GOVERNANCE

- ExecutionMode: `CODEX_ROLE_SIMULATION`
- CommitSHA: `8db70b095d7480530402c5578d395a156b377110`
- Status: `PASS_WITH_WARNINGS`
- Severity: `MEDIUM`

Permissions fail closed, workflow read-only/fork-safe, production credentials
отсутствуют, privacy scan PASS. Роль остаётся `PARTIAL`, поскольку exact
canonical role name отсутствует. Owner bypass ограничен approval requirement и
не разрешает обход других protections или production/deployment gates.
