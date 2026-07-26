# Agent Governance Auditor — provisional validation

Status: `PROVISIONAL_VALIDATION_PASS_WITH_WARNINGS`

Static contract and all seven fixtures passed. Tests covered Registry/Matrix
drift, unknown-path weakening, mandatory NOT_AVAILABLE plus PASS, immutable
snapshot and overlay violations, stale hashes, fake REAL_SUBAGENT, spoofed owner
approval, validator self-weakening, self-review and silent downgrade.

Requested model: `gpt-5.6-sol`, reasoning `high`. Actual isolated runtime
invocation: `RUNTIME_VALIDATION_NOT_AVAILABLE`; resolved model, latency and
thread ID are null. Runtime discovery remained false and
`activationEligible=false`.
