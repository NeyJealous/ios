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

Base-owned verifier получает attestation через отдельный trusted input, а не ищет её внутри candidate tree. Он повторно связывает repository, branch, base/head SHA, execution ID/mode, independence, agent/profile/overlay, requested/resolved model, reasoning, execution times, result hash, issuer/audience/trust anchor и verifier key с ожидаемым execution plan. Owner-required policy выводится из trusted base state, а не из claim. Любое несовпадение даёт `INSUFFICIENT_EVIDENCE`.

Trusted expected plan сам является обязательным contract: отсутствие любого security-critical binding либо явного boolean `ownerApprovalRequired` считается ошибкой. Transport и issuer образуют фиксированную пару: `CODEX_RUNTIME_CHANNEL` только с `CODEX_RUNTIME_ATTESTER`, `GITHUB_OIDC_CHANNEL` только с `GITHUB_OIDC_VERIFIED`.

## Owner approval и independence

Owner approval — отдельная attestable decision. Repository-файл может хранить текст решения для audit trail, но trusted envelope должен ссылаться на внешний идентификатор решения и подтверждать actor/time/scope. Отсутствие approval при `required=true` блокирует verdict. Attestation не заменяет merge или deployment approval.

`INDEPENDENT` допустим только когда issuer подтверждает, что reviewer execution не является тем же процессом, который подготовил reviewed change. Role simulation, self-authored report и повторное название основной сессии не становятся `REAL_SUBAGENT`.

## Validation result

`tools/trusted-governance/attestation.mjs` отклоняет schema-valid spoofed claim, если transport происходит из repository/PR artifacts, а также stale SHA, несовпадение любого security-critical binding, expired/replayed envelope и неподтверждённый owner approval. Проверяются temporal order и ограниченный TTL. Replay key связывает issuer, attestation ID, nonce и envelope hash и должен храниться внешним durable replay store. Boolean `signatureVerified` недостаточен: обязательна внешняя cryptographic verifier callback относительно pinned issuer/key. Owner evidence требует внешний reference, actor, timestamp и scope.

В текущем repository отсутствуют runtime issuer, key discovery/rotation, signature verification service и GitHub OIDC canary evidence. Поэтому даже полностью связанный structurally valid envelope возвращает `INSUFFICIENT_EVIDENCE` с `TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED`; automatic dispatch не считается доверенно подтверждённым.
