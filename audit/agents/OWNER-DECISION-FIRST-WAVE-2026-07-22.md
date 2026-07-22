# Owner decision — first-wave exact upstream selections

- Decision reference: `OWNER_DECISION_FIRST_WAVE_20260722`
- Reviewed package commit: `6da06f7f0a32c343f565e4f0a36354538087236a`
- Scope: five first-wave Agent Platform v2 compositions
- Build mode: `PROVISIONAL_PLATFORM_BUILD`
- ADR status: `DRAFT_NOT_ACCEPTED`
- Activation: forbidden

The owner accepted the exact recommended compositions recorded in
`audit/agents/FIRST_WAVE_EXACT_SELECTION/owner-choice-package.json` for:

- `ios-agent-orchestrator`, with installation authority removed by the capability envelope;
- `agent-governance-auditor`, retaining both guardrail and evaluation bases;
- `security-privacy-auditor`, read-only with complete privacy artifact scope;
- `audit-traceability-reviewer`, retaining business-analysis traceability;
- `ios-codebase-auditor`, repository-read-only and limited to the recommended code-reviewer path.

Every upstream base remains full and immutable. IOS restrictions are append-only and may only narrow permissions. All five agents remain `PROVISIONAL`, with `activationEligible=false` and `platformActivationEligible=false`.

This decision does not authorize `ACTIVE`, push, merge, deployment, `clasp push`, Google Sheets writes, broker/API writes, production approval, silent model downgrade, external-attestation acceptance, or ADR acceptance.
