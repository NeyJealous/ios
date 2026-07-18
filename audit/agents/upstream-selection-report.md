# Upstream exact-selection register

Status: `BLOCKED — 31 UNRESOLVED`

Gate: `PRE_REMOVAL_AGENT_PLATFORM_V2`

Date: 2026-07-18

## Pins reviewed

- `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2`
- `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a`

Both pinned clones were inspected at the exact commits. All referenced names have existing candidates; `UPSTREAM_PROFILE_NOT_FOUND = 0`. A commit pin is not profile acceptance.

## Result

- `RESOLVED_CANDIDATE`: 13
- `UNRESOLVED`: 31
- `UPSTREAM_PROFILE_NOT_FOUND`: 0

`RESOLVED_CANDIDATE` means that the specification supplies one exact existing path for every component. It does not mean security acceptance or activation. Raw/normalized hashes are intentionally deferred until the selection is accepted; hashing every alternative would not convert an ambiguous composition into an exact decision.

## Register

| # | IOS Agent ID | Candidate composition at the pins | Ambiguity | Status |
|---:|---|---|---|---|
| 1 | `data-researcher` | V `docs-researcher`; W `search-specialist` | non-ID workflow phrase | `UNRESOLVED` |
| 2 | `research-analyst` | V `research-analyst`, `docs-researcher`; W `business-analyst`, `docs-architect` group | `or`, duplicate W IDs | `UNRESOLVED` |
| 3 | `search-specialist` | V `search-specialist`, `docs-researcher`; W `search-specialist` | `or` | `UNRESOLVED` |
| 4 | `data-engineer` | V `data-engineer`; W `data-engineer` | none | `RESOLVED_CANDIDATE` |
| 5 | `data-scientist` | V `data-scientist`; W `data-scientist`, `ml-engineer` | none | `RESOLVED_CANDIDATE` |
| 6 | `quant-analyst` | V/W `quant-analyst` | none | `RESOLVED_CANDIDATE` |
| 7 | `risk-manager` | V/W `risk-manager` | none | `RESOLVED_CANDIDATE` |
| 8 | `architect-reviewer` | V `architect-reviewer`, `codebase-orchestrator`; W `code-reviewer`, `database-architect` groups | `or`, `where`, duplicate W IDs | `UNRESOLVED` |
| 9 | `qa-expert` | V `qa-expert`; W `code-reviewer`, `test-automator` groups | duplicate W IDs | `UNRESOLVED` |
| 10 | `test-automator` | V `test-automator`; W `test-automator`, `tdd-orchestrator` groups | duplicate W IDs | `UNRESOLVED` |
| 11 | `documentation-engineer` | V `documentation-engineer`, `docs-researcher`; W `docs-architect` group | `or`, duplicate W IDs | `UNRESOLVED` |
| 12 | `git-workflow-manager` | V `git-workflow-manager`; W `deployment-engineer`, `devops-troubleshooter` groups | duplicate W IDs | `UNRESOLVED` |
| 13 | `pit-data-quality-reviewer` | V/W `data-scientist`, `data-engineer` | none | `RESOLVED_CANDIDATE` |
| 14 | `russia-market-regime-economist` | V `research-analyst`, `quant-analyst`; W `quant-analyst`, `business-analyst` | none | `RESOLVED_CANDIDATE` |
| 15 | `russia-ofz-rates-specialist` | V `quant-analyst`, `data-researcher`; W `quant-analyst`, `search-specialist` | `equivalent` | `UNRESOLVED` |
| 16 | `ios-quant-backtest-auditor` | V/W `quant-analyst`, `data-scientist` | none | `RESOLVED_CANDIDATE` |
| 17 | `market-regime-model-risk-reviewer` | V `model-risk-manager`, `risk-manager`, `quant-analyst`; W `risk-manager`, `quant-analyst` | `if available`, `otherwise` | `UNRESOLVED` |
| 18 | `historical-execution-simulator-reviewer` | V `quant-analyst`, `performance-engineer`; W corresponding profiles | duplicate W IDs | `UNRESOLVED` |
| 19 | `ios-agent-orchestrator` | V `agent-organizer`, `agent-installer`; W `conductor-validator` | non-ID workflow phrase | `UNRESOLVED` |
| 20 | `ios-codebase-auditor` | V `codebase-orchestrator`, `code-mapper`; W `code-reviewer` group, `c4-code` | `if available`, duplicate W IDs | `UNRESOLVED` |
| 21 | `apps-script-specialist` | V `typescript-pro`, `backend-developer`, `tooling-engineer`; W reviewer/deployment groups | slash/equivalent, duplicate W IDs | `UNRESOLVED` |
| 22 | `google-sheets-systems-reviewer` | V `data-analyst`, `qa-expert`; W `business-analyst`, `test-automator` group | duplicate W IDs | `UNRESOLVED` |
| 23 | `provider-integration-reviewer` | V `fintech-engineer`, `api-designer`; W `data-engineer`, deployment/API groups | duplicate W IDs | `UNRESOLVED` |
| 24 | `security-privacy-auditor` | V `security-auditor`, `compliance-auditor`; W security/code-review groups | duplicate W IDs | `UNRESOLVED` |
| 25 | `release-deployment-gatekeeper` | V deployment/devops/platform profiles; W deployment/troubleshooter groups | slash, duplicate W IDs | `UNRESOLVED` |
| 26 | `recovery-idempotency-reviewer` | V incident/chaos/error profiles; W incident/troubleshooter profiles | slash/equivalent, duplicate W IDs | `UNRESOLVED` |
| 27 | `audit-traceability-reviewer` | V `compliance-auditor`, `documentation-engineer`; W docs group, `business-analyst` | duplicate W IDs | `UNRESOLVED` |
| 28 | `agent-governance-auditor` | V governance/guardrail/eval profiles; W conductor/code-review group | slash/if available, duplicate W IDs | `UNRESOLVED` |
| 29 | `production-influence-gate-reviewer` | V model-risk/code-map/compliance profiles; W risk/code-review/quant profiles | slash, duplicate W IDs | `UNRESOLVED` |
| 30 | `data-schema-migration-reviewer` | V data/database profiles; W database/data profiles | slash, duplicate W IDs | `UNRESOLVED` |
| 31 | `performance-quota-reviewer` | V performance profiles; W performance/observability groups | duplicate W IDs | `UNRESOLVED` |
| 32 | `portfolio-construction-reviewer` | V/W `quant-analyst`, `risk-manager` | none | `RESOLVED_CANDIDATE` |
| 33 | `reserve-cash-management-reviewer` | V `risk-manager`, `quant-analyst`, `fintech-engineer`; W risk/quant profiles | none | `RESOLVED_CANDIDATE` |
| 34 | `fixed-income-bond-reviewer` | V `quant-analyst`, `fintech-engineer`; W `quant-analyst`, `data-scientist` | none | `RESOLVED_CANDIDATE` |
| 35 | `credit-risk-reviewer` | V `risk-manager`, `research-analyst`; W `risk-manager`, `business-analyst` | none | `RESOLVED_CANDIDATE` |
| 36 | `investment-universe-reviewer` | V research/risk/fintech profiles; W search/risk profiles | slash | `UNRESOLVED` |
| 37 | `liquidity-transaction-cost-reviewer` | V quant/performance; W quant/performance group | duplicate W IDs | `UNRESOLVED` |
| 38 | `performance-attribution-reviewer` | V/W `quant-analyst`, `data-scientist` | none | `RESOLVED_CANDIDATE` |
| 39 | `russia-investment-regulatory-tax-reviewer` | V legal/compliance/research; W legal/search | none | `RESOLVED_CANDIDATE` |
| 40 | `ui-ux-accessibility-reviewer` | V UI/accessibility; W code-review/test groups | duplicate W IDs | `UNRESOLVED` |
| 41 | `api-contract-documenter` | V API/docs research; W API group/reference builder | `or`, duplicate W IDs | `UNRESOLVED` |
| 42 | `dependency-supply-chain-reviewer` | V dependency/license/security; W security/deployment groups | duplicate W IDs | `UNRESOLVED` |
| 43 | `observability-diagnostics-reviewer` | V observability/performance; W observability group/incident | slash, duplicate W IDs | `UNRESOLVED` |
| 44 | `russian-technical-editor` | V `documentation-engineer`; W docs group, `reference-builder` | duplicate W IDs | `UNRESOLVED` |

## Duplicate wshobson profile groups

The ambiguous filenames map to distinct front-matter IDs and therefore cannot be selected by filename alone: `docs-architect` (2), `code-reviewer` (7), `database-architect` (2), `test-automator` (6), `tdd-orchestrator` (2), `deployment-engineer` (4), `devops-troubleshooter` (3), `api-documenter` (2), `security-auditor` (5), `observability-engineer` (2), `database-optimizer` (3), and `performance-engineer` (5).

## Required decision

For each `UNRESOLVED` row, a reviewed selection must replace every alternative/conditional phrase and duplicate filename with exact repository, exact path, front-matter profile ID and deterministic order. Only then are raw and normalized hashes recorded. No approximate profile has been created and no unresolved agent is activated.
