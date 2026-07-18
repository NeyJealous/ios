# RFC-AGENT-PLATFORM-V2

- Статус: `PROPOSED_FOR_REVIEW`
- Дата: 2026-07-18
- Область: repository-wide Agent Platform v2 migration
- Owner authorization: `audit/agents/OWNER-DECISION-AGENT-PLATFORM-V2.md`
- Связанный draft ADR: `adr/ADR-AGENT-PLATFORM-V2.md`

## Проблема

Действующая платформа содержит десять активных TOML-профилей, которые переписывают upstream prompts, Terra-only overrides, два registry-only partial agents и resolver/manifest validation gaps. Она не соответствует Agent Platform v2.1 и не обеспечивает immutable composition, exact model routing, trusted execution attestation или защищённый governance self-change.

## Authoritative baseline transition

Для этой миграции authoritative audit baseline — Master Specification v4.0. V3.0 остаётся immutable historical baseline. Correction Memo остаётся historical evidence и superseded только в явно включённой/заменённой v4 части. Расхождение runtime со спецификацией становится finding.

## Рассмотренные варианты

1. Сохранить прежнюю 10-agent/Terra-only платформу — отклонено как несовместимое с v2.1.
2. Переписать профили вручную — отклонено: нарушает immutable upstream contract.
3. Немедленно удалить старый слой — отклонено до safety remediation.
4. Dual-run до полной v2 acceptance — снижает риск, но не создаёт требуемое доказуемое zero-agent состояние.
5. Контролируемый zero-agent cutover после независимого non-agent PRE_REMOVAL gate — предложено.

## Предлагаемое решение

### Phase 1 — safety remediation

- исправить per-path mixed known/unknown fail-closed;
- schema-validate registry, matrix, reports и manifests;
- запретить mandatory `NOT_AVAILABLE` с passing status;
- сделать workflow tests LF/CRLF-safe;
- добавить end-to-end add/delete/rename tests;
- создать non-agent fail-closed safety validator;
- создать base-pinned trusted verifier boundary;
- пройти PRE_REMOVAL reviews и tests.

Старые profiles остаются активными до PASS этой фазы.

### Phase 2 — controlled removal

После PRE_REMOVAL PASS удаляются старые TOML, registry/matrix/resolver mappings. Historical reports и pre-cleanup inventory сохраняются. Zero-agent состояние защищает только non-agent validator; mandatory unavailable agent даёт fail-closed.

### Phase 3 — new platform

Создаются immutable snapshots, locks, append-only overlays, deterministic compositions, generated profiles, registries, resolver, orchestrator, manifests, fixtures, bootstrap и CI. Все агенты первоначально `PROVISIONAL`.

## Exact upstream selection

Pinned commit не равен profile acceptance. Для каждого component фиксируются repository, commit, exact path/profile ID, raw/normalized SHA-256, license, order и selection rationale. `or`, `equivalent`, `if available` не выбираются автоматически. До reviewed decision статус `UNRESOLVED`; отсутствующий профиль — `UPSTREAM_PROFILE_NOT_FOUND`.

## Supply-chain security

Bootstrap использует allowlist двух repositories, запрещает submodules, symlinks/path traversal, lifecycle/code execution и плавающие refs. Downloaded/generated/untracked/diff artifacts проходят privacy/security scan. Каждый профиль получает отдельный prompt-injection, capability и forbidden-actions verdict.

## Anti-tamper architecture

PR-head validator не является доверенной границей. После bootstrap PR canonical base предоставляет `tools/trusted-governance/validate.mjs`, `policy-floor.json` и `.github/workflows/trusted-agent-governance.yml`. Workflow использует `pull_request_target`, read-only permissions и pinned action SHA; verifier запускается только из checkout exact `BASE_SHA`. Отдельный head checkout рассматривается исключительно как недоверенные данные: candidate scripts, hooks, dependencies и package lifecycle не выполняются и не импортируются. Base и candidate policy объединяются по stricter-union rule; symlink/submodule, path escape, malformed schema, mixed unknown path, missing/stale/`NOT_AVAILABLE` evidence блокируют результат. Head validator запускается дополнительно, но не заменяет base minimum controls.

GitHub документирует, что `pull_request_target` исполняет workflow в контексте base/default branch, и отдельно предупреждает не выполнять код из untrusted head. Выбранный дизайн следует этому ограничению: [Securely using pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target), [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target).

Первый bootstrap PR не может доказать base-pinned execution собственной новой версии: его acceptance требует independent review и owner merge decision. Любой последующий removal/platform PR блокируется, пока trusted verifier отсутствует в canonical base.

После merge bootstrap PR обязателен canary PR и внешняя настройка ruleset, требующая exact check context `trusted-agent-governance`. Эти GitHub settings не могут быть доказаны или изменены repository text. До canary и ruleset evidence anti-tamper verdict остаётся `BLOCKED`.

## Trusted execution attestation

PR-authored text недостаточен для REAL_SUBAGENT, фактической модели и owner approval. Versioned manifest сохраняет claims, но trusted verifier должен получать независимый runtime/GitHub evidence. До реализации claims получают `INSUFFICIENT_EVIDENCE`; automatic dispatch не объявляется полностью подтверждённым.

## Model policy

Terra и Sol регистрируются только как candidates до exact-slug smoke tests. Luna и Sol Pro — `UNVERIFIED`. Silent downgrade запрещён. Agent с недоступным verdict floor остаётся `MODEL_NOT_AVAILABLE`. Изменение Luna→Terra или Sol Pro→Sol требует отдельного model-policy amendment.

## Rollback

- Phase 1 rollback: revert PR; old platform remains intact.
- Phase 2 rollback: revert removal PR; historical evidence and old profiles восстанавливаются из Git.
- Phase 3 rollback: revert platform PR; production/App Script/Sheets/deployments не затрагиваются.
- Force push/history rewrite запрещены.

## Architecture Impact Check

Изменяется governance/development-platform boundary, но не runtime IOS, Apps Script, Sheets schema/formulas, Investment Logic, Decision Engine, R030, Market Regime или production deployment. Изменение требует Architecture/Security/Documentation/Test reviews и owner acceptance draft ADR.

## Acceptance gates

1. Phase 1 tests/reviews PASS.
2. Trusted verifier находится в canonical base до removal PR.
3. Exact-selection register reviewed.
4. Upstream/model/security evidence complete.
5. Draft ADR отдельно подтверждён владельцем и только затем меняет status на `ACCEPTED`.

## Открытые вопросы

- Независимый provider trusted runtime attestation.
- Exact model slugs Luna и Sol Pro.
- Exact selection для всех неоднозначных composition rows.
- Protected reusable workflow или base-checkout verifier как долгосрочный GitHub boundary.
