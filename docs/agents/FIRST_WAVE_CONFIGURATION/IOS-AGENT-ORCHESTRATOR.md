# IOS Agent Orchestrator — source-authored configuration

- Canonical profile: `.codex/agents/ios-agent-orchestrator.toml`
- Model: `gpt-5.6-terra`, reasoning `high`
- Sandbox: `read-only`
- Provenance: `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/09-meta-orchestration/agent-organizer.toml`
- Profile version: `2.2.0-source-authored`
- Status: `CANONICAL_SOURCE_RUNTIME_VERIFIED`

The orchestrator keeps Resolver/DAG/evidence aggregation behavior. It may
classify `ESCALATION_REQUIRED` and recommend a class, but may not choose a
model, spawn an escalation agent, self-review, activate, merge or deploy.
