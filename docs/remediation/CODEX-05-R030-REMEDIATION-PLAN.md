# CODEX-05 R030 Remediation Plan

## 1. Purpose

Eliminate the production-active path by which a legacy Market Regime
multiplier greater than `1.0` can increase buy priority before that influence
has been explicitly approved.

Known influence path:

```text
Market Regime
  -> legacy multiplier
  -> Decision Engine calculation context
  -> Rule R030 buy priority
  -> TradePlan recommendation/action
```

Current safety state:

```text
CRITICAL_ACTIVE_INFLUENCE_RISK = OPEN
AppliedMultiplier = NOT_APPROVED
CODEX-06A = BLOCKED
```

CODEX-05 must not approve Market Regime trading influence implicitly. Its job
is to make the existing production behavior safe and auditable while retaining
informational and preview capabilities.

## 2. Scope boundaries

In scope:

- trace every source, transformation, cache, calculation, rule, wrapper, and
  trigger that can carry Market Regime multiplier data into an executable or
  user-visible recommendation;
- introduce one canonical approval gate for production influence;
- enforce a neutral production fallback of `1.0` while status is not
  `APPROVED`;
- preserve raw/informational regime values for diagnostics and preview;
- test Decision Engine, Rule R030, Advisor, Decisions, Rebalance, and TradePlan
  consumers;
- provide preview, controlled apply, rollback, and production validation.

Out of scope until separately approved:

- enabling Market Regime influence on real recommendations;
- changing the Market Regime model or thresholds;
- changing portfolio strategy or target allocation semantics;
- executing real trades;
- starting CODEX-06A.

## 3. Gate 1 — read-only production-active trace

Audit all entry points and consumers, including:

1. Market Regime calculation and persistence.
2. Legacy multiplier derivation and defaulting.
3. Settings, cache, facts, features, and diagnostic transport.
4. Decision Engine context construction.
5. Rule Engine dispatch and Rule R030 evaluation.
6. Rebalance, Decisions, Advisor, and TradePlan generation.
7. Quick, Full, Recalc, triggers, menu wrappers, and maintenance paths.
8. Preview versus executable action boundaries.

For every path record source field, semantic owner, approval status, fallback,
consumer, production activity, and test coverage. Full identifiers and private
production data remain masked.

Deliverables:

- production-active data-flow map;
- reference inventory;
- risk register;
- exact proposed source write set;
- zero-write production snapshot.

## 4. Canonical hard gate

Introduce or adapt one canonical decision function. The precise name is chosen
after the audit, but its contract must be equivalent to:

```javascript
getEffectiveAppliedMultiplier(context)
```

Required behavior:

```text
status === APPROVED
  -> validated approved multiplier

status !== APPROVED
unknown / invalid / missing status
  -> 1.0
```

Additional requirements:

- production consumers cannot read the legacy raw multiplier directly;
- unknown status fails closed;
- invalid, non-finite, zero, negative, or out-of-policy values resolve to
  `1.0` plus masked diagnostics;
- approval is explicit, versioned, attributable, and auditable;
- no display name, sheet row number, or implicit legacy default acts as a key;
- preview and informational code cannot silently become executable context.

## 5. Informational and preview mode

Preserve Market Regime information without production influence:

- raw regime and raw multiplier may be displayed as informational values;
- preview may calculate hypothetical priority changes;
- preview must label the result `NOT_APPLIED`;
- preview performs no broker API calls and no production writes;
- preview output must distinguish raw, approved, and effective multiplier;
- Decision, Advisor, and TradePlan execution use only the effective gated
  value.

## 6. Tests

### Unit tests

1. `NOT_APPROVED` returns exactly `1.0`.
2. Missing or unknown status returns `1.0`.
3. Invalid multiplier returns `1.0` and a diagnostic.
4. A raw multiplier greater than `1.0` cannot affect Rule R030 while not
   approved.
5. Preview retains the raw value but marks it not applied.
6. Direct legacy-field access by production consumers is detected.

### Integration tests

1. Decision Engine produces identical executable output for raw multipliers
   `1.0` and greater than `1.0` while status is not approved.
2. Rule R030 priority remains neutral under `NOT_APPROVED`.
3. Advisor and TradePlan do not gain new actions from the legacy multiplier.
4. Recalc remains zero-API for this validation.
5. Quick and Full sync behavior is unchanged.
6. Account Scope semantics remain unchanged.

### Regression and safety tests

