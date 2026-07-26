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

The governance suite contains positive and adversarial tests for head validator self-weakening, trust-root mutation, malformed SHA, symlink/submodule index modes, zero-agent blocking and spoofed execution evidence. Final local run on reviewed implementation `54fe944138d304e47d693dd508a507a92e7dc2ac`: `135 total`, `134 PASS`, `0 FAIL`, `1` Windows filesystem-symlink fixture skipped. Governance and non-agent validators, privacy scan, exact pinned-source replay for `102` unique profile paths, and `git diff --check` passed.

## Evidence not available locally

- canonical-base execution of this verifier;
- negative and structural-positive GitHub canaries;
- protected repository ruleset requiring `trusted-agent-governance`;
- external runtime/OIDC attestation provider.

Therefore this document does not claim final PASS. Overall status remains `BLOCKED_EXTERNAL_EVIDENCE_MISSING`; attestation remains `INSUFFICIENT_EVIDENCE`.
