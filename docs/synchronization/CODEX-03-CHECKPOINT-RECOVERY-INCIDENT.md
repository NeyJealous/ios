# CODEX-03 Checkpoint Recovery Incident

## Classification

`UNEXPECTED_API_CALL_DURING_LOCAL_STEP`

## Scope

Read-only validation performed before calling `TI_BatchSyncContinue`.
No synchronization entry point was invoked and Google Sheets was not changed by Codex during this validation.

## Expected checkpoint

- mode: `full`
- run ID suffix: `…f239c5`
- index: `21`
- completed steps: `21`
- API call count: `8`
- failed step: none
- Trades rows added by Full run 2: `0`

## Actual checkpoint

- mode: `full`
- run ID suffix: `…f239c5`
- status: `running`
- index: `26`
- completed steps: `26`
- current step: `portfolioIntelligence`
- API call count: `18`
- failed step: none
- errors: `0`
- Trades rows added by Full run 2: `0`
- fetched operations retained in state: `82`
- last checkpoint update: `2026-07-13T01:33:01.396Z`

## Observed drift

Between the saved checkpoints at `2026-07-13T01:22:26.056Z` and
`2026-07-13T01:33:01.396Z`, the same run advanced through:

- Tax;
- Rebalance;
- TradePlan;
- Decisions;
- Portfolio Health.

The index advanced from `21` to `26` and the accumulated API counter increased
from `8` to `18`. The completed API/history portion was not restarted, the run
ID did not change, and the Trades result still reports zero inserted rows.

## Safety decision

Continuation was stopped before any new write because the approved precondition
required `index=21` and `apiCallCount=8`. No checkpoint was edited manually, no
new Full run was created, and no rollback was attempted.

## Required decision

Do not continue from index 26 until the local derivation boundary is fixed and
the API guard records provider/step/timestamp details.

## Read-only checkpoint 26 validation

- run ID: matches Full run 2 (`…f239c5`);
- mode: `full`;
- checkpoint index: `26`;
- completed steps: `26`, including Tax, Rebalance, TradePlan, Decisions and Portfolio Health;
- next step: `portfolioIntelligence`;
- status: `running`;
- failed step: empty;
- errors: `0`;
- accumulated API calls: `18`;
- Full run 2 Trades rows added: `0`;
- Trades rows currently present: `166`;
- unique composite TradeKeys: `166`;
- duplicate composite TradeKeys: `0`;
- TradeKey conflicts: `0`;
- missing required trade IDs: `0`;
- Account/Strategy audit: `ok=true`;
- Portfolio positions: `2`;
- Portfolio Health aggregate test: `ok=true`;
- global ScriptLock: acquired and released by the read-only probe;
- remote health: `ok=true`;
- production deployments: `15`, unchanged;
- Google Sheets rollback detected: no;
- 13 user-confirmed production trades remain preserved.

The current implementation does not persist the history cursor or a full-mode
`dataRevision` in the checkpoint. Their exact historical values therefore cannot
be independently reconstructed at index 26. History integrity is instead
confirmed by the current composite-key audit and by `results.trades.rows=0`.

## API breakdown

### Before checkpoint 21

- index 1: `0` calls;
- index 4: `3` calls;
- index 12: `7` calls;
- index 20: `8` calls;
- index 21: `8` calls.

These calls belong to the already completed Full API/history/data-source steps.

### Between checkpoint 21 and 26

- accumulated increase: `10` calls;
- timestamp window: after `2026-07-13T01:22:26.056Z` and before
  `2026-07-13T01:33:01.396Z`;
- provider classification: `T_INVEST`;
- MOEX: `0` evidenced call sites;
- CBR: `0` evidenced call sites in Tax–Portfolio Health;
- GOOGLE_INTERNAL: not counted by `TI.SyncExecution.recordApi`;
- OTHER: `0` evidenced call sites.

The exact per-call timestamps were not persisted by this source version and
Cloud Logs cannot be queried through clasp because its GCP logging project is not
configured. The call source is nevertheless identified by the only counter
entry points and the static call graph:

1. `Rebalance.rebuild()` calls `Rebalance.calculate()`;
2. `TradePlan.rebuild()` calls `TradePlan.build()` and then `Rebalance.calculate()`;
3. `DecisionEngine.rebuild()` calls `TradePlan.build()` and then `Rebalance.calculate()`;
4. `PortfolioHealth.build()` resolves cash directly;
5. `PortfolioHealth` strategy-deviation calculation calls `Rebalance.calculate()`.

Each path reaches:

`Rebalance.cashByAccountName()` → `Accounts.cashByAccountName()` →
`Providers.users.getAccounts()` / `Providers.operations.getWithdrawLimits()` /
fallback `Providers.operations.getPositions()` → `Api.call()`.

The observed ten-call increase is consistent with two non-reused T-Invest cash
provider calls across each of the five local cash calculations. It is not a
carry-forward of pre-checkpoint metrics.

## Minimal fix plan

Proposed source scope: three files.

1. `Accounts.gs`
   - add a cached-only cash reader using existing DataCache entries and sheet-based
     account identities;
   - never invoke a provider loader in cached-only mode.
2. `Rebalance.gs`
   - use cached-only cash for no-API/local-derivation execution;
   - retain the existing online behavior for the approved API acquisition phase.
3. `SyncExecution.gs`
   - append masked API events containing timestamp, current step and provider class;
   - throw `UNEXPECTED_API_CALL_DURING_LOCAL_STEP` if a Full local derivation step
     attempts an external request.

Tests:

- cached cash equals the previously cached account totals;
- Tax/Rebalance/TradePlan/Decisions/Portfolio Health add zero API calls;
- provider attempt in a guarded local step fails before `UrlFetchApp.fetch`;
- existing Quick and Full acquisition paths remain allowed;
- checkpoint run ID, index, completed steps and accumulated metrics remain unchanged.

Rollback: revert only the future three-file fix commit and retain checkpoint 26;
do not restore or delete production history.

## Resolution

The three-file cached-only/API-guard fix was applied and pushed without `--force`.
Remote tests passed. The same Full run continued from index 26 and completed 32/32.
The API counter remained 18 and no telemetry events were recorded for steps 26–31.
Incident status: **RESOLVED**.
