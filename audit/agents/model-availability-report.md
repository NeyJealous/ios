# Agent model availability report

Status: `PARTIAL — TRUSTED_ATTESTATION_INSUFFICIENT_EVIDENCE`

Date: 2026-07-18
Gate: `PRE_REMOVAL_AGENT_PLATFORM_V2`

## Results

| Configured model | Runtime result | Evidence | Activation effect |
|---|---|---|---|
| `gpt-5.6-terra` | `AVAILABLE_RUNTIME_EVIDENCE` | `REAL_SUBAGENT`, `/root/model_smoke_terra`, nonce `IOS_MODEL_SMOKE_TERRA_20260718` | Candidate may proceed to contract review. |
| `gpt-5.6-sol` | `AVAILABLE_RUNTIME_EVIDENCE` | `REAL_SUBAGENT`, `/root/model_smoke_sol`, nonce `IOS_MODEL_SMOKE_SOL_20260718` | Candidate may proceed to contract review. |
| `gpt-5.6-luna` | `UNVERIFIED` | Exact slug is not exposed by the current spawn interface. | Mandatory Luna roles remain `MODEL_NOT_AVAILABLE`. |
| `gpt-5.6-sol-pro` | `UNVERIFIED` | Exact slug is not exposed by the current spawn interface. | No Sol substitution; owner and budget approval remain required. |

Silent downgrade is disabled. No model was substituted. These smoke results are evidence from the current Codex execution, but repository-authored text is not a trusted external model attestation. The attestation gap therefore remains `INSUFFICIENT_EVIDENCE`.
