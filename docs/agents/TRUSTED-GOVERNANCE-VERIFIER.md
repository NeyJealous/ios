# Trusted Governance Verifier — deferred design

- Status: `DEFERRED_FOR_PRODUCTION_HARDENING`
- Active PR workflow: none
- Personal-development requirement: not applicable

The former `pull_request_target` trusted verifier was designed for an external,
multi-maintainer production governance boundary. It executed validation from
the exact PR base and treated the candidate checkout only as data.

That design cannot validate an intentional replacement of its own schema in a
single PR: the old base necessarily rejects the new source-authored registry,
status vocabulary and removal of overlays/compositions. For the owner-operated
personal IOS project this produced a permanent stale-base blocker without
adding practical assurance beyond the existing local validation and read-only
CI.

The active development architecture therefore removes
`.github/workflows/trusted-agent-governance.yml` from the PR path. The ordinary
`Agent Governance` workflow remains read-only, uses pinned actions and checks
the candidate source directly.

The verifier implementation and historical evidence may be retained as design
material. They do not represent an active check, required attestation or
activation gate.

Before any external or production deployment, a separate hardening phase must
reassess:

- base-owned or otherwise immutable verification;
- independent approvals and protected required checks;
- trusted runtime identity and attestation;
- replay protection and key lifecycle;
- negative and structural-positive canaries;
- rollback and production activation gates.
