# First-wave exact upstream owner-choice package

Status: `AWAITING_OWNER_DECISION`

No selection in the canonical register is changed by this package. All five agents remain `REQUIRES_OWNER_DECISION`.

## ios-agent-orchestrator

Agent ID: `ios-agent-orchestrator`
Recommended selection:
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/09-meta-orchestration/agent-organizer.toml
    profileId: agent-organizer
    rawSha256: 3bbd908a8a0664a9a57c8503151200a2855f8de9e1c3e98edc7d289fdfe269cf
    normalizedSha256: 3bbd908a8a0664a9a57c8503151200a2855f8de9e1c3e98edc7d289fdfe269cf
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/09-meta-orchestration/agent-installer.toml
    profileId: agent-installer
    rawSha256: e1a7b8c709791e973cd8be5d32c548d8f49c3ef655a492de56aedb894dc77d82
    normalizedSha256: e1a7b8c709791e973cd8be5d32c548d8f49c3ef655a492de56aedb894dc77d82
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/conductor/agents/conductor-validator.md
    profileId: conductor-validator
    rawSha256: f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6
    normalizedSha256: f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/agent-teams/agents/team-lead.md
    profileId: team-lead
    rawSha256: a87785bac5111c47e1160f64ef43ef58e6671fe7a96f9e0ac14c5f248c139a48
    normalizedSha256: a87785bac5111c47e1160f64ef43ef58e6671fe7a96f9e0ac14c5f248c139a48
    license: MIT
Composition order:
1. `VoltAgent/awesome-codex-subagents:categories/09-meta-orchestration/agent-organizer.toml`
2. `VoltAgent/awesome-codex-subagents:categories/09-meta-orchestration/agent-installer.toml`
3. `wshobson/agents:plugins/conductor/agents/conductor-validator.md`
4. `wshobson/agents:plugins/agent-teams/agents/team-lead.md`
Conflict-resolution:
- Preserve all bases byte-for-byte in the listed order.
- IOS overlay prohibits install, download, implementation, self-review and production authority.
- IOS Resolver and evidence contracts override routing behavior without rewriting upstream text.
IOS overlay gaps:
- IOS Resolver invocation
- PRE_CHANGE and POST_CHANGE
- mandatory/advisory DAG
- model availability gate
- BLOCKER/CRITICAL/UNKNOWN/NOT_AVAILABLE stop
- commit-bound report collection
Why recommended:
Combines exact agent organization, installation lifecycle awareness, validation and the pinned team-lead profile that explicitly coordinates multi-agent work.
Alternatives rejected:
- Non-agent command and skill artifacts are excluded because the target requires upstream profiles.
- TDD and deployment orchestrators are domain-specific and do not satisfy general multi-agent supervision.
Owner choices:
- A. `ACCEPT_RECOMMENDED`
- B. `ACCEPT_ALTERNATIVE_NO_INSTALLER` — Removes upstream installation authority but no longer includes every explicitly named VoltAgent component.
- C. `ACCEPT_ALTERNATIVE_CONDUCTOR_ONLY_WSHOBSON` — Omits the exact team orchestration profile and leaves parallel lifecycle coverage to the IOS overlay.
- D. `REJECT_AND_RESEARCH_FURTHER`

Confidence: `MEDIUM`
## agent-governance-auditor

Agent ID: `agent-governance-auditor`
Recommended selection:
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/11-ai-governance-safety/ai-governance-auditor.toml
    profileId: ai-governance-auditor
    rawSha256: b465a860c765b881b17c0f0a3980a6481f63780378cde30ac16262d700360879
    normalizedSha256: b465a860c765b881b17c0f0a3980a6481f63780378cde30ac16262d700360879
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/11-ai-governance-safety/policy-guardrail-designer.toml
    profileId: policy-guardrail-designer
    rawSha256: 52b0f6138b184a540439b300b40aefe2b685069b0e176be3d711072f0d556c44
    normalizedSha256: 52b0f6138b184a540439b300b40aefe2b685069b0e176be3d711072f0d556c44
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/13-llmops-evals-observability/eval-engineer.toml
    profileId: eval-engineer
    rawSha256: 6ebae980912d4e4e1813d3f1fa9c6a2aebf9156205b070920bb57dd66d8cb9f6
    normalizedSha256: 6ebae980912d4e4e1813d3f1fa9c6a2aebf9156205b070920bb57dd66d8cb9f6
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/conductor/agents/conductor-validator.md
    profileId: conductor-validator
    rawSha256: f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6
    normalizedSha256: f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/comprehensive-review/agents/code-reviewer.md
    profileId: comprehensive-review-code-reviewer
    rawSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    normalizedSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    license: MIT
