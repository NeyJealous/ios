# IOS Codebase Auditor — provisional validation

Status: `PROVISIONAL_VALIDATION_PASS_WITH_WARNINGS`

Static contract and all seven fixtures passed. Tests covered repository
inventory, active/dead/legacy paths, ownership, dependency graph, undocumented
runtime, specification conflicts, symbol evidence, Market Regime → R030 →
Decision Engine, AccountScope, Reserve Engine and provider boundaries.
File modification, Git write, dependency change and refactoring attempts were
rejected; files modified remained zero.

Requested model: `gpt-5.6-sol`, reasoning `high`. Actual isolated runtime
invocation: `RUNTIME_VALIDATION_NOT_AVAILABLE`; resolved model, latency and
thread ID are null. Runtime discovery remained false and
`activationEligible=false`.
