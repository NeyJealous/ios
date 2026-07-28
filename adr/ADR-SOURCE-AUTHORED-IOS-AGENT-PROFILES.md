# ADR: Source-authored IOS Agent Profiles

- Status: `ACCEPTED`
- Date: 2026-07-27
- Accepted: 2026-07-28
- Owner decision: accepted for personal development of the closed IOS project
- Related RFC: `rfc/RFC-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md`
- Supersedes: `adr/ADR-AGENT-PLATFORM-V2.md`

## Context

Agent Platform v2 staged immutable upstream snapshots, append-only overlays,
composition manifests and generated provisional profiles. The five manually
authored project-local profiles subsequently passed runtime viability checks
and were selected by the owner as the full first-wave file, functional and
behavioral canon. Keeping a generator pipeline would create a second source of
truth and could overwrite that reviewed behavior.

## Decision

1. `.codex/agents/*.toml` is the sole canonical profile source.
2. Profiles are edited directly, reviewed by the owner and validated as
   source-authored artifacts.
3. Each IOS profile records one closest-role VoltAgent source as provenance:
   repository, exact path, pinned commit and IOS profile version.
4. Upstream content is provenance, not a runtime layer. IOS instructions,
   output contracts, evidence requirements and governance rules are embedded
   in the TOML.
5. Overlays and generated provisional profiles are removed from the target
   architecture. `compose-agents.mjs` is retired.
6. Composition manifests and their lock are replaced by the Agent Integrity
   Registry because composition has no independent function after removal of
   multiple bases, overlays and generation.
7. Separate capability contracts are retained as deny-by-default controls.
8. Runtime status is evidence-based and is never inferred from file presence.
9. Model escalation is centralized. A profile never chooses or starts another
   model and only returns `ESCALATION_REQUIRED` with an evidence package.
10. The orchestrator may validate and classify that package and recommend a
    route. Actual universal escalation agents are deferred; maximum escalation
    requires explicit owner approval.
11. Obsidian Mind remains a separate deferred memory subsystem.
12. The platform is intended for personal development of the closed IOS
    project. Agent status is limited to `DRAFT` and `READY`.
13. `READY` requires valid TOML, project discovery, the configured model,
    positive role smoke, negative capability smoke and read-only filesystem
    integrity.
14. Production-grade trusted attestation, cryptographic runtime identity,
    independent review gates and a separate activation process are not
    required for personal development. They are deferred to a hardening phase
    before any external or production deployment.

## Owner acceptance

On 2026-07-28 the owner accepted the source-authored TOML architecture and the
five current profiles as the canonical development platform. Overlays,
generator, generated profiles and the composition pipeline remain retired.
Earlier independent findings remain historical risk documentation but do not
block use of `READY` agents for personal development.

## Alternatives considered

- Retain generator plus overlays: rejected because it preserves competing
  sources of truth and risks replacing owner-approved profiles.
- Embed every upstream snapshot byte in runtime TOML: rejected because
  provenance and integrity are sufficient and duplication obscures IOS policy.
- Remove capability contracts: rejected because they independently encode
  deny-by-default authority and can be validated without trusting prose.
- Create universal escalation agents now: rejected as outside this phase.

## Consequences

Profile changes become ordinary reviewed source changes. Integrity validation
is simpler and directly binds the runtime file. Upstream updates are deliberate
provenance changes rather than regeneration. Historical audit artifacts and
pinned snapshots remain available, but no live validator may require an
overlay, composition or generated-profile equality.

## Migration strategy

1. Inventory legacy consumers and preserve the pre-change hashes.
2. Add provenance and the unified escalation contract to the five profiles.
3. Introduce the integrity registry, schema and fail-closed validator.
4. Migrate capability, model, review and activation gates to canonical paths.
5. Remove live overlay, composition and generator artifacts and tests.
6. Run static validation and sequential runtime smoke.
7. Set an agent to `READY` only after its required smoke evidence passes.

## Rollback strategy

Before merge, revert the migration commits in reverse order. Do not regenerate
or overwrite `.codex/agents/`. Historical v2 artifacts remain recoverable from
Git history. If validation fails, retain the source file with `DRAFT` status
and repair it through a separate change. Never regenerate or overwrite the
canonical TOML.

## Validation requirements

TOML parsing, required fields, unique identity, exact canonical path, profile
SHA, model binding, capability contract, secret/privacy scan and direct-model-
switching checks must pass. `READY` additionally requires discovery, positive
role smoke, negative capability smoke and read-only filesystem integrity.

## Superseded documents

This accepted ADR supersedes the target-architecture decisions in
`ADR-AGENT-PLATFORM-V2.md` and the corresponding generated/overlay sections of
`RFC-AGENT-PLATFORM-V2.md`. Historical audit evidence is not superseded or
rewritten.

## Retained contracts

- capability envelopes and read-only sandbox;
- Registry/Review Matrix/Resolver fail-closed governance;
- pinned upstream provenance and license snapshots;
- owner control of production, merge and remote-write decisions.

## Removed contracts

- append-only overlay as a runtime layer;
- multiple-base composition as a profile requirement;
- generated provisional profile equality;
- overlay, composition and generated hashes;
- file-copy activation/deactivation.
- mandatory trusted attestation or separate platform activation for personal
  development.

## Deferred work

- universal Sol High agent;
- maximum escalation agent with owner approval;
- orchestrator runtime routing implementation;
- Obsidian Mind integration.
- production hardening before any external deployment.
