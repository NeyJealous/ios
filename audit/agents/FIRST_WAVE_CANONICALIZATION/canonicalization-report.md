# First-wave canonicalization report

Status: `FIRST_WAVE_IMPLEMENTED_AND_CONFIGURED_IN_CANONICAL`.

The owner authorized canonicalization of exactly five tracked first-wave profiles:

- `ios-agent-orchestrator`
- `agent-governance-auditor`
- `security-privacy-auditor`
- `audit-traceability-reviewer`
- `ios-codebase-auditor`

Each profile remains `CONFIGURED_NOT_RUNTIME_VERIFIED`. The five TOML files are
present in `.codex/agents/` and byte-identical to their validated staging
profiles. This filesystem fact is not runtime-discovery evidence.

The current client returned `unknown agent_type 'ios-agent-orchestrator'`.
The bounded conclusion is
`PROJECT_LOCAL_AGENT_DISCOVERY_FAILED_IN_CURRENT_CLIENT_ENVIRONMENT`.
The root cause remains `ROOT_CAUSE_NOT_YET_ESTABLISHED`; further diagnosis and
runtime smoke are deferred to a clean machine.

Exact upstream repositories, commits, source paths, profile IDs, raw and
normalized hashes are locked in
`architecture/agents/registry/upstream-selection-register.yaml` and
`architecture/agents/registry/upstream-lock.json`. The configuration review
records 21/21 byte-identical upstream inclusions with zero mutation, deletion,
replacement or semantic rewrite.

Capability contracts are locally validated but remain
`RUNTIME_ENFORCEMENT_UNVERIFIED`. Model contracts retain the prior exact runtime
smoke evidence; no model or custom-agent runtime request was made in this
canonicalization task.

Production impact is `NONE`. Production, Sheets, Apps Script, broker/API,
deployment and `clasp push` writes are all zero.
