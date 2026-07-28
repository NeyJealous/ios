# RFC: Source-authored IOS Agent Profiles

- Status: `PROPOSED_AWAITING_OWNER_ACCEPTANCE`
- Owner decision date: 2026-07-27
- Canonical branch: `integration/ios-current`
- Implementation branch: `feature/source-authored-agent-platform`

## Summary

The five first-wave IOS profiles are source-authored TOML artifacts in
`.codex/agents/`. A profile keeps one pinned VoltAgent profile as provenance,
while IOS instructions, evidence contracts and authority boundaries live
directly in the TOML. Runtime readiness remains evidence-based.

## Requirements

1. `.codex/agents/<agent-id>.toml` is the only canonical profile artifact.
2. Profile model, reasoning and read-only sandbox are immutable unless a
   separately approved model-governance change is opened.
3. The integrity registry binds every profile to its SHA-256, capability
   contract, model contract, provenance and runtime evidence.
4. Overlays, generated provisional profiles, composition manifests and the
   composition lock are not runtime or canonical inputs.
5. Capability contracts remain separate deny-by-default controls.
6. A profile may emit `ESCALATION_REQUIRED` with evidence, but may not choose
   a model, switch itself, spawn an escalation agent or use fallback.
7. Actual escalation routing is deferred to the orchestrator and future
   universal escalation agents. Maximum escalation requires owner approval.
8. Presence or hash validity does not imply `ACTIVE`.

## Validation gates

- real TOML parse and required-field validation;
- unique profile IDs and names;
- registry SHA/model/reasoning/capability binding;
- prohibited escalation-pattern scan and secret scan;
- discovery, exact model resolution, positive, negative and escalation smoke;
- filesystem integrity before and after runtime tests;
- owner acceptance before the ADR becomes accepted;
- owner approval before any activation status change.

## Out of scope

- universal Sol High or maximum escalation agents;
- execution of centralized escalation routing;
- Obsidian Mind integration;
- platform activation, deployment, merge or production writes.