Composition order:
1. `VoltAgent/awesome-codex-subagents:categories/11-ai-governance-safety/ai-governance-auditor.toml`
2. `VoltAgent/awesome-codex-subagents:categories/11-ai-governance-safety/policy-guardrail-designer.toml`
3. `VoltAgent/awesome-codex-subagents:categories/13-llmops-evals-observability/eval-engineer.toml`
4. `wshobson/agents:plugins/conductor/agents/conductor-validator.md`
5. `wshobson/agents:plugins/comprehensive-review/agents/code-reviewer.md`
Conflict-resolution:
- Preserve governance, guardrail, evaluation, validation and code-review bases in that order.
- Treat design and implementation duties as analysis-only under the IOS overlay.
- Fail closed when base instructions imply self-approval or policy mutation.
IOS overlay gaps:
- Registry/Matrix consistency
- Resolver determinism
- stale SHA
- anti-tamper and anti-self-review
- fake REAL_SUBAGENT detection
- owner bypass scope
Why recommended:
Retains both named VoltAgent governance specializations and adds exact validation plus broad repository review coverage.
Alternatives rejected:
- Plugin-specific duplicate code-reviewer profiles add no distinct governance methodology.
- Incident-response code-reviewer is narrower than the repository-wide comprehensive reviewer.
Owner choices:
- A. `ACCEPT_RECOMMENDED`
- B. `ACCEPT_ALTERNATIVE_POLICY_ONLY` — Omits dedicated evaluation methodology.
- C. `ACCEPT_ALTERNATIVE_EVAL_ONLY` — Omits dedicated guardrail-design methodology.
- D. `REJECT_AND_RESEARCH_FURTHER`

Confidence: `MEDIUM`

## security-privacy-auditor

Agent ID: `security-privacy-auditor`
Recommended selection:
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/04-quality-security/security-auditor.toml
    profileId: security-auditor
    rawSha256: 42c5889265a61de205a4bd622e4c736d9d05cdceb09502326bd7da4a1ab0aa71
    normalizedSha256: 42c5889265a61de205a4bd622e4c736d9d05cdceb09502326bd7da4a1ab0aa71
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/04-quality-security/compliance-auditor.toml
    profileId: compliance-auditor
    rawSha256: f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809
    normalizedSha256: f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/security-compliance/agents/security-auditor.md
    profileId: security-compliance-security-auditor
    rawSha256: c6872ac56afaa3ffd099c6f36a6137aa770962bff7b3b0511b39c027484305b6
    normalizedSha256: c6872ac56afaa3ffd099c6f36a6137aa770962bff7b3b0511b39c027484305b6
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/comprehensive-review/agents/code-reviewer.md
    profileId: comprehensive-review-code-reviewer
    rawSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    normalizedSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    license: MIT
Composition order:
1. `VoltAgent/awesome-codex-subagents:categories/04-quality-security/security-auditor.toml`
2. `VoltAgent/awesome-codex-subagents:categories/04-quality-security/compliance-auditor.toml`
3. `wshobson/agents:plugins/security-compliance/agents/security-auditor.md`
4. `wshobson/agents:plugins/comprehensive-review/agents/code-reviewer.md`
Conflict-resolution:
- Preserve security, compliance, wshobson security and code-review bases in that order.
- Apply the strictest prohibition when security and code-review duties differ.
- IOS overlay removes write, credential-use and self-approval authority.
IOS overlay gaps:
- current and historical tree privacy
- Account ID and Script ID masking
- generated/downloaded/diff artifacts
- bootstrap allowlist
- prompt-injection review
- symlink/path traversal
Why recommended:
The security-compliance package gives the clearest exact security/compliance context, complemented by dedicated VoltAgent security and compliance profiles.
Alternatives rejected:
- Full-stack and security-scanning copies overlap the selected security-compliance body.
- Plugin-specific code-reviewer duplicates do not add privacy-specific coverage.
Owner choices:
- A. `ACCEPT_RECOMMENDED`
- B. `ACCEPT_ALTERNATIVE_BACKEND_FOCUSED` — Narrows security review toward application/backend feature development.
- C. `ACCEPT_ALTERNATIVE_COMPREHENSIVE_SECURITY` — Uses the broad DevSecOps security variant instead of the security-compliance package context.
- D. `REJECT_AND_RESEARCH_FURTHER`

Confidence: `HIGH`

## audit-traceability-reviewer

Agent ID: `audit-traceability-reviewer`
Recommended selection:
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/04-quality-security/compliance-auditor.toml
    profileId: compliance-auditor
    rawSha256: f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809
    normalizedSha256: f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/06-developer-experience/documentation-engineer.toml
    profileId: documentation-engineer
    rawSha256: 82456132ae788a91c4c42383a04e7ac4e6035c3af12dc7155f1d1e9e9c9b9ac5
    normalizedSha256: 82456132ae788a91c4c42383a04e7ac4e6035c3af12dc7155f1d1e9e9c9b9ac5
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/code-documentation/agents/docs-architect.md
    profileId: code-documentation-docs-architect
    rawSha256: cafadb5c85b45eaff0ec9d16808774b5e0c81034f1e06d0fbacb3a6c12f60dad
    normalizedSha256: cafadb5c85b45eaff0ec9d16808774b5e0c81034f1e06d0fbacb3a6c12f60dad
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/business-analytics/agents/business-analyst.md
    profileId: business-analyst
    rawSha256: c9803de647add89642afcee05ec27c7ab1e1736fb2586990010efbad6b76ca7a
    normalizedSha256: c9803de647add89642afcee05ec27c7ab1e1736fb2586990010efbad6b76ca7a
    license: MIT
