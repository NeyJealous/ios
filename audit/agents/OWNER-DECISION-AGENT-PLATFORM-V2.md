# Owner Decision — Agent Platform v2 migration

## Статус

`AUTHORIZED_FOR_SAFETY_REMEDIATION`.

Решение разрешает подготовку RFC/draft ADR и Phase 1 safety remediation. Оно не принимает draft ADR, не разрешает раннее удаление старых профилей и не является CI-grade trusted attestation. До реализации trusted owner-attestation последнее имеет статус `INSUFFICIENT_EVIDENCE`.

## Нормативная база

- Master Specification v4.0 утверждена как authoritative audit baseline миграции.
- Master Specification v3.0 сохраняется как immutable historical baseline.
- Correction Memo сохраняется как historical evidence и superseded только там, где v4 явно включает или заменяет его положения.
- Agent Platform Specification v2.1 утверждена как целевая архитектура.
- Runtime/v4 расхождения фиксируются findings; утверждение baseline не означает implementation acceptance.

## Upstream и модели

Кандидатные pins: VoltAgent `5605c9c18b3687993919d6cc467af4a34898fee2`; wshobson `b6af3711058190e4b5c5274b9758498fe626ec5a`. Каждый profile требует отдельного exact selection и security acceptance. Неоднозначные alternatives остаются `UNRESOLVED` или `UPSTREAM_PROFILE_NOT_FOUND`.

Terra/Sol — `AVAILABLE_CANDIDATE_PENDING_SMOKE_TEST`; Luna/Sol Pro — `UNVERIFIED`. Silent substitution запрещён.

## Cutover gate

Старый слой может быть удалён только после PASS mixed-path, schemas, `NOT_AVAILABLE + PASS`, CRLF, add/delete/rename, non-agent validator и trusted anti-tamper checks. До этого active profiles не изменяются.

Safety invariants: production writes `0`; `clasp push` `0`; deployments `0`; Sheets writes `0`; broker/API writes `0`; Market Regime influence `CLOSED`; `AppliedMultiplier = 1.00`.
