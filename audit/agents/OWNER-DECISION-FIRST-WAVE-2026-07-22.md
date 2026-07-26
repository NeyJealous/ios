# Owner decision — first-wave exact upstream selections

- Decision reference: `OWNER_DECISION_FIRST_WAVE_20260722`
- Reviewed package commit: `6da06f7f0a32c343f565e4f0a36354538087236a`
- Scope: five first-wave Agent Platform v2 compositions
- Build mode: `PROVISIONAL_PLATFORM_BUILD`
- ADR status: `DRAFT_NOT_ACCEPTED`
- Activation: forbidden
- Provisional output: `architecture/agents/generated/provisional/`
- Runtime discovery output: `.codex/agents/` must contain zero first-wave profiles

The owner accepted the exact recommended compositions recorded in
`audit/agents/FIRST_WAVE_EXACT_SELECTION/owner-choice-package.json` for:

- `ios-agent-orchestrator`, with installation authority removed by the capability envelope;
- `agent-governance-auditor`, retaining both guardrail and evaluation bases;
- `security-privacy-auditor`, read-only with complete privacy artifact scope;
- `audit-traceability-reviewer`, retaining business-analysis traceability;
- `ios-codebase-auditor`, repository-read-only and limited to the recommended code-reviewer path.

## Exact composition scope

The accepted exact paths, commits, profile IDs and hashes are those in the
reviewed owner-choice package and canonical selection register. Composition
order is:

- `ios-agent-orchestrator`:
  `categories/09-meta-orchestration/agent-organizer.toml`,
  `categories/09-meta-orchestration/agent-installer.toml`,
  `plugins/conductor/agents/conductor-validator.md`,
  `plugins/agent-teams/agents/team-lead.md`;
- `agent-governance-auditor`:
  `categories/11-ai-governance-safety/ai-governance-auditor.toml`,
  `categories/11-ai-governance-safety/policy-guardrail-designer.toml`,
  `categories/13-llmops-evals-observability/eval-engineer.toml`,
  `plugins/conductor/agents/conductor-validator.md`,
  `plugins/comprehensive-review/agents/code-reviewer.md`;
- `security-privacy-auditor`:
  `categories/04-quality-security/security-auditor.toml`,
  `categories/04-quality-security/compliance-auditor.toml`,
  `plugins/security-compliance/agents/security-auditor.md`,
  `plugins/comprehensive-review/agents/code-reviewer.md`;
- `audit-traceability-reviewer`:
  `categories/04-quality-security/compliance-auditor.toml`,
  `categories/06-developer-experience/documentation-engineer.toml`,
  `plugins/code-documentation/agents/docs-architect.md`,
  `plugins/business-analytics/agents/business-analyst.md`;
- `ios-codebase-auditor`:
  `categories/09-meta-orchestration/codebase-orchestrator.toml`,
  `categories/01-core-development/code-mapper.toml`,
  `plugins/comprehensive-review/agents/code-reviewer.md`,
  `plugins/c4-architecture/agents/c4-code.md`.

Both repositories remain pinned to
`VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2`
and `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a`.

## Capability and model scope

Every upstream base remains full and immutable. IOS restrictions are
append-only and may only narrow permissions. The `agent-installer` base gives
the orchestrator no install/package/global-profile authority. All five
capability envelopes deny repository writes, network, MCP, shell, Git/remote,
production, Sheets, Apps Script, broker/API, deployment, merge, push and
secret modification. These are contract declarations with local validation;
runtime enforcement evidence remains unavailable.

Model policy is Terra for `ios-agent-orchestrator` and
`audit-traceability-reviewer`, Sol high for the other three agents, and Sol
ultra only for recorded exceptional escalation. Luna remains
`MODEL_NOT_AVAILABLE` for spawn-agent routing and is not silently replaced.

## Authorization boundary and affected artifacts

This evidence materializes authorization for Phase 3B `PROVISIONAL BUILD`
only: selections, snapshots, overlays, compositions, staging profiles,
Registry, Matrix, Resolver, orchestration configuration, offline bootstrap,
reproducibility and negative tests. It covers commits descended from the
owner-choice evidence `6da06f7f0a32c343f565e4f0a36354538087236a`,
including the first-wave build/remediation series, but does not pre-approve
future content outside that scope.

All five agents remain `PROVISIONAL`, with `activationEligible=false` and
`platformActivationEligible=false`. Generated output must remain in
`architecture/agents/generated/provisional/`; bootstrap must not populate
`.codex/agents/`.

Phase 3C trusted runtime activation is expressly prohibited until accepted
ADR, trusted verifier and external attestation evidence, required reviews,
model eligibility, GitHub gates and a separate owner activation decision.

This decision does not authorize `ACTIVE`, push, merge, deployment, `clasp push`, Google Sheets writes, broker/API writes, production approval, silent model downgrade, external-attestation acceptance, or ADR acceptance.
