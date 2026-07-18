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

`RESOLVED_CANDIDATE` means that the specification supplies one exact existing path for every component. It does not mean security acceptance or activation. Hashes below cover only sources used by those 13 deterministic candidate rows; hashing alternatives would not convert an ambiguous row into an exact decision.

## Exact source catalog for deterministic candidate rows

Normalization is UTF-8 text with CRLF converted to LF and Unicode NFC. `V` is VoltAgent at its pin; `W` is wshobson at its pin.

| Repository | Exact source path / profile ID | Raw SHA-256 | Normalized SHA-256 |
|---|---|---|---|
| V | `categories/05-data-ai/data-engineer.toml` / `data-engineer` | `f2032b659304bc256d028de17c9f5d43a4a2876e6c756b4a881b4714ab0d9013` | `27c0b33da2fd9f8e77c3aa2c4c2d008ffead08fd3e1ef29eb4afb28e6afbf8c0` |
| V | `categories/05-data-ai/data-scientist.toml` / `data-scientist` | `f7a7568f33bbde90ec8389e5c2769e0ec8a5c9484c87324975339415e865f13b` | `ceba8501918192a6d1fe9999fb76396f7ed0f7f83c1e797e75ad96a3011e378b` |
| V | `categories/07-specialized-domains/quant-analyst.toml` / `quant-analyst` | `fe4e1923a47948e9e1313fa50c78bc2ab49510e8fe22a24a0a37f9a008b7d3c6` | `142fe7804d76b1660581f17321298d435366181e1624f1af061e801787755c01` |
| V | `categories/07-specialized-domains/risk-manager.toml` / `risk-manager` | `00904c7f2956cb20a27bdcf4651b2abdfc85c9bebc4eb36fdcd86ea26049e04f` | `3af983e3711546723bdce49af016b1ce67e9043bb3a360ffb69495c326e72ad6` |
| V | `categories/07-specialized-domains/fintech-engineer.toml` / `fintech-engineer` | `9557645c2468ab496761c6bba483f9ab73bdba7a34cdd0d858336ae25a238e2b` | `7f5226e4279e0235a29524375edf2623c945113fd4239cbeeb874eb2c2639f9f` |
| V | `categories/10-research-analysis/research-analyst.toml` / `research-analyst` | `56490841f300fc1b901db2bd3b80b6f1b83197f0fbe344895224504d32537c2c` | `c9438da69e17cf332d27ff8d8f12e78951cd15bf15e2692be01230c2a7b06f91` |
| V | `categories/08-business-product/legal-advisor.toml` / `legal-advisor` | `470715411c18bb0d57ff4a1bdbeb5921c989f79fb1aa8075f2cf0574bb532897` | `4152a67c3accb779ae2a8a2fbf24dadd9f445eacfc0a8073c905f4a10a2420b4` |
| V | `categories/04-quality-security/compliance-auditor.toml` / `compliance-auditor` | `a5cb0490ac902a3ce963d14d7c83ff2c84763a1226b9bdc662c2ed6616268fdf` | `f4def31cb3fab54036b8d4b365e38637379e5f7191b3caa01ba9e50d92dba809` |
| W | `plugins/data-engineering/agents/data-engineer.md` / `data-engineer` | `3c24e3bca702cf6852b5e68630e13a4445291f6ec4270a139c46021c4871af75` | `c88021cb4b2e2e432cb5df36d90db46e872fa7d28c64d10aad7b4c4334683ab6` |
| W | `plugins/machine-learning-ops/agents/data-scientist.md` / `data-scientist` | `c6a48912df048edb1cc523496fcd7aaf4c45f5782ea1b4b5dd11c4a1f92bdd3c` | `ded3aca731f61a47d2bfc95ae3033abf364d1e30a142736b99e993e65817bf3d` |
| W | `plugins/machine-learning-ops/agents/ml-engineer.md` / `ml-engineer` | `02caf151ab2b867cd3753bbd2450cf997928d6d34b123118ef45b1300f25305e` | `604a856602fe59fb3656db554ff0ba6d097c91e22f16fdd70b3e3c1226487285` |
| W | `plugins/quantitative-trading/agents/quant-analyst.md` / `quant-analyst` | `80679ddc682a7add71820cbbb55a0eafc98c6c07123a41495f6b3c2e052eaef0` | `0ebcad2d24557e93e75e63fb980ca553382b6ee3f9bb8d1bf263ab5f98f5e766` |
| W | `plugins/quantitative-trading/agents/risk-manager.md` / `risk-manager` | `70d5cd5ceacf9c18f16eab000c4d2ee6664a91f29ec3e569206f8d4b0723c735` | `d49de27acde3d03bb350d1c2b6795829172b0954a29d46bc69b466d9c586dd1c` |
| W | `plugins/business-analytics/agents/business-analyst.md` / `business-analyst` | `cded4745dcfb236f018736ab669524a77f624f30dfd154ace823795b7df0bd69` | `c9803de647add89642afcee05ec27c7ab1e1736fb2586990010efbad6b76ca7a` |
| W | `plugins/hr-legal-compliance/agents/legal-advisor.md` / `legal-advisor` | `312e3c62757ea39792c1c0fafcc7cf86b9bd01901a5a4541e21b516222586e3d` | `20082d2cd2b80fd761f48c8cb1629f553463758e33f1d7c689db30ef909a1ab6` |
| W | `plugins/content-marketing/agents/search-specialist.md` / `search-specialist` | `29a9d15badc2f2cdaf1ab38e8247df28c0df21a5cae333ecb60280126a4d5973` | `d74f9e7d3368d74672a24968e6e0e11e7ef050c88214554ef9fefec7cb3a999c` |

## Deterministic candidate composition order

The 13 candidate rows use the source order written in specification §19.2:

- `data-engineer`: V data-engineer → W data-engineer.
- `data-scientist`: V data-scientist → W data-scientist → W ml-engineer.
- `quant-analyst`: V quant-analyst → W quant-analyst.
- `risk-manager`: V risk-manager → W risk-manager.
- `pit-data-quality-reviewer`: V data-scientist → V data-engineer → W data-scientist → W data-engineer.
- `russia-market-regime-economist`: V research-analyst → V quant-analyst → W quant-analyst → W business-analyst.
- `ios-quant-backtest-auditor`: V quant-analyst → V data-scientist → W quant-analyst → W data-scientist.
- `portfolio-construction-reviewer`: V quant-analyst → V risk-manager → W quant-analyst → W risk-manager.
- `reserve-cash-management-reviewer`: V risk-manager → V quant-analyst → V fintech-engineer → W risk-manager → W quant-analyst.
- `fixed-income-bond-reviewer`: V quant-analyst → V fintech-engineer → W quant-analyst → W data-scientist.
- `credit-risk-reviewer`: V risk-manager → V research-analyst → W risk-manager → W business-analyst.
- `performance-attribution-reviewer`: V quant-analyst → V data-scientist → W quant-analyst → W data-scientist.
- `russia-investment-regulatory-tax-reviewer`: V legal-advisor → V compliance-auditor → V research-analyst → W legal-advisor → W search-specialist.

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
