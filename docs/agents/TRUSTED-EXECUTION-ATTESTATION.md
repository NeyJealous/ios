# Trusted Execution Attestation

- Contract version: `1.0.0`
- Schema: `architecture/agents/schemas/execution-attestation.schema.json`
- Current availability: `INSUFFICIENT_EVIDENCE`

## Что подтверждается

Envelope связывает одну независимую execution с `agentId`, `REAL_SUBAGENT`, requested/resolved model, reasoning level, result hash, profile/overlay hashes, repository, branch, exact base/head SHA и owner approval, когда он обязателен.

Схема проверяет форму claim, но схема не создаёт доверие. Текст или JSON из PR, manifest, comment, report, branch либо рабочего дерева является только claim. Даже корректный `AgentThreadId`, `modelResolved` или `APPROVED` в таком файле не доказывает независимое исполнение.

## Trust boundary

Допустимы только два transport класса:

- `CODEX_RUNTIME_CHANNEL`: подписанный envelope от runtime attester, доставленный verifier вне candidate checkout;
- `GITHUB_OIDC_CHANNEL`: envelope, чей issuer/audience и signature проверены base-owned verifier относительно защищённого trust anchor.

Base-owned verifier получает attestation через отдельный trusted input, а не ищет её внутри candidate tree. Он повторно связывает repository, branch, base/head SHA, agent/profile/overlay/model и result hash с ожидаемым execution plan. Любое несовпадение даёт `INSUFFICIENT_EVIDENCE`.

## Owner approval и independence

Owner approval — отдельная attestable decision. Repository-файл может хранить текст решения для audit trail, но trusted envelope должен ссылаться на внешний идентификатор решения и подтверждать actor/time/scope. Отсутствие approval при `required=true` блокирует verdict. Attestation не заменяет merge или deployment approval.

`INDEPENDENT` допустим только когда issuer подтверждает, что reviewer execution не является тем же процессом, который подготовил reviewed change. Role simulation, self-authored report и повторное название основной сессии не становятся `REAL_SUBAGENT`.

## Validation result

`tools/trusted-governance/attestation.mjs` отклоняет schema-valid spoofed claim, если transport происходит из repository/PR artifacts, а также stale SHA, profile/overlay/model mismatch и неподтверждённый owner approval.

В текущем repository отсутствуют runtime issuer, key discovery/rotation, signature verification service и GitHub OIDC canary evidence. Поэтому текущий статус остаётся `INSUFFICIENT_EVIDENCE`; automatic dispatch не считается доверенно подтверждённым.
