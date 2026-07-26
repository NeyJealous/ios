# Runtime discovery blocker

The current client environment did not resolve the exact project-local type
`ios-agent-orchestrator`; the probe returned
`unknown agent_type 'ios-agent-orchestrator'`.

This establishes only
`PROJECT_LOCAL_AGENT_DISCOVERY_FAILED_IN_CURRENT_CLIENT_ENVIRONMENT`.
It does not establish a product-wide lack of project-local discovery support.

No simulation or generic agent type was substituted. No runtime smoke was
performed. Root cause is `ROOT_CAUSE_NOT_YET_ESTABLISHED`; investigation moves
to the clean-machine gate.

The tool catalog visible in this client contains built-in/default execution
roles and legacy reviewer adapters, but none of the five exact first-wave Agent
IDs. That catalog is environment evidence, not a durable runtime attestation.
