# Trusted Governance Verifier

- Статус дизайна: `IMPLEMENTED_LOCALLY_AWAITING_EXTERNAL_EVIDENCE`
- Итоговый governance gate: `BLOCKED`
- Trust boundary: immutable PR base checkout under `pull_request_target`
- Required check context: `trusted-agent-governance`

## Выбранная архитектура

Workflow `.github/workflows/trusted-agent-governance.yml` запускается только для
PR в `integration/ios-current` через `pull_request_target` с permission
`contents: read`. Он получает два независимых checkout:

1. `trusted-base` закреплён на exact `github.event.pull_request.base.sha`;
2. `candidate` закреплён на exact `github.event.pull_request.head.sha` и
   рассматривается исключительно как недоверенный набор данных.

Исполняется только
`trusted-base/tools/trusted-governance/validate.mjs`. Candidate scripts,
dependencies, hooks, actions, package lifecycle и downloaded code не
исполняются и не импортируются. Git запускается с отключёнными hooks. Base и
candidate registry/matrix проверяются схемами из base; обязательные controls
образуются по stricter-union policy floor и base/head Resolver results.

Verifier проверяет exact SHA, Git index modes, path normalization, Unicode/case
collisions, path traversal, symlinks, submodules, input size, schema validity,
manifest freshness и zero-agent fail-closed state. Изменение trust-root paths
возвращает `TRUST_ROOT_CHANGE_REQUIRES_OWNER_GATE` и не может само себя
утвердить.

## Доверенная последовательность

```text
pull_request_target from protected base
  -> checkout exact BASE_SHA as executable trusted-base
  -> checkout exact HEAD_SHA as non-executable candidate data
  -> execute only base-owned verifier and base-owned tests
  -> bind findings to BASE_SHA + HEAD_SHA
  -> require protected check context trusted-agent-governance
```

Обычный `pull_request` workflow из head может давать дополнительную диагностику,
но не заменяет trusted check и не способен повысить его verdict.

## Threat model

| Угроза | Контроль | Остаточный статус |
|---|---|---|
| PR ослабляет validator и получает PASS | Исполняется validator только из exact base SHA | Локальный adversarial test PASS |
| PR изменяет workflow/policy floor/schema trust root | Изменение выявляется base-owned diff и требует owner gate | Локальный test PASS |
| Candidate запускает hooks/lifecycle/code | Candidate читается как Git/index data; hooks отключены; package install отсутствует | Локальный test PASS |
| Symlink/submodule/path traversal | Index mode и canonical path checks до чтения | Локальный test PASS |
| Подмена base/head | Exact 40-hex SHA и `rev-parse HEAD` binding | Локальный test PASS |
| PR фабрикует REAL_SUBAGENT/model/owner evidence | Repository-authored evidence не является trusted attestation | `INSUFFICIENT_EVIDENCE` |
| Maintainer меняет protected ruleset | Требуется внешнее ruleset evidence и canary | `BLOCKED` |
| Bootstrap PR пытается доказать собственную base-pinned защиту | До merge verifier отсутствует в base и не может считаться trusted | `BLOCKED` |
| Compromised pinned third-party Action | `actions/checkout` закреплён full commit SHA; требуется periodic security review | Residual risk |

## External acceptance gates

Локальные tests доказывают реализацию, но не состояние GitHub. Финальный PASS
запрещён до одновременного наличия:

- verifier в canonical base;
- negative canary, где ослабленный head validator блокируется;
- structural-positive canary на неизменённом trust root;
- repository ruleset, требующего exact check `trusted-agent-governance`;
- сохранённого GitHub run/check evidence, связанного с PR base/head SHA.

До этого `IntegrityStatus` может описываться как локально проверенный, но общий
status остаётся `BLOCKED_EXTERNAL_EVIDENCE_MISSING`.

## Rollback

1. Не отключать required check и не заменять его head-owned workflow.
2. При дефекте verifier остановить governance-changing PR и выпустить отдельный
   remediation PR, который всё ещё проверяется предыдущей base-owned версией.
3. Если необходим откат, revert commit verifier обычным новым commit без history
   rewrite; ruleset сохранять включённым до появления исправленной base version.
4. После rollback повторить negative и structural-positive canaries.
5. Rollback не разрешает push, merge, deployment или production write сам по
   себе.

## Safety boundary

Verifier не имеет production credentials и не выполняет Apps Script, Sheets,
broker/API или deployment writes. Candidate data не исполняется.
