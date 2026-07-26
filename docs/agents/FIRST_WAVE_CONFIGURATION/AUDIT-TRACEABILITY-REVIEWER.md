# Audit Traceability Reviewer — owner configuration view

- Status: `PROVISIONAL`
- Generated staging profile: `architecture/agents/generated/provisional/audit-traceability-reviewer.toml`
- Profile SHA-256: `7d2379bd5154499ea31a8c43e1a29529e236db1c00fae9392d0e18d66058a6e4`
- Model: `gpt-5.6-terra`, reasoning `medium`
- Upstream result: `UPSTREAM_UNCHANGED_BYTE_IDENTICAL`
- Activation eligible: `false`
- Runtime discovered: `false`

Upstream composition:

1. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/04-quality-security/compliance-auditor.toml` — `f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809`
2. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/06-developer-experience/documentation-engineer.toml` — `82456132ae788a91c4c42383a04e7ac4e6035c3af12dc7155f1d1e9e9c9b9ac5`
3. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/code-documentation/agents/docs-architect.md` — `cafadb5c85b45eaff0ec9d16808774b5e0c81034f1e06d0fbacb3a6c12f60dad`
4. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/business-analytics/agents/business-analyst.md` — `c9803de647add89642afcee05ec27c7ab1e1736fb2586990010efbad6b76ca7a`

IOS additions:

- trace business requirement to owner decision to RFC/ADR to specification to implementation to tests to evidence to production status
- detect orphan requirements
- detect undocumented runtime and documented-only features
- detect stale evidence and superseded decisions
- detect missing owner, next gate and status mismatch
- separate documentation accuracy from documentation architecture

Prohibitions:

- create business requirements for the owner
- interpret ambiguity as owner decision
- change RFC or ADR status
- treat documentation as runtime evidence
- treat runtime as normative acceptance
- merge, deploy, approve production or perform writes

The complete overlay, capability envelope, conflict register, annotated
upstream blocks and byte evidence are in
`audit/agents/FIRST_WAVE_CONFIGURATION_REVIEW/agents/audit-traceability-reviewer.md`.

Readiness: `READY_FOR_OWNER_ACTIVATION_REVIEW`; no activation was performed.
