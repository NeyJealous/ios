# ADR-AGENT-PLATFORM-V2

- Статус: `DRAFT_NOT_ACCEPTED`
- Дата: 2026-07-18
- Связанный RFC: `rfc/RFC-AGENT-PLATFORM-V2.md`
- Owner authorization scope: Phase 1 remediation, explicit zero-agent cutover and Phase 3A preparation; ADR acceptance excluded
- Supersedes after acceptance: `adr/ADR-GLOBAL-AGENT-GOVERNANCE.md`

## Контекст

Прежний accepted ADR закрепляет гибридную 10-agent/Terra-only платформу. Audit выявил rewritten upstream bases, incomplete model/execution contracts, mixed-path fail-open defect и self-validating PR-head CI boundary. Target architecture v2.1 требует immutable supply chain, 44 provisional roles, resolver/orchestrator, trusted attestation and zero-agent transition.

## Draft decision

Phase 1 remediation, commit `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da` zero-agent cutover and Phase 3A governance design proceed under explicit scoped owner instructions, not under acceptance of this draft ADR. No new agent activation may rely on this draft, and later acceptance must not be represented as retrospective approval of unresolved work.

Предлагается принять трёхфазную миграцию из RFC-AGENT-PLATFORM-V2:

1. завершённая safety remediation;
2. завершённый owner-authorized controlled removal с сохранёнными external blockers;
3. Phase 3A governance prerequisites без generation/activation;
4. последующее создание v2 platform по отдельным reviewed waves с provisional-only status;
5. отдельный activation gate после принятия ADR и полного evidence.

Master Specification v4.0 становится authoritative audit baseline этой миграции. V3 и прежний ADR сохраняются исторически. Старый ADR считается superseded только после отдельного owner acceptance этого ADR.

Immutable repository sources and hashes are recorded in `specification/NORMATIVE-SOURCE-REGISTER.json`; Phase 3A authorization is recorded in `audit/agents/OWNER-DECISION-AGENT-PLATFORM-V2-PHASE-3A.md`. These references provide traceability but do not change this ADR status.

## Последствия

- Governance self-change проверяется base-pinned minimum validator и head validator.
- Zero-agent state не означает отсутствие safety enforcement.
- Ambiguous upstream selections блокируют конкретного агента.
- Недоступная mandatory model блокирует activation; silent downgrade отсутствует.
- REAL_SUBAGENT/model/owner claims без trusted transport получают `INSUFFICIENT_EVIDENCE` даже при schema-valid repository JSON.
- 31 ambiguous compositions остаются `REQUIRES_OWNER_DECISION`; 13 deterministic rows selected только на уровне provenance.
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
