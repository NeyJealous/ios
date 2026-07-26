# Agent Platform v2 — first-wave provisional build acceptance

- Reviewed implementation head: `7c81e2e28f04e4bbf9e5e56744afbe600d99cfc1`
- Branch: `feature/agent-platform-v2-integration`
- Build status: `FIRST_WAVE_PROVISIONAL_BUILD_COMPLETE`
- Platform state: `PROVISIONAL_PLATFORM_BUILD`
- Active/runtime-discovered agents: `0 / 0`
- Platform activation eligible: `false`
- ADR: `DRAFT_NOT_ACCEPTED`
- Evidence-tail policy: reports review the implementation head above; this
  report-only commit does not alter implementation.

## Locally accepted Phase 3B scope

Exactly five generated profiles are staged under
`architecture/agents/generated/provisional/`. No first-wave profile exists in
`.codex/agents/`. The five append-only overlays, deterministic compositions,
capability envelopes, Registry, Model Registry, Review Matrix, Resolver,
plan-only orchestrator and offline bootstrap remain provisional.

The bootstrap generates staging artifacts only, performs no network update,
executes no downloaded upstream code and leaves
`runtimeDiscoveredPlatformAgents=0`. Activation command is `NOT_IMPLEMENTED`;
a fully spoofed repository-authored activation request remains blocked by the
missing operation and missing trusted external verifier.

## Verification

- Governance suite: 109 total, 107 PASS, 0 FAIL, 2 Windows symlink SKIP.
- Fresh checkout: `npm ci` → `agents:bootstrap` → `agents:check` → runtime
  discovery inspection → zero diff: PASS.
- Upstream exact pins, paths, raw/normalized hashes and licenses: PASS for 17
  profiles and 19 files including licenses.
- Capability contracts: 5 `LOCALLY_VALIDATED`;
  `RUNTIME_ENFORCEMENT_UNVERIFIED`.
- Resolver determinism, mixed unknown fail-closed, mandatory NOT_AVAILABLE,
  self-review, DAG cycles and spoofed activation: PASS.
- Non-agent safety validator and privacy scan: PASS; findings=0.
- Five independent external bootstrap reviews on the implementation head:
  architecture, governance, security/privacy, traceability/documentation and
  tests all `PASS_WITH_WARNINGS`; no `HIGH`, `CRITICAL` or `BLOCKER` finding
  applies to Phase 3B.

The canonical Resolver manifest remains `BLOCKED`: its five mandatory
PROVISIONAL platform agents were not runtime-dispatched and are listed as
missing. The five external bootstrap reviews are supplementary review
evidence, not substituted platform-agent identities. This fail-closed
automatic-dispatch status is compatible with local Phase 3B build completion
and continues to prohibit Phase 3C activation.

## Acceptance boundary

This is acceptance of a reproducible local provisional build only. It is not
agent activation, runtime capability enforcement, trusted attestation,
accepted ADR, push, merge, deployment or production approval. Phase 3C remains
blocked by Linux symlink evidence, GitHub canaries and ruleset, trusted
external attestation, replay store, key lifecycle and a separate owner
activation decision.
