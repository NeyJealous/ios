# First-wave activation feature-branch acceptance

Overall status: `BLOCKED`

The activation implementation and rollback path are locally validated, but the
required profile-bound runtime gate did not pass.

## Git

- Initial HEAD: `af0b389893ae605af3d65e2cbb941486f7a74cdc`
- Activation tooling: `c7a7445`
- Owner decision manifests: `c51f3d9`
- Development activation: `b3a59fe`
- Runtime blocker and rollback: `5044ac2`
- Reproducible rollback normalization: `b12d761`
- Push: `0`
- Canonical merge: `0`
- Tag: not created

## Runtime gate

- Exact requested agent: `ios-agent-orchestrator`
- Requested model/reasoning: `gpt-5.6-terra` / `medium`
- Runtime response: `unknown agent_type 'ios-agent-orchestrator'`
- Execution mode: `NOT_AVAILABLE`
- Resolved model/reasoning: not resolved
- `REAL_SUBAGENT` claimed: no
- Remaining four smokes: not attempted due wave-level stop condition

## Rollback

- Rollback operation: `PASS`
- Runtime-discovered platform agents: `0`
- Dispatch: `NOT_DISPATCHED_ACTIVATION_CLOSED`
- Staged profiles preserved: `5`
- Production governance eligible: `false`

## Validation on rollback HEAD

`npm run agents:check`:

- overall: `PASS`
- governance tests: 121 total, 119 pass, 0 fail, 2 skip
- clean-checkout bootstrap and zero diff: `PASS`
- upstream integrity: `PASS`
- capability envelopes: `PASS`
- generated profiles: `PASS`
- privacy scan: 999 files, 0 findings, `PASS`
- production writes: `0`

## Decision

The feature branch must not be pushed or merged under the current owner
instruction because five real smokes did not pass. A fresh Codex session must
load the checked-in `.codex/agents/` catalog after activation and expose the
exact custom names to `spawn_agent`; then all five requested smokes, rollback,
reactivation and canonical validation must be repeated.
