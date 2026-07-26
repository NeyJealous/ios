# Owner Decision: First-Wave Development Activation

Decision ID: `OWNER_DECISION_ACTIVATE_FIRST_WAVE_20260727`

The owner authorizes project-development activation of exactly these profiles:

1. `ios-agent-orchestrator`
2. `agent-governance-auditor`
3. `security-privacy-auditor`
4. `audit-traceability-reviewer`
5. `ios-codebase-auditor`

The exact approved profile, composition, overlay, capability and model bindings
are recorded in
`architecture/agents/activation/first-wave-activation-manifest.json`.

This decision permits local activation, real runtime smoke, rollback,
reactivation, feature publication, non-squash integration into
`integration/ios-current`, canonical validation, canonical publication and the
approved checkpoint tag. It does not authorize production governance,
deployment, Apps Script or Google Sheets writes, broker/API writes, `clasp
push`, a second wave, or acceptance of the draft ADR.

The resulting state is `FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT`.
`productionGovernanceEligible=false`. External trust gates in the activation
manifest remain open. `DataConfidenceContract` remains
`NOT_EXPLICITLY_DECLARED_IN_FIRST_WAVE_OVERLAY`.
