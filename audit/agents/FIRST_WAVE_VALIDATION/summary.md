# First-wave provisional agent validation

Status: `FIRST_WAVE_PROVISIONAL_VALIDATION_COMPLETE`

Validated implementation SHA: `0ce3b2844c5b8cf998b6814ee7a9cfcb4d797c44`.

All five static profile contracts passed. The 35 deterministic fixtures
produced 34 PASS and one explicit Windows symlink SKIP, with zero failures.
The complete governance suite produced 116 tests: 114 PASS, 0 FAIL and two
platform-specific symlink SKIP results.

No profile was copied to `.codex/agents/`. Runtime discovery remained zero.
An actual profile-bound Codex invocation was not performed because the current
environment exposes no trusted isolated invoker that can bind the staged
profile without activation. Each runtime result is therefore
`RUNTIME_VALIDATION_NOT_AVAILABLE`, with `resolvedModel`, latency and execution
thread ID left null. No role simulation is counted as runtime evidence.

Each agent is `PROVISIONAL_VALIDATION_PASS_WITH_WARNINGS`. This result does not
change `PROVISIONAL`, `activationEligible=false`, or
`platformActivationEligible=false`.

Open limitations:

- `RUNTIME_ENFORCEMENT_UNVERIFIED`
- `TRUSTED_EXTERNAL_ATTESTATION_MISSING`
- `LINUX_SYMLINK_EVIDENCE_MISSING`

Safety counters: production, Sheets, Apps Script, broker/API, deployment,
activation, push and merge writes are all zero.
