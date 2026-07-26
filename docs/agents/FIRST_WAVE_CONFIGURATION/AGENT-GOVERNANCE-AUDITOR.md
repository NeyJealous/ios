# Agent Governance Auditor — owner configuration view

- Status: `PROVISIONAL`
- Generated staging profile: `architecture/agents/generated/provisional/agent-governance-auditor.toml`
- Profile SHA-256: `377acf7ec6c48867a536c1972169b999c6ec5f1a2cf1ffe3077ef792fec4ffd9`
- Model: `gpt-5.6-sol`, reasoning `high`
- Upstream result: `UPSTREAM_UNCHANGED_BYTE_IDENTICAL`
- Activation eligible: `false`
- Runtime discovered: `false`

Upstream composition:

1. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/11-ai-governance-safety/ai-governance-auditor.toml` — `b465a860c765b881b17c0f0a3980a6481f63780378cde30ac16262d700360879`
2. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/11-ai-governance-safety/policy-guardrail-designer.toml` — `52b0f6138b184a540439b300b40aefe2b685069b0e176be3d711072f0d556c44`
3. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/13-llmops-evals-observability/eval-engineer.toml` — `6ebae980912d4e4e1813d3f1fa9c6a2aebf9156205b070920bb57dd66d8cb9f6`
4. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/conductor/agents/conductor-validator.md` — `f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6`
5. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/comprehensive-review/agents/code-reviewer.md` — `1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e`

IOS additions:

- Registry and Matrix consistency
- Resolver determinism
- upstream integrity and append-only overlays
- model and execution-mode contracts
- stale SHA and manifest freshness
- anti-tamper and anti-self-review
- fake REAL_SUBAGENT detection
- automatic dispatch validation
- owner bypass scope
- trusted-attestation limitations

Prohibitions:

- weaken the security floor
- cancel governance blockers with successful evaluations
- review its own generated profile as independent evidence
- treat self-reported evidence as trusted attestation
- mutate policies, profiles or registries
- merge, deploy, approve production or perform writes

The complete overlay, capability envelope, conflict register, annotated
upstream blocks and byte evidence are in
`audit/agents/FIRST_WAVE_CONFIGURATION_REVIEW/agents/agent-governance-auditor.md`.

Readiness: `READY_FOR_OWNER_ACTIVATION_REVIEW`; no activation was performed.
