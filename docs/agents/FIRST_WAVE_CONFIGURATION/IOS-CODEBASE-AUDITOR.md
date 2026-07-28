# IOS Codebase Auditor — source-authored configuration

- Canonical profile: `.codex/agents/ios-codebase-auditor.toml`
- Model: `gpt-5.6-sol`, reasoning `high`
- Sandbox: `read-only`
- Provenance: `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/09-meta-orchestration/codebase-orchestrator.toml`
- Profile version: `2.2.0-source-authored`
- Status: `CANONICAL_SOURCE_RUNTIME_VERIFIED`

The profile retains read-only C4, call-path and blast-radius analysis. It must
separate evidence from assumptions and cannot fix code or execute escalation.
