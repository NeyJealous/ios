# Agent layer controlled removal report

Status: `COMPLETED_WITH_ZERO_AGENT_FAIL_CLOSED`

Date: 2026-07-18

Owner authorization: initial phased decision plus subsequent explicit approval
to complete zero-agent cutover without restoring legacy profiles despite the
reported PRE_REMOVAL blockers.

## Deleted active profiles

1. `.codex/agents/apps-script-reviewer.toml`
2. `.codex/agents/architecture-reviewer.toml`
3. `.codex/agents/bond-specialist.toml`
4. `.codex/agents/company-rating-reviewer.toml`
5. `.codex/agents/documentation-reviewer.toml`
6. `.codex/agents/google-sheets-reviewer.toml`
7. `.codex/agents/investment-logic-reviewer.toml`
8. `.codex/agents/performance-auditor.toml`
9. `.codex/agents/test-generator.toml`
10. `.codex/agents/ux-reviewer.toml`

`.codex/environments/` was not deleted, moved, inspected as an IOS agent, or
added to repository ignore rules. Root `AGENTS.md` remains in place.

## Cleared active bindings

- `architecture/agents/agent-registry.yaml`: 12 legacy entries removed;
  active entries now 0.
- `architecture/agents/agent-registry.json`: legacy implementation index
  cleared.
- `architecture/agents/agent-requirement-map.json`: legacy role mappings
  cleared.
- `architecture/agents/review-matrix.yaml`: every old `RequiredAgents` and
  advisory Agent ID binding removed; task classification and safety controls
  remain.
- `tools/agent-governance-lib.mjs`: legacy canonical-ID and Terra-only project
  profile assumptions removed.
- Old manifests are rejected by the new platform-version/state contract.

Historical reports, Git history, prior merged evidence, source assignments and
pre-cleanup inventory were preserved. Historical Agent IDs in audit reports do
not constitute active registry, matrix or resolver bindings.

## Enforced transition state

```text
PlatformState = ZERO_AGENT_TRANSITION
Active custom agents = 0
Old Agent Registry references = 0
Old Review Matrix Agent ID bindings = 0
Old Resolver Agent ID bindings = 0
Old manifests accepted = false
Mandatory unavailable agent = NOT_AVAILABLE
BlockedByUnavailableAgents = [MANDATORY_AGENT_NOT_AVAILABLE]
Resolver behavior = fail-closed
Overall result = BLOCKED
New agent activation = false
```

The non-agent safety validator remains present and is independent of active
profiles. The trusted verifier explicitly blocks zero-agent state.

## Production impact

No Apps Script, Google Sheets schema/formula, provider, Investment Logic,
Decision Engine, R030, Market Regime, TradePlan or deployment file was changed
by removal. Production state was not read or written.

```text
production writes = 0
clasp push = 0
deployment updates = 0
Google Sheets writes = 0
broker/API writes = 0
required migration boundary: Market Regime influence = CLOSED
required migration boundary: AppliedMultiplier = 1.00
observed production state = NOT_VERIFIED; canonical R030 risk remains OPEN/NOT_APPROVED
```

## Remaining blockers

This removal is not acceptance of Agent Platform v2. New profiles remain
inactive because 31 upstream compositions are unresolved, Luna/Sol Pro are
unverified, trusted external execution attestation is unavailable, the trusted
workflow is not yet established in canonical base, and canary/ruleset evidence
is absent. RFC remains proposed and ADR remains draft.
