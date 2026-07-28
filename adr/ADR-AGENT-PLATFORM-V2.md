# ADR-AGENT-PLATFORM-V2

> Historical architecture. Target decisions are superseded by
> `ADR-SOURCE-AUTHORED-IOS-AGENT-PROFILES.md` after owner acceptance.
> Retained for traceability; not a current implementation contract.

- Статус: `DRAFT_NOT_ACCEPTED`
- Дата: 2026-07-18
- Связанный RFC: `rfc/RFC-AGENT-PLATFORM-V2.md`
- Owner authorization scope: Phase 1 remediation, explicit zero-agent cutover, Phase 3A and Phase 3B provisional first-wave build; ADR acceptance excluded
- Supersedes after acceptance: `adr/ADR-GLOBAL-AGENT-GOVERNANCE.md`

## Контекст

Прежний accepted ADR закрепляет гибридную 10-agent/Terra-only платформу. Audit выявил rewritten upstream bases, incomplete model/execution contracts, mixed-path fail-open defect и self-validating PR-head CI boundary. Target architecture v2.1 требует immutable supply chain, 44 provisional roles, resolver/orchestrator, trusted attestation and zero-agent transition.

## Draft decision

Phase 1 remediation, commit `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da` zero-agent cutover and Phase 3A governance design proceed under explicit scoped owner instructions, not under acceptance of this draft ADR. No new agent activation may rely on this draft, and later acceptance must not be represented as retrospective approval of unresolved work.

Предлагается принять трёхфазную миграцию из RFC-AGENT-PLATFORM-V2:

1. завершённая safety remediation;
2. завершённый owner-authorized controlled removal с сохранёнными external blockers;
3. Phase 3A governance prerequisites;
4. owner-authorized Phase 3B `PROVISIONAL BUILD`: immutable snapshots, append-only overlays, five generated staging profiles, Registry/Matrix/Resolver, orchestration configuration, offline bootstrap и tests;
5. Phase 3C `TRUSTED RUNTIME ACTIVATION`: только после accepted ADR, trusted external evidence, GitHub enforcement и отдельного owner activation decision.

Master Specification v4.0 становится authoritative audit baseline этой миграции. V3 и прежний ADR сохраняются исторически. Старый ADR считается superseded только после отдельного owner acceptance этого ADR.

Immutable repository sources and hashes are recorded in `specification/NORMATIVE-SOURCE-REGISTER.json`; Phase 3A authorization is recorded in `audit/agents/OWNER-DECISION-AGENT-PLATFORM-V2-PHASE-3A.md`. These references provide traceability but do not change this ADR status.

## Последствия

- Governance self-change проверяется base-pinned minimum validator и head validator.
- Zero-agent state не означает отсутствие safety enforcement.
- Ambiguous upstream selections блокируют конкретного агента.
- Недоступная mandatory model блокирует activation; silent downgrade отсутствует.
- REAL_SUBAGENT/model/owner claims без trusted transport получают `INSUFFICIENT_EVIDENCE` даже при schema-valid repository JSON.
- 26 ambiguous compositions остаются `REQUIRES_OWNER_DECISION`; 18 rows имеют exact `SELECTED`, включая пять owner-approved first-wave compositions.
- Five generated profiles remain `PROVISIONAL` under `architecture/agents/generated/provisional/`; `.codex/agents/` contains no first-wave platform profiles, active agents=0, activation gate=`CLOSED`, runtime dispatch=`NOT_DISPATCHED_ACTIVATION_CLOSED`.
- Capability contracts are locally validated deny-by-default declarations; actual tool/network/MCP enforcement remains `RUNTIME_ENFORCEMENT_UNVERIFIED`.
- Текущий owner-declared runtime model set: Terra, Luna, Sol и Sol Ultra. Фактический smoke подтверждает Terra/Sol/Sol Ultra как `RUNTIME_AVAILABLE`, Luna как `MODEL_NOT_AVAILABLE`; substitution отсутствует. Sol Ultra — `gpt-5.6-sol` с reasoning `ultra`. Все модели остаются `platformActivationEligible=false` до trusted attestation. Это draft policy text и не меняет статус ADR `DRAFT_NOT_ACCEPTED`.
- Runtime IOS, Apps Script, Sheets и production не меняются.

## Acceptance conditions

Этот ADR нельзя помечать `ACCEPTED`, пока:

- RFC не согласован полностью;
- Phase 1 CRITICAL/HIGH remediation не имеет PASS;
- exact-selection register не завершён и не reviewed;
- anti-tamper boundary не подтверждена;
- owner не подтвердил итоговый текст ADR отдельным решением.

## Текущий verdict

`DRAFT_NOT_ACCEPTED`. Этот файл не является owner approval, merge approval, deployment approval или production-write authorization.
