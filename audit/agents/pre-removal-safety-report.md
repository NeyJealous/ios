# PRE_REMOVAL Agent Platform v2 safety report

Overall status at original gate: `BLOCKED`

Subsequent owner decision: `ZERO_AGENT_CUTOVER_EXPLICITLY_AUTHORIZED`

Base SHA: `d2d60713e580fa1bcce8ba874216619598094093`

Reviewed implementation SHA: `1a4390e05717b38a0af17daf05defb7c44a7bdc4`

Branch: `feature/agent-platform-v2-integration`

## Requirement evidence matrix

| Pre-removal requirement | Implementation | Regression evidence | Result |
|---|---|---|---|
| Mixed known + unknown paths fail closed per path | `tools/agent-governance-lib.mjs` | resolver mixed-path fixture; full Git add/delete/rename fixture | `PASS` |
| Mandatory `NOT_AVAILABLE` cannot pass | review contract validator and trusted policy floor | `NOT_AVAILABLE + PASS` fixture | `PASS` |
| Runtime applies full repository schemas | `tools/json-schema-validator.mjs`, static and manifest validators | malformed registry/review/manifest fixtures | `PASS` |
| Windows CRLF test stability | normalized workflow test input | CI-instruction suite on Windows | `PASS` |
| Add/delete/rename/mixed diff behavior | NUL-safe Git name-status parser and per-path resolver | disposable Git integration fixtures | `PASS` |
| Independent non-agent safety control | `tools/non-agent-safety-validator.mjs` | deterministic mixed-path and execution-mode probes | `PASS` |
| PR cannot weaken its own validator | base-owned `tools/trusted-governance/validate.mjs` and `pull_request_target` workflow | self-weakened candidate, malformed evidence, trust-root mutation fixtures | `PASS_LOCAL_IMPLEMENTATION` |
| Candidate treated only as data | read-only workflow, pinned checkout action, no candidate imports/execution, mode/path/cap guards | workflow, symlink, submodule, SHA, collision policy tests | `PASS_LOCAL_IMPLEMENTATION` |
| PR-authored execution claim is not trusted attestation | all candidate-authored execution modes forbidden from trusted PASS | fabricated `AgentThreadId`, simulation, complete-candidate fixtures | `PASS_FAIL_CLOSED` |

## Executed commands

```text
node --test tests/agent-governance/*.test.mjs
→ 45 passed, 0 failed, 0 skipped

node tools/non-agent-safety-validator.mjs
→ OverallStatus=PASS
→ ActiveAgentDependency=false
→ ProductionWrites=0

node tools/validate-agent-governance.mjs --all
→ ok=true
→ registryAgents=12
→ matrixRules=20
→ errors=[]
```

## Resolver result

The exact base-to-implementation diff resolves to `mixed/unknown`, `FailClosed=true`, because current v1 matrix does not classify all new audit/trusted-governance paths. Required agents are:

- `APPS_SCRIPT_REVIEWER`
- `ARCHITECTURE_REVIEWER`
- `DOCUMENTATION_REVIEWER`
- `GOOGLE_SHEETS_REVIEWER`
- `INVESTMENT_LOGIC_REVIEWER`
- `PERFORMANCE_AUDITOR`
- `SECURITY_REVIEWER`
- `TEST_GENERATOR`
- `UX_REVIEWER`

This broad set is intentional evidence that mixed known/unknown no longer passes through a partially matched rule.

## Anti-tamper status

The local implementation and adversarial tests pass. The bootstrap PR itself cannot prove base ownership because canonical base `d2d60713…` does not contain the new verifier. Any trust-root modification produces `TRUST_ROOT_CHANGE_REQUIRES_OWNER_GATE`. The trusted result separates structural `IntegrityStatus` from external `AttestationStatus`; fabricated `REAL_SUBAGENT` metadata remains `INSUFFICIENT_EVIDENCE` and blocks overall PASS.

Before removal, the verifier must be merged independently into canonical, exercised by negative and structural-positive canaries, and configured as exact required check `trusted-agent-governance` in the repository ruleset. None of those external states is claimed here.

## RFC and ADR

- `RFC-AGENT-PLATFORM-V2`: `PROPOSED_FOR_REVIEW`.
- `ADR-AGENT-PLATFORM-V2`: `DRAFT_NOT_ACCEPTED`.
- Owner decision authorizes only Phase 1 remediation/bootstrap preparation.
- Phase 2 removal is not authorized by the draft ADR or this report.

## Upstream exact-selection status

- Reviewed pins: VoltAgent `5605c9c18b3687993919d6cc467af4a34898fee2`; wshobson `b6af3711058190e4b5c5274b9758498fe626ec5a`.
- `RESOLVED_CANDIDATE`: 13 rows, with exact paths/profile IDs/order/raw and normalized hashes recorded.
- `UNRESOLVED`: 31 rows.
- `UPSTREAM_PROFILE_NOT_FOUND`: 0.
- No unresolved agent is generated or activated.

## Model availability

- `gpt-5.6-terra`: current-run runtime evidence exists; trusted attestation remains insufficient.
- `gpt-5.6-sol`: current-run runtime evidence exists; trusted attestation remains insufficient.
- `gpt-5.6-luna`: `UNVERIFIED`; no substitute.
- `gpt-5.6-sol-pro`: `UNVERIFIED`; no substitute.
- Silent downgrade: `false`.

## Remaining blockers

1. Trusted verifier is not yet present in canonical base.
2. No negative/structural-positive GitHub canary evidence exists.
3. Repository ruleset does not yet evidence required context `trusted-agent-governance`.
4. External execution/model/owner attestation provider contract is not implemented; claims remain `INSUFFICIENT_EVIDENCE`.
5. 31 of 44 upstream compositions remain `UNRESOLVED` and require reviewed exact selection.
6. RFC is not fully accepted and ADR remains draft; separate owner acceptance is required.
7. Final contract-compatible reports for every fail-closed Resolver-required agent must be materialized against the reviewed SHA.

The original PRE_REMOVAL gate did not authorize removal. The owner subsequently
gave a separate explicit instruction to continue without restoring agents and
then explicitly approved completion of zero-agent cutover despite these
blockers. Removal status and preserved blockers are recorded in
`audit/agents/agent-layer-removal-report.md`. This later authorization does not
change the historical gate verdict to PASS.

## Safety counters

```text
production writes = 0
clasp push = 0
deployment updates = 0
Google Sheets writes = 0
broker/API writes = 0
required migration boundary: Market Regime production influence = CLOSED
required migration boundary: AppliedMultiplier = 1.00
observed production state = NOT_VERIFIED; canonical R030 risk remains OPEN/NOT_APPROVED
```
