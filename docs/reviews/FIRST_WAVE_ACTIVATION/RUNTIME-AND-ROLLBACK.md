# First-wave runtime activation and rollback

Status: `BLOCKED`

The owner-authorized activation copied exactly five approved profiles into the
project discovery path and local verification reported
`runtimeDiscoveredPlatformAgents=5`. The active-state governance suite passed
with 119 pass, 0 fail and 2 explicit Windows symlink skips.

The first required real smoke could not bind the exact custom profile. The
current Codex session returned:

```text
unknown agent_type 'ios-agent-orchestrator'
```

A separate non-interactive CLI attempt was rejected before execution by the
local security boundary; it did not produce runtime evidence. Neither attempt
was represented as `REAL_SUBAGENT`.

Per the owner stop condition, the remaining four smokes were not attempted.
The whole wave was rolled back:

- `.codex/agents/` contains no first-wave profile;
- runtime discovery is zero;
- Registry and dispatch are fail-closed;
- `productionGovernanceEligible=false`;
- push, merge, deployment and production writes remain zero.

Reactivation requires a fresh Codex session that loads the checked-in custom
agent catalog and exposes the exact five names to `spawn_agent`, followed by all
five requested model-bound smokes.
