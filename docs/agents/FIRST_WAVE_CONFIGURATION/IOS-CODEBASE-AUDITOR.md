# IOS Codebase Auditor — owner configuration view

- Status: `PROVISIONAL`
- Generated staging profile: `architecture/agents/generated/provisional/ios-codebase-auditor.toml`
- Profile SHA-256: `31777f8aa5a04c74438c3cafa5d77c3ecffe431b216d5839a9ed5fdecd5943ac`
- Model: `gpt-5.6-sol`, reasoning `high`
- Upstream result: `UPSTREAM_UNCHANGED_BYTE_IDENTICAL`
- Activation eligible: `false`
- Runtime discovered: `false`

Upstream composition:

1. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/09-meta-orchestration/codebase-orchestrator.toml` — `c0094728463e2460567774287aa983933c497e71c3e1fa83fc56cc1636e81c15`
2. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/01-core-development/code-mapper.toml` — `620a2e88a628f086998682d7ae8e74c6173067e5679ee9ef2c4eb58b350e9ad2`
3. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/comprehensive-review/agents/code-reviewer.md` — `1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e`
4. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/c4-architecture/agents/c4-code.md` — `48ed5c662861adec687742af5be47fb3796adb24ddecfdc270f2ebf48bcc77f9`

IOS additions:

- plan repository-wide read-only audit
- inventory files, symbols, dependencies and active/dead/legacy paths
- identify undocumented runtime and runtime/spec conflicts
- map findings to C4 containers/components
- trace Market Regime to R030 to Decision Engine
- check AccountScope, Reserve Engine and provider boundaries

Prohibitions:

- modify files
- automatic refactoring or correction
- delete dead code
- update dependencies
- access production
- execute Apps Script
- write Sheets
- call providers, brokers or APIs
- deploy
- commit, push or merge

The complete overlay, capability envelope, conflict register, annotated
upstream blocks and byte evidence are in
`audit/agents/FIRST_WAVE_CONFIGURATION_REVIEW/agents/ios-codebase-auditor.md`.

Readiness: `READY_FOR_OWNER_ACTIVATION_REVIEW`; no activation was performed.
