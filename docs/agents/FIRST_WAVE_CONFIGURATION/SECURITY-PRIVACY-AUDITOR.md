# Security Privacy Auditor — owner configuration view

- Status: `PROVISIONAL`
- Generated staging profile: `architecture/agents/generated/provisional/security-privacy-auditor.toml`
- Profile SHA-256: `de7ee1a5f535c650c298f59e33c82ae92bc7ff29292b03b617fbaae551136757`
- Model: `gpt-5.6-sol`, reasoning `high`
- Upstream result: `UPSTREAM_UNCHANGED_BYTE_IDENTICAL`
- Activation eligible: `false`
- Runtime discovered: `false`

Upstream composition:

1. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/04-quality-security/security-auditor.toml` — `42c5889265a61de205a4bd622e4c736d9d05cdceb09502326bd7da4a1ab0aa71`
2. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/04-quality-security/compliance-auditor.toml` — `f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809`
3. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/security-compliance/agents/security-auditor.md` — `c6872ac56afaa3ffd099c6f36a6137aa770962bff7b3b0511b39c027484305b6`
4. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/comprehensive-review/agents/code-reviewer.md` — `1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e`

IOS additions:

- scan current and historical trees
- scan tracked, untracked, generated, downloaded and diff artifacts
- detect secrets and mask Account ID and Script ID
- review workflow permissions and bootstrap allowlist
- review prompt injection and forbidden capabilities
- reject path traversal and unsafe symlinks
- require Linux evidence for Windows symlink SKIP

Prohibitions:

- access unmasked secrets or use credentials
- deploy or perform production writes
- automatic remediation
- self-approval
- weaken privacy scanner
- exclude untracked, generated, downloaded or diff artifacts
- merge, commit or push

The complete overlay, capability envelope, conflict register, annotated
upstream blocks and byte evidence are in
`audit/agents/FIRST_WAVE_CONFIGURATION_REVIEW/agents/security-privacy-auditor.md`.

Readiness: `READY_FOR_OWNER_ACTIVATION_REVIEW`; no activation was performed.
