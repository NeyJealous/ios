# Agent Review Contract

## Development use

Agent reviews are local, read-only quality controls for the owner-operated IOS
project. They are executed when requested by the task, selected by the owner,
or useful for a high-risk change. Independent GitHub approval and external
trusted attestation are not mandatory for ordinary personal development.

## Evidence format

When a versioned review package is required, use:

- `audit/agents/<GATE>/<AGENT_ID>.json`;
- `docs/reviews/<GATE>/<AGENT_ID>.md`;
- optional `audit/agents/<GATE>/manifest.json`.

The JSON contract retains:

`AgentId`, `AgentVersion`, `GateId`, `Branch`, `CommitSHA`, `ReviewScope`,
`FilesReviewed`, `SpecificationReferences`, `ChecksPerformed`, `Findings`,
`Severity`, `Evidence`, `RequiredFixes`, `ResidualRisk`, `Status`,
`Timestamp`, and `ExecutionMode`.

Execution modes remain `REAL_SUBAGENT`, `CODEX_ROLE_SIMULATION`,
`CI_VALIDATOR`, `MANUAL_REVIEW`, and `NOT_AVAILABLE`. Simulation must never be
reported as independent execution.

## Results

Review status values remain `PASS`, `PASS_WITH_WARNINGS`, `BLOCKED`, `FAIL`,
`NOT_APPLICABLE`, and `NOT_EXECUTED`. Severity values remain `INFO`, `LOW`,
`MEDIUM`, `HIGH`, `CRITICAL`, and `BLOCKER`.

No review may fabricate execution, evidence, identity, model resolution or
filesystem integrity. A recorded `CRITICAL` or `BLOCKER` must be presented to
the owner, but historical findings do not automatically block use of an agent
that the owner has separately accepted as `READY`.

## Production boundary

This development contract does not authorize deployment, production writes,
secret access, repository visibility changes or bypass of a future
production-hardening gate. Independent approvals and trusted attestations may
become mandatory in that separate phase.
