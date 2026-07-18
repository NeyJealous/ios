# ADR-AGENT-PLATFORM-V2

- Статус: `DRAFT_NOT_ACCEPTED`
- Дата: 2026-07-18
- Связанный RFC: `rfc/RFC-AGENT-PLATFORM-V2.md`
- Owner authorization scope: preparation and remediation only
- Supersedes after acceptance: `adr/ADR-GLOBAL-AGENT-GOVERNANCE.md`

## Контекст

Прежний accepted ADR закрепляет гибридную 10-agent/Terra-only платформу. Audit выявил rewritten upstream bases, incomplete model/execution contracts, mixed-path fail-open defect и self-validating PR-head CI boundary. Target architecture v2.1 требует immutable supply chain, 44 provisional roles, resolver/orchestrator, trusted attestation and zero-agent transition.

## Draft decision

Предлагается принять трёхфазную миграцию из RFC-AGENT-PLATFORM-V2:

1. safety remediation при сохранении старых profiles;
2. controlled removal после PRE_REMOVAL PASS и наличия trusted verifier в canonical base;
3. создание v2 platform с provisional-only activation.

Master Specification v4.0 становится authoritative audit baseline этой миграции. V3 и прежний ADR сохраняются исторически. Старый ADR считается superseded только после отдельного owner acceptance этого ADR.

## Последствия

- Governance self-change проверяется base-pinned minimum validator и head validator.
- Zero-agent state не означает отсутствие safety enforcement.
- Ambiguous upstream selections блокируют конкретного агента.
- Недоступная mandatory model блокирует activation; silent downgrade отсутствует.
- REAL_SUBAGENT/model/owner claims без trusted evidence получают `INSUFFICIENT_EVIDENCE`.
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
