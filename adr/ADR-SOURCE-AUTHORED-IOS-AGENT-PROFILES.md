# ADR: Source-authored IOS Agent Profiles

- Status: `PROPOSED_AWAITING_OWNER_ACCEPTANCE`
- Date: 2026-07-27
- Related RFC: `rfc/RFC-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md`
- Supersedes after owner acceptance: `adr/ADR-AGENT-PLATFORM-V2.md`

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
6. Run static validation, then sequential runtime revalidation.
7. Bind post-change evidence and update statuses only after all checks pass.

## Rollback strategy

Before merge, revert the migration commits in reverse order. Do not regenerate
or overwrite `.codex/agents/`. Historical v2 artifacts remain recoverable from
Git history. If runtime revalidation fails, retain the source files with
`CANONICAL_SOURCE_PENDING_REVALIDATION`, keep activation closed and repair only
through a new reviewed change.

## Validation requirements

TOML parsing, required fields, unique identity, exact profile SHA, model matrix,
capability contract, escalation-pattern, secret/privacy, governance, unit and
runtime smoke checks must pass. Runtime smoke must prove discovery, exact model
and reasoning, no fallback, role behavior, negative capability refusal,
escalation output and filesystem integrity.

## Superseded documents

On owner acceptance, this ADR supersedes the target-architecture decisions in
`ADR-AGENT-PLATFORM-V2.md` and the corresponding generated/overlay sections of
`RFC-AGENT-PLATFORM-V2.md`. Historical audit evidence is not superseded or
rewritten.

## Retained contracts

- capability envelopes and read-only sandbox;
- Registry/Review Matrix/Resolver fail-closed governance;
- pinned upstream provenance and license snapshots;
- owner approval, anti-self-review and trusted-evidence requirements;
- activation as a separate evidence-bound governance decision.

## Removed contracts

- append-only overlay as a runtime layer;
- multiple-base composition as a profile requirement;
- generated provisional profile equality;
- overlay, composition and generated hashes;
- file-copy activation/deactivation.

## Deferred work

- universal Sol High agent;
- maximum escalation agent with owner approval;
- orchestrator runtime routing implementation;
- Obsidian Mind integration.
