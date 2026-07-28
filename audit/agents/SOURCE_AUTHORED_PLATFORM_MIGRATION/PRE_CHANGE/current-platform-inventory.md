# Current platform inventory

## Baseline

- Repository: `https://github.com/NeyJealous/ios.git`
- Canonical branch: `integration/ios-current`
- Base and feature-start SHA:
  `574c1cc145aa736f55efb479fbf591c1cd23b5b6`
- Task branch: `feature/source-authored-agent-platform`
- Initial worktree: clean
- Node: `v22.23.1`
- npm: `10.9.8`
- GitHub CLI: authenticated as `NeyJealous`
- Codex: in-app runtime authorized; direct MSIX CLI launcher unavailable to the
  automation host with `Access is denied`
- Five project-local agent types: discovered and previously runtime-smoked

## Canonical runtime candidates

| Agent | Path | SHA-256 | Model | Reasoning | Sandbox | Baseline |
|---|---|---|---|---|---|---|
| ios-agent-orchestrator | `.codex/agents/ios-agent-orchestrator.toml` | `d04f524e26bd1249ee3396893f0d2eb331bf35e94f639db7b971c78c5ecf5a77` | `gpt-5.6-terra` | `high` | `read-only` | `VIABLE_REFERENCE_CANON` |
| agent-governance-auditor | `.codex/agents/agent-governance-auditor.toml` | `54a4c3d8384eb4af53802d4655ffc70ae3ebd05a85b0ee3fb0bcfdcdc39f8576` | `gpt-5.6-sol` | `high` | `read-only` | `VIABLE_REFERENCE_CANON` |
| security-privacy-auditor | `.codex/agents/security-privacy-auditor.toml` | `e967687f422e98af13c92d2d1c0524942269e9197e947bb82d8fd465702450c3` | `gpt-5.6-sol` | `high` | `read-only` | `VIABLE_REFERENCE_CANON` |
| audit-traceability-reviewer | `.codex/agents/audit-traceability-reviewer.toml` | `fce0c2f2113c7e3e2e564a90d563daab92c75c03c95df300cf37c56e20fa61bc` | `gpt-5.6-terra` | `medium` | `read-only` | `VIABLE_REFERENCE_CANON` |
| ios-codebase-auditor | `.codex/agents/ios-codebase-auditor.toml` | `421857033e9072d663d5e0612afd54de669494e0745021da33500b15ef4c5b43` | `gpt-5.6-sol` | `high` | `read-only` | `VIABLE_REFERENCE_CANON` |

## Old live build plane

### Overlays

- `architecture/agents/overlays/ios-agent-orchestrator.yaml`
- `architecture/agents/overlays/agent-governance-auditor.yaml`
- `architecture/agents/overlays/security-privacy-auditor.yaml`
- `architecture/agents/overlays/audit-traceability-reviewer.yaml`
- `architecture/agents/overlays/ios-codebase-auditor.yaml`

### Compositions

- `architecture/agents/compositions/ios-agent-orchestrator.yaml`
- `architecture/agents/compositions/agent-governance-auditor.yaml`
- `architecture/agents/compositions/security-privacy-auditor.yaml`
- `architecture/agents/compositions/audit-traceability-reviewer.yaml`
- `architecture/agents/compositions/ios-codebase-auditor.yaml`

### Generated provisional profiles

- `architecture/agents/generated/provisional/ios-agent-orchestrator.toml`
- `architecture/agents/generated/provisional/agent-governance-auditor.toml`
- `architecture/agents/generated/provisional/security-privacy-auditor.toml`
- `architecture/agents/generated/provisional/audit-traceability-reviewer.toml`
- `architecture/agents/generated/provisional/ios-codebase-auditor.toml`

### Locks and provenance

- `architecture/agents/registry/composition-lock.json`
- `architecture/agents/registry/upstream-lock.json`
- `architecture/agents/registry/upstream-selection-register.yaml`
- `architecture/agents/registry/upstream-selection-candidates.yaml`
- `architecture/agents/upstream/**`
- VoltAgent commit:
  `5605c9c18b3687993919d6cc467af4a34898fee2`
- Wshobson historical commit:
  `b6af3711058190e4b5c5274b9758498fe626ec5a`

The target architecture retains minimal VoltAgent provenance for each canonical
profile and preserves historical snapshots/licenses/audit evidence. It does not
retain full upstream content as a runtime layer.

## Registries and routing

- Canonical current Registry:
  `architecture/agents/registry/agents.yaml`
- Compatibility Registry:
  `architecture/agents/agent-registry.yaml`
- Legacy JSON projection:
  `architecture/agents/agent-registry.json`
- Model Registry:
  `architecture/agents/registry/model-registry.yaml`
- Model availability:
  `architecture/agents/registry/model-availability.yaml`
- Review Matrix:
  `architecture/agents/review-matrix.yaml`
- Resolver:
  `tools/resolve-required-agents.mjs`,
  `tools/agents/resolve.mjs`
- Orchestration:
  `tools/agents/orchestrate.mjs`,
  `tools/agents/orchestration-lib.mjs`

Known drift:

- current runtime TOML hashes differ from generated/activation hashes;
- orchestrator runtime TOML requests `gpt-5.6-terra/high`, while old Registry
  fields contain `gpt-5.6-terra/medium`;
- old docs and `AGENTS.md` still describe provisional generated staging.

## Activation plane

- `tools/agents/activate-first-wave.mjs`
- `tools/agents/deactivate-first-wave.mjs`
- `tools/agents/activation-lib.mjs`
- `tools/agents/verify-first-wave-activation.mjs`
- `tools/agents/validate-activation-boundary.mjs`
- `architecture/agents/activation/activation-policy.yaml`
- `architecture/agents/activation/first-wave-activation-manifest.json`
- `architecture/agents/activation/first-wave-dispatch-manifest.json`
- `architecture/agents/activation/first-wave-rollback-manifest.json`
- `architecture/agents/registry/activation-register.json`

`activation-lib.mjs` is a confirmed write boundary: it copies/removes runtime
profiles and mutates Registry, Matrix and activation state. Target state removes
that live write path and retains only a fail-closed validate-only governance
gate.

## Validators and tests

Primary live validators:

- `tools/agents/validate-generated-agents.mjs`
- `tools/agents/first-wave-validation-lib.mjs`
- `tools/agents/validate-first-wave-agents.mjs`
- `tools/agents/validate-activation-boundary.mjs`
- `tools/agents/validate-capability-envelopes.mjs`
- `tools/validate-agent-governance.mjs`
- `tools/non-agent-safety-validator.mjs`
- `tools/trusted-governance/validate.mjs`
- `tools/publication-privacy-check.mjs`

Primary affected tests:

- `tests/agent-governance/activation-boundary.test.mjs`
- `tests/agent-governance/capability-envelope.test.mjs`
- `tests/agent-governance/first-wave-activation.test.mjs`
- `tests/agent-governance/first-wave-agent-validation.test.mjs`
- `tests/agent-governance/first-wave-platform.test.mjs`
- `tests/agent-governance/orchestrator.test.mjs`
- `tests/agent-governance/registry-matrix.test.mjs`
- `tests/agent-governance/resolver.test.mjs`
- `tests/agent-governance/trusted-governance.test.mjs`

## Current pre-change status

- Privacy/secret scan: `PASS`
- Resolver/preflight: `BLOCKED`
- Activation: `CLOSED`
- Production impact: `NONE`
- Local implementation: owner-authorized in isolated feature branch
- PR/merge/trusted acceptance: not authorized and not evidenced