Composition order:
1. `VoltAgent/awesome-codex-subagents:categories/04-quality-security/compliance-auditor.toml`
2. `VoltAgent/awesome-codex-subagents:categories/06-developer-experience/documentation-engineer.toml`
3. `wshobson/agents:plugins/code-documentation/agents/docs-architect.md`
4. `wshobson/agents:plugins/business-analytics/agents/business-analyst.md`
Conflict-resolution:
- Preserve compliance, documentation, docs architecture and business analysis bases in that order.
- IOS overlay constrains recommendations to traceability findings.
- Status conflicts resolve to the least advanced evidenced state.
IOS overlay gaps:
- Requirement-to-production chain
- orphan requirements
- documented-only features
- stale evidence
- superseded decisions
- missing owner and next gate
Why recommended:
Combines audit controls, technical documentation, codebase-derived documentation architecture and requirements interpretation.
Alternatives rejected:
- The documentation-generation docs-architect body overlaps the selected code-documentation profile.
- No other exact candidate provides the full requirement-to-production evidence chain.
Owner choices:
- A. `ACCEPT_RECOMMENDED`
- B. `ACCEPT_ALTERNATIVE_DOCUMENTATION_GENERATION` — Uses the path-distinct documentation-generation copy of docs-architect.
- C. `ACCEPT_ALTERNATIVE_NO_BUSINESS_ANALYST` — Removes business-requirement interpretation coverage.
- D. `REJECT_AND_RESEARCH_FURTHER`

Confidence: `MEDIUM`

## ios-codebase-auditor

Agent ID: `ios-codebase-auditor`
Recommended selection:
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/09-meta-orchestration/codebase-orchestrator.toml
    profileId: codebase-orchestrator
    rawSha256: c0094728463e2460567774287aa983933c497e71c3e1fa83fc56cc1636e81c15
    normalizedSha256: c0094728463e2460567774287aa983933c497e71c3e1fa83fc56cc1636e81c15
    license: MIT
  - repository: VoltAgent/awesome-codex-subagents
    commit: 5605c9c18b3687993919d6cc467af4a34898fee2
    sourcePath: categories/01-core-development/code-mapper.toml
    profileId: code-mapper
    rawSha256: 620a2e88a628f086998682d7ae8e74c6173067e5679ee9ef2c4eb58b350e9ad2
    normalizedSha256: 620a2e88a628f086998682d7ae8e74c6173067e5679ee9ef2c4eb58b350e9ad2
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/comprehensive-review/agents/code-reviewer.md
    profileId: comprehensive-review-code-reviewer
    rawSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    normalizedSha256: 1d4be63448f48c10956e4395e54c91fde6874dca26567944aaf657acc7f9e35e
    license: MIT
  - repository: wshobson/agents
    commit: b6af3711058190e4b5c5274b9758498fe626ec5a
    sourcePath: plugins/c4-architecture/agents/c4-code.md
    profileId: c4-code
    rawSha256: 48ed5c662861adec687742af5be47fb3796adb24ddecfdc270f2ebf48bcc77f9
    normalizedSha256: 48ed5c662861adec687742af5be47fb3796adb24ddecfdc270f2ebf48bcc77f9
    license: MIT
Composition order:
1. `VoltAgent/awesome-codex-subagents:categories/09-meta-orchestration/codebase-orchestrator.toml`
2. `VoltAgent/awesome-codex-subagents:categories/01-core-development/code-mapper.toml`
3. `wshobson/agents:plugins/comprehensive-review/agents/code-reviewer.md`
4. `wshobson/agents:plugins/c4-architecture/agents/c4-code.md`
Conflict-resolution:
- Preserve orchestrator, mapper, reviewer and C4 bases in that order.
- IOS overlay enforces read-only inventory and forbids automatic corrections.
- Conflicting runtime/spec claims remain findings with symbol-level evidence.
IOS overlay gaps:
- active/dead/legacy classification
- runtime/spec conflicts
- Market Regime to R030 to Decision Engine trace
- AccountScope and Reserve boundaries
- provider boundaries
Why recommended:
Combines repository decomposition, symbol mapping, comprehensive review and code-level dependency documentation.
Alternatives rejected:
- Path-distinct broad code-reviewer copies overlap the selected comprehensive-review candidate.
- No profile alone covers IOS runtime/spec and production-influence tracing.
Owner choices:
- A. `ACCEPT_RECOMMENDED`
- B. `ACCEPT_ALTERNATIVE_CODE_DOCUMENTATION_REVIEWER` — Uses the code-documentation package copy of the broad reviewer.
- C. `ACCEPT_ALTERNATIVE_INCIDENT_REVIEWER` — Narrows review toward logic flaws and error handling.
- D. `REJECT_AND_RESEARCH_FURTHER`

Confidence: `MEDIUM`