1. Existing TradePlan executable-row guards remain PASS.
2. Decision safety and duplicate checks remain PASS.
3. Portfolio reconciliation and Portfolio Health remain PASS.
4. Remote Health and round-trip remain PASS.
5. Privacy remains PASS.
6. Deployments remain unchanged unless a separate deployment gate approves a
   change.

## 7. Read-only production preview

Before any runtime push or production write, produce a JSON-safe preview that
shows:

- every affected source and consumer;
- raw multiplier;
- approval status;
- effective multiplier (`1.0` while not approved);
- changed Rule R030 evaluations;
- changed Decisions, Advisor, and TradePlan rows;
- expected source write set;
- broker API calls: 0;
- production writes: 0;
- rollback source and revision.

The preview must demonstrate that neutralization removes only unapproved
priority influence and does not suppress unrelated Decision Engine rules.

## 8. Controlled apply gate

Implementation and production activation require a separate explicit approval.
The controlled gate must include:

1. clean canonical baseline and isolated feature worktree;
2. source backup and exact hashes;
3. local contract/regression PASS;
4. ordinary `clasp push`, never `--force`;
5. no production deployment change;
6. zero-API Recalc preview;
7. remote contract and health validation;
8. exact before/after Decision and TradePlan evidence;
9. idempotency validation;
10. separate acceptance and integration decisions.

No status transition to `APPROVED` is part of the neutralization apply gate.

## 9. Rollback

Rollback must be scoped to CODEX-05 source/config changes:

- restore the previous source revision from the recorded commit and hashes;
- restore only changed approval/gate configuration;
- do not restore or mutate account archives, trades, portfolio, or cache;
- do not change Market Regime model data;
- repeat zero-API preview and remote validation;
- record incident, Run ID, before/after revisions, and rollback result.

Rollback is mandatory if:

- effective multiplier differs from `1.0` while not approved;
- a production consumer bypasses the canonical gate;
- Rule R030 or TradePlan gains an action from an unapproved multiplier;
- Recalc invokes broker API calls;
- Account Scope or unrelated decision rules change;
- round-trip, privacy, or Remote Health fails.

## 10. Definition of Done

CODEX-05 is complete only when:

- every production-active multiplier entry point is documented;
- all executable consumers use one canonical approval gate;
- `NOT_APPROVED`, missing, invalid, and unknown states produce effective
  multiplier `1.0`;
- raw regime information remains available only in informational/preview mode;
- Rule R030, Decisions, Advisor, and TradePlan cannot be influenced by an
  unapproved multiplier;
- local, remote, regression, privacy, health, and round-trip checks pass;
- production preview reports API calls `0` and writes `0`;
- controlled apply and rollback evidence are accepted;
- AppliedMultiplier remains `NOT_APPROVED` unless a later independent approval
  explicitly changes it;
- a separate readiness decision explicitly unblocks or keeps CODEX-06A
  blocked.

## 11. Required next authorization

The next gate may begin only after explicit permission to create an isolated
CODEX-05 worktree and perform the read-only production-active trace. That
permission does not authorize runtime changes, `clasp push`, production writes,
or approval of AppliedMultiplier.

## 12. CONNECTION RECOVERY CHECK

Этот раздел меняет только Git/GitHub workflow CODEX-05 и не расширяет его
функциональный scope.

Перед branch push:

1. Создать `GIT_PUSH` operation и checkpoint.
2. Получить pre-write guard PASS для точных branch/commit/target.
3. Выполнить push ровно один раз.
4. Read-only проверить remote branch SHA; только точное совпадение даёт
   `PUSH_COMPLETED`. Timeout/mismatch даёт `UNKNOWN`, повтор запрещён.

Перед PR create:

1. Read-only найти PR по точным head/base.
2. Один существующий PR классифицировать `PR_CREATED` и не создавать второй.
3. Несколько совпадений либо недоступный status дают `UNKNOWN` и stop.
4. При доказанном отсутствии выполнить одну `PR_CREATE` operation и verify.

Перед merge:

1. Merge запрещён без отдельного разрешения пользователя.
2. После разрешения создать `PR_MERGE` operation и выполнить merge один раз.
3. Только GitHub `state=MERGED` с merge commit даёт `MERGED`.
4. После timeout merge не повторять; выполнить disconnect handler/read-only
   verification, при `UNKNOWN` остановиться.

`clasp push` в рамках этого workflow остаётся запрещён.

Дополнение к Definition of Done: unresolved `UNKNOWN` = 0, все remote writes
verified, checkpoints closed, duplicate PR/push/deployment = 0, production
writes явно посчитаны.
