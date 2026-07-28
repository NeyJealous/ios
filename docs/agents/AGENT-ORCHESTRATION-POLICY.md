# Agent Orchestration Policy

## Status and scope

This policy applies to personal development of the owner-operated IOS
repository. The accepted architecture is defined by
`adr/ADR-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md`.

Production deployment, external multi-maintainer operation and handling of
production credentials remain outside this policy and require a separate
hardening gate.

## Development workflow

1. Work in a task or feature branch based on `integration/ios-current`.
2. Confirm branch, base, remote and clean worktree.
3. Run privacy/secret preflight.
4. Use Resolver and orchestration preflight to classify the change and select
   useful local agents and controls.
5. Run the applicable static validators and tests.
6. Preserve read-only boundaries for all audit profiles.
7. Publish through a PR and merge only with explicit owner authorization.

## Local reviews

Review Matrix results identify appropriate local review profiles. They are
recommendations for development quality, not a requirement for external
attestation or approval by another GitHub user.

The owner may accept locally verified evidence for personal development.
Review reports and manifests are required only when the task or owner
explicitly requests them. A missing independent reviewer does not block a
personal-development PR by itself.

Self-review remains prohibited: an orchestrator is not scheduled as reviewer
of its own profile or orchestration implementation. Other selected controls
and owner review remain applicable.

## CI contract

The active `Agent Governance` workflow is read-only and validates:

- source-authored canonical profiles;
- registry, matrix and instruction contracts;
- agent-platform regression tests;
- privacy and secret scanning;
- patch formatting.

The workflow must not use `pull_request_target`, execute production writes,
require trusted attestation, or require review manifests for ordinary personal
development.

## GitHub rules

The canonical branch ruleset must:

- require changes through a pull request;
- prevent branch deletion;
- prevent non-fast-forward updates;
- allow zero required approving reviews for the sole owner;
- require resolution of review conversations when conversations exist.

The ruleset does not grant direct-push, deployment or production authority.

## Production hardening

Before external deployment, team expansion or production credential access,
create a separate RFC/ADR and versioned gate. That phase may reintroduce
trusted attestation, independent approvals, protected required checks,
cryptographic runtime identity and production activation controls.

Historical trusted-governance artifacts remain traceability evidence and do
not represent an active development gate.
