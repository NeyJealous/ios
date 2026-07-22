# Model availability report

Overall status: `PARTIAL_INSUFFICIENT_EVIDENCE`

Branch: `feature/agent-platform-v2-integration`
Repository HEAD at probe: `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da`
Probe timestamp: `2026-07-22T08:24:31.5074370Z`

| Requested exact slug | Resolved | Runtime smoke | Registry status | Trusted attestation |
|---|---|---|---|---|
| `gpt-5.6-terra` | `gpt-5.6-terra` | dispatch accepted; probe self-report insufficient | `AVAILABLE_CANDIDATE` | `INSUFFICIENT_EVIDENCE` |
| `gpt-5.6-sol` | `gpt-5.6-sol` | dispatch accepted; `MODEL_SMOKE_OK` | `AVAILABLE_CANDIDATE` | `INSUFFICIENT_EVIDENCE` |
| `gpt-5.6-luna` | — | runtime catalog entry absent; not dispatched | `MODEL_NOT_AVAILABLE` | `INSUFFICIENT_EVIDENCE` |
| `gpt-5.6-sol-pro` | — | runtime catalog entry absent; not dispatched | `MODEL_NOT_AVAILABLE` | `INSUFFICIENT_EVIDENCE` |

The model override runtime accepted exact Terra and Sol dispatch requests (`AgentThreadId=/root/terra_smoke` and `AgentThreadId=/root/sol_smoke`). This
is current-run availability evidence, not a signed external attestation. Terra
returned the conservative self-report `MODEL_SMOKE_INSUFFICIENT_EVIDENCE`; Sol
returned `MODEL_SMOKE_OK`. Neither response is promoted to trusted evidence by
repository text.

Luna was not replaced by Terra. Sol Pro was not replaced by Sol and was not
requested. Silent downgrade and substitution count are zero. Agents whose
primary or verdict-floor model is unavailable remain `MODEL_NOT_AVAILABLE` and
must not activate.
