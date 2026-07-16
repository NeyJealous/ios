# CRITICAL ACTIVE INFLUENCE RISK — Rule R030

## Status

- Severity: CRITICAL
- Status: OPEN
- Source: CODEX-06-PRE final audit
- AppliedMultiplier production status: `NOT_APPROVED`

## Risk

The legacy Market Regime multiplier can exceed `1` and may influence purchase
priority through Decision Engine / Rule R030.

## Relationship to CODEX-04B

- The risk was not created by CODEX-04B.
- CODEX-04B did not change Market Regime, the multiplier, Decision Engine,
  Rule R030 or TradePlan.
- The local CODEX-04B integration does not activate or remediate this behavior.

## Gate

CODEX-06A is blocked until a separately authorized remediation gate:

1. removes or safely constrains the active legacy influence;
2. proves Decision Engine and Rule R030 behavior with regression tests;
3. receives explicit approval for AppliedMultiplier production behavior.

This integration gate records the risk but does not fix it.
