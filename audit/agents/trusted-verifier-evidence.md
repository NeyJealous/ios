# Trusted verifier evidence

Status: `LOCAL_IMPLEMENTATION_PASS_EXTERNAL_EVIDENCE_MISSING`

## Implemented boundary

- `pull_request_target` with `contents: read`;
- exact immutable base checkout and separate exact head checkout;
- execution only from `trusted-base`;
- candidate treated as non-executable Git/index data;
- full-SHA pinned checkout action;
- stricter-union base/head controls;
- trust-root mutation owner gate;
- path, index-mode, symlink/submodule, schema and SHA protections;
- external execution attestation required fail-closed.

## Local evidence

The governance suite contains positive and adversarial tests for head validator self-weakening, trust-root mutation, malformed SHA, symlink/submodule index modes, zero-agent blocking and spoofed execution evidence. Phase 3A execution results are recorded in the final task report/commit evidence.

## Evidence not available locally

- canonical-base execution of this verifier;
- negative and structural-positive GitHub canaries;
- protected repository ruleset requiring `trusted-agent-governance`;
- external runtime/OIDC attestation provider.

Therefore this document does not claim final PASS. Overall status remains `BLOCKED_EXTERNAL_EVIDENCE_MISSING`; attestation remains `INSUFFICIENT_EVIDENCE`.
