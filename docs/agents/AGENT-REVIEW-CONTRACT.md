# Agent Review Contract

Каждый review создаёт:

- `audit/agents/<GATE>/<AGENT_ID>.json`;
- `docs/reviews/<GATE>/<AGENT_ID>.md`.

Обязательные поля: AgentId, AgentVersion, GateId, Branch, CommitSHA,
ReviewScope, FilesReviewed, SpecificationReferences, ChecksPerformed,
Findings, Severity, Evidence, RequiredFixes, ResidualRisk, Status, Timestamp и
ExecutionMode. JSON schema: `architecture/agents/review-contract.schema.json`.

ExecutionMode: `REAL_SUBAGENT`, `CODEX_ROLE_SIMULATION`, `CI_VALIDATOR`,
`MANUAL_REVIEW`, `NOT_AVAILABLE`. Для `REAL_SUBAGENT` нужен
`AgentThreadId=<id>` в evidence. Симуляция не является независимым review.

Status: `PASS`, `PASS_WITH_WARNINGS`, `BLOCKED`, `FAIL`, `NOT_APPLICABLE`,
`NOT_EXECUTED`. Severity: `INFO`, `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`,
`BLOCKER`.

- CRITICAL/BLOCKER блокируют PR.
- Обязательный NOT_EXECUTED блокирует PR.
- NOT_APPLICABLE требует конкретного evidence и residual-risk justification.
- PASS без проверяемого evidence недействителен.

Manifest `audit/agents/<GATE>/manifest.json` содержит GateId, TaskType, Branch,
BaseSHA, HeadSHA, ChangedPaths, ApplicableAgents, RequiredAgents,
ExecutedAgents, MissingAgents, BlockingFindings, Warnings, ArchitectureImpact,
SecurityImpact, ProductionImpact и OverallStatus (`PASS`, `BLOCKED`, `FAIL`,
`INCOMPLETE`).

## Reviewed SHA и attestation tail

Самоссылающийся commit невозможен: файл внутри commit не может надёжно хранить
SHA этого же commit. Поэтому reports могут находиться в последующем attestation
commit. Manifest `HeadSHA` указывает последний reviewed implementation commit;
CI разрешает хвост только из `audit/agents/**` и `docs/reviews/**`. Любой другой
файл после reviewed SHA делает evidence stale и блокирует PR.
