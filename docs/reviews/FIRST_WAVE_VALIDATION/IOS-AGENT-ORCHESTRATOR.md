# IOS Agent Orchestrator — provisional validation

Status: `PROVISIONAL_VALIDATION_PASS_WITH_WARNINGS`

Static contract and all seven fixtures passed. Deterministic DAG, mandatory
versus advisory separation, unavailable-agent blocking, cycle detection,
self-review rejection, PRE_CHANGE/POST_CHANGE recalculation, activation denial
and production-write denial were covered.

Requested model: `gpt-5.6-terra`, reasoning `medium`. Actual isolated runtime
invocation: `RUNTIME_VALIDATION_NOT_AVAILABLE`; resolved model, latency and
thread ID are null. No simulation is counted. Runtime discovery remained false
and `activationEligible=false`.
