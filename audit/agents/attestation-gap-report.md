# Trusted attestation gap report

Status: `INSUFFICIENT_EVIDENCE`

## Materialized contract

- Versioned JSON Schema связывает execution/model/profile/overlay/base/head, owner approval и independence.
- Base-owned evaluator отделяет schema validity от trusted transport.
- Spoofed PR-authored envelope и binding mismatches покрыты negative tests.

## Remaining trust gaps

1. Нет внешнего runtime attester с документированным issuer/audience.
2. Нет trust-anchor/key discovery, rotation и revocation contract.
3. Нет защищённого delivery channel вне candidate checkout.
4. Нет GitHub OIDC canary, подтверждающего issuer/repository/ref bindings.
5. Нет trusted owner-decision provider и scope binding.
6. Нет trusted token/cost/model telemetry provider.

Наличие schema-valid JSON в PR не закрывает ни один из этих gaps. До внешней реализации каждый `REAL_SUBAGENT`, model-used, owner-approval и independence claim получает `INSUFFICIENT_EVIDENCE`.
