# Owner decision — Agent Platform v2 Phase 3A

- Date materialized: 2026-07-22
- Status: `AUTHORIZED_FOR_PHASE_3A_GOVERNANCE_PREREQUISITES`
- Zero-agent cutover commit: `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da`
- Branch: `feature/agent-platform-v2-integration`

The owner authorized Phase 3A work limited to:

1. base-pinned trusted verifier design, threat model, tests, rollback and local evidence;
2. trusted execution/model/profile/overlay/SHA/owner/independence attestation contract with spoofing tests;
3. exact upstream candidate research at the two approved pinned commits and explicit owner-decision blockers;
4. read-only exact model slug smoke evidence without substitution;
5. RFC update while ADR remains `DRAFT_NOT_ACCEPTED`;
6. independent read-only post-change reviews and local validation.

Explicit prohibitions remain:

- no push, merge or owner self-approval;
- no mass `.codex/agents/**` generation;
- no agent activation;
- no production/runtime, Apps Script, Sheets, Decision Engine, R030, Market Regime or TradePlan changes;
- no `clasp push`, deployment, Sheets, broker/API or other production writes;
- no fabricated `REAL_SUBAGENT` or trusted model/owner claims.

The required stop condition is the end of Phase 3A. Phase 3B cannot start while
trusted verifier/attestation evidence, exact selections, model availability,
mandatory reports or CRITICAL/BLOCKER findings remain unresolved. This artifact
records task scope; it is not ADR acceptance, merge approval, deployment
approval or production-write authorization.
