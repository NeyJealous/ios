# Five-agent comparison

All five profiles preserve their baseline role, top-level model, reasoning and
`read-only` sandbox. The only behavioral edit removes profile-local model
routing and adds the common `ESCALATION_REQUIRED` evidence contract.

| Agent | Baseline | Source-authored result |
|---|---|---|
| ios-agent-orchestrator | Terra/high/read-only | Same; centralized classification only |
| agent-governance-auditor | Sol/high/read-only | Same; structured escalation request |
| security-privacy-auditor | Sol/high/read-only | Same; structured escalation request |
| audit-traceability-reviewer | Terra/medium/read-only | Same; structured escalation request |
| ios-codebase-auditor | Sol/high/read-only | Same; structured escalation request |

No generated profile was restored and no upstream base was added.
