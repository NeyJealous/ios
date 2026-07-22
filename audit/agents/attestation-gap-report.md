# Trusted attestation gap report

Status: `INSUFFICIENT_EVIDENCE`

## Materialized contract

- Versioned JSON Schema связывает execution/model/profile/overlay/base/head, owner approval и independence.
- Base-owned evaluator отделяет schema validity от trusted transport.
- Evaluator связывает execution ID/mode, issuer/audience/trust anchor, reasoning/times/result, owner policy и verifier key с trusted expected state.
- Trusted expected plan обязан содержать каждый binding, explicit owner-policy boolean и TTL; отсутствие любого поля fail-closed. Transport/issuer пары фиксированы.
- JSON Schema runtime применяет используемые `format`, `maxLength`, `allOf`, `if` и `then`.
- Boolean signature claim недостаточен: требуется внешний cryptographic verifier; replay key включает issuer, attestation ID, nonce и envelope hash.
- Spoofed PR-authored envelope, binding mismatches, invalid schema semantics, TTL/temporal order и replay покрыты negative tests.

## Remaining trust gaps

1. Нет внешнего runtime attester с документированным issuer/audience.
2. Нет trust-anchor/key discovery, rotation и revocation contract.
3. Нет защищённого delivery channel вне candidate checkout.
4. Нет GitHub OIDC canary, подтверждающего issuer/repository/ref bindings.
5. Нет trusted owner-decision provider и scope binding.
6. Нет trusted token/cost/model telemetry provider.
7. Нет durable replay store, cryptographic key service и реально проверенного signed envelope.

Наличие schema-valid JSON в PR не закрывает ни один из этих gaps. До внешней реализации каждый `REAL_SUBAGENT`, model-used, owner-approval и independence claim получает `INSUFFICIENT_EVIDENCE`.
