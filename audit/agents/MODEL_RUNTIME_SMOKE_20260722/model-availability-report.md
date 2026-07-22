# Model availability report — actual Codex runtime smoke

Overall status: `RUNTIME_SMOKE_COMPLETE_WITH_UNAVAILABLE_MODELS`

Probe window: `2026-07-22T19:22:45.0881997Z` — `2026-07-22T19:24:50.2278672Z`
Repository HEAD at probe: `a744cbd8d4139b9a65c4d755b467767127b03117`

| Platform model | Requested | Resolved | Result | Provider/execution response | Observed latency | Agent runtime use |
|---|---|---|---|---|---:|---|
| Terra | `gpt-5.6-terra`, `medium` | `gpt-5.6-terra`, `medium` | `SUCCESS` | dispatch `/root/runtime_smoke_terra`; exact nonce response received | 23,884 ms | yes |
| Luna | `gpt-5.6-luna`, `medium` | — | `FAILURE` | provider response: `Unknown model gpt-5.6-luna for spawn_agent`; no execution created | 17,259 ms | no |
| Sol | `gpt-5.6-sol`, `high` | `gpt-5.6-sol`, `high` | `SUCCESS` | dispatch `/root/runtime_smoke_sol`; exact nonce response received | 24,721 ms | yes |
| Sol Ultra | `gpt-5.6-sol`, `ultra` | `gpt-5.6-sol`, `ultra` | `SUCCESS` | dispatch `/root/runtime_smoke_sol_ultra`; exact nonce response received | 30,486 ms | yes |

Statuses above are derived only from the four actual Codex runtime requests and their responses. Capability lists, UI and documentation were not used to assign availability.

Latency is end-to-end UTC wall-clock between the timestamp immediately before the runtime request and the timestamp after execution completion/provider rejection. It includes orchestration and timestamp-call overhead and is therefore an observed upper-bound, not pure model inference latency.

No substitution occurred. Luna was not replaced by Terra. `Sol Ultra` is the successfully executed `gpt-5.6-sol` runtime request with reasoning level `ultra`; it is not represented as a separate untested slug.

Runtime usability is separate from platform activation. All four records retain `platformActivationEligible=false` because the external signed attestation boundary remains unavailable; this does not change the actual runtime availability result.
