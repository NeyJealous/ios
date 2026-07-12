# CODEX-02 Account/Strategy Core Report

## Outcome

The single live account–strategy link was migrated from display-name identity to
Account ID / Strategy ID identity. Runtime link lookup is strict and no longer
falls back to Russian names.

## Evidence

- Google Sheets backup: created before migration, suffix `…lL1qrs`.
- Migration: `MIGRATION_APPLIED` under `LockService` with internal rollback.
- Link audit: `ok=true`, 0 errors, 0 warnings.
- Portfolio Health aggregate: `ok=true`, 1 current position, market value 10,204.
- Portfolio Health by account: `ok=true`, all 3 account reports available.
- Remote health: `ok=true`, 40 sheets, project version 1.1.0.
- Push: ordinary, 52 files, no `--force`.
- Round-trip: 52/52 exact normalized matches.
- Production deployments: unchanged.

## Identity contract

- Account ID is the identity key for accounts and Portfolio positions.
- Strategy ID is the identity key for strategies and account–strategy links.
- Account and strategy names are display fields in this link path.
- Missing, duplicate or dangling identifiers produce explicit errors.
- Technical identifiers remain hidden/masked in user-facing diagnostics.

## Scope guard

Decision Engine, Advisor, TradePlan, Reserve/Rebalance calculations, investment
formulas, target allocations, historical trades and operations were not changed.
CODEX-03 was not started.
