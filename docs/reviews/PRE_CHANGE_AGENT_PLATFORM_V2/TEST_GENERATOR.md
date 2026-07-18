# Test Generator — PRE_CHANGE_AGENT_PLATFORM_V2

- ExecutionMode: `REAL_SUBAGENT`
- AgentThreadId: `/root/prechange_tests`
- Reviewed SHA: `d2d60713e580fa1bcce8ba874216619598094093`
- Status: `FAIL`
- Severity: `CRITICAL`

Baseline: 30 tests passed, 1 failed. Mixed known+unknown diff не переводит Resolver в fail-closed. Отсутствуют полная schema validation, блокировка `NOT_AVAILABLE + PASS`, end-to-end rename/delete/add и clean-machine coverage.
