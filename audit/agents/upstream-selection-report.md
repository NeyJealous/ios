# Upstream exact-selection report

Status: `PARTIAL_EXACT_SELECTION_OWNER_DECISIONS_REQUIRED`

## Pins and license

- `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2` — MIT.
- `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a` — MIT.

Both exact commits were checked out detached in a temporary research directory.
Their code was not executed. Profile files were read as data only; symlinks,
path escape and pin/license mismatch are rejected by the register builder.
The hardened validator reads exact Git blobs at each pinned commit, verifies
regular-file object modes, recomputes all profile IDs and raw/normalized hashes,
and verifies the MIT license bytes against separately recorded license hashes.
Missing source roots, missing blobs, symlink/submodule modes and modified
content fail closed. The catalog walk is separator-neutral on Windows/Linux.

## Result

| Status | Count |
|---|---:|
| `SELECTED` | 13 |
| `REQUIRES_OWNER_DECISION` | 31 |
| `UPSTREAM_PROFILE_NOT_FOUND` | 0 |

The machine-readable register contains, for every selected or candidate
component, exact repository, commit SHA, source path, actual profile ID, raw
SHA-256, normalized SHA-256 and license. Normalization is UTF-8 text with CRLF
converted to LF and Unicode NFC.

Pinned-blob verification result: `102` unique source paths verified, `0`
provenance errors. Upstream code and dependency lifecycle hooks were not run.

## Selected deterministic rows

`data-engineer`, `data-scientist`, `quant-analyst`, `risk-manager`,
`pit-data-quality-reviewer`, `russia-market-regime-economist`,
`ios-quant-backtest-auditor`, `portfolio-construction-reviewer`,
`reserve-cash-management-reviewer`, `fixed-income-bond-reviewer`,
`credit-risk-reviewer`, `performance-attribution-reviewer`,
`russia-investment-regulatory-tax-reviewer`.

These rows preserve the deterministic source order written in specification
section 19.2. `SELECTED` is provenance selection only; it is not profile
security acceptance, generation or activation.

## Explicitly blocked owner decisions

| IOS agent | Exact candidates recorded |
|---|---:|
| `data-researcher` | 2 |
| `research-analyst` | 5 |
| `search-specialist` | 3 |
| `architect-reviewer` | 11 |
| `qa-expert` | 14 |
| `test-automator` | 9 |
| `documentation-engineer` | 4 |
| `git-workflow-manager` | 8 |
| `russia-ofz-rates-specialist` | 4 |
| `market-regime-model-risk-reviewer` | 5 |
| `historical-execution-simulator-reviewer` | 8 |
| `ios-agent-orchestrator` | 3 |
| `ios-codebase-auditor` | 10 |
| `apps-script-specialist` | 14 |
| `google-sheets-systems-reviewer` | 9 |
| `provider-integration-reviewer` | 9 |
| `security-privacy-auditor` | 14 |
| `release-deployment-gatekeeper` | 10 |
| `recovery-idempotency-reviewer` | 7 |
| `audit-traceability-reviewer` | 5 |
| `agent-governance-auditor` | 11 |
| `production-influence-gate-reviewer` | 12 |
| `data-schema-migration-reviewer` | 8 |
| `performance-quota-reviewer` | 9 |
| `investment-universe-reviewer` | 6 |
| `liquidity-transaction-cost-reviewer` | 8 |
| `ui-ux-accessibility-reviewer` | 15 |
| `api-contract-documenter` | 5 |
| `dependency-supply-chain-reviewer` | 12 |
| `observability-diagnostics-reviewer` | 5 |
| `russian-technical-editor` | 4 |

Duplicate wshobson basenames remain separate exact paths with their distinct
front-matter profile IDs. No alternative was silently chosen. The former
`UNRESOLVED` state is replaced by explicit `REQUIRES_OWNER_DECISION`; all such
rows have an empty selected composition and cannot activate.

Two normative workflow phrases do not identify a profile at all:
`data-researcher` references a research workflow and `ios-agent-orchestrator`
references a multi-agent orchestration workflow. Exact surrounding profile
candidates are recorded, but these non-ID phrases remain explicit selection
gaps rather than being replaced by an invented profile.

## Activation boundary

`activationAllowed=false`. No `.codex/agents/**` profile was generated or
activated. Exact profile content security acceptance remains a later gate.
