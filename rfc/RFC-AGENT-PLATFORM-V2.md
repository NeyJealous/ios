# RFC-AGENT-PLATFORM-V2

- Статус: `READY_FOR_OWNER_REVIEW_PHASE_3A_BLOCKERS_OPEN`
- Дата: 2026-07-18
- Область: repository-wide Agent Platform v2 migration
- Owner authorization: `audit/agents/OWNER-DECISION-AGENT-PLATFORM-V2.md`
- Связанный draft ADR: `adr/ADR-AGENT-PLATFORM-V2.md`

## Проблема

Исходная платформа содержала десять активных TOML-профилей, которые переписывали upstream prompts, Terra-only overrides, два registry-only partial agents и resolver/manifest validation gaps. После owner-authorized commit `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da` repository находится в fail-closed `ZERO_AGENT_TRANSITION`: активные profiles и legacy bindings отсутствуют, а non-agent safety validator сохранён. Новая платформа ещё не активирована и пока не обеспечивает complete immutable composition, trusted execution attestation или automatic dispatch acceptance.

## Authoritative baseline transition

Для этой миграции authoritative audit baseline — Master Specification v4.0. V3.0 остаётся immutable historical baseline. Correction Memo остаётся historical evidence и superseded только в явно включённой/заменённой v4 части. Расхождение runtime со спецификацией становится finding.

## Рассмотренные варианты

1. Сохранить прежнюю 10-agent/Terra-only платформу — отклонено как несовместимое с v2.1.
2. Переписать профили вручную — отклонено: нарушает immutable upstream contract.
3. Немедленно удалить старый слой — отклонено до safety remediation.
4. Dual-run до полной v2 acceptance — снижает риск, но не создаёт требуемое доказуемое zero-agent состояние.
5. Контролируемый zero-agent cutover после независимого non-agent PRE_REMOVAL gate — предложено.

## Предлагаемое решение

Owner decisions отдельно разрешили Phase 1 remediation, затем контролируемый zero-agent cutover без восстановления legacy profiles и Phase 3A governance prerequisites. Эти решения являются scope authorization и audit evidence, но не означают acceptance draft ADR, activation нового агента, merge/deployment approval или production-write permission.

### Phase 1 — safety remediation

- исправить per-path mixed known/unknown fail-closed;
- schema-validate registry, matrix, reports и manifests;
- запретить mandatory `NOT_AVAILABLE` с passing status;
- сделать workflow tests LF/CRLF-safe;
- добавить end-to-end add/delete/rename tests;
- создать non-agent fail-closed safety validator;
- создать base-pinned trusted verifier boundary;
- пройти PRE_REMOVAL reviews и tests.

Phase 1 remediation и regression suite завершены локально. External GitHub trust evidence не могло быть получено до появления verifier в canonical base и остаётся отдельным blocker.

### Phase 2 — controlled removal

Phase 2 завершена commit `bc3314ac6f95aa6acf15fc6a86736e4fb8a2e8da` по отдельному явному owner decision несмотря на сохранённые и раскрытые external blockers. Старые TOML и registry/matrix/resolver mappings удалены, historical reports и pre-cleanup inventory сохранены. Zero-agent состояние защищает non-agent validator; mandatory unavailable agent даёт fail-closed.

### Phase 3 — new platform

Phase 3 разделена на контролируемые waves:

1. **3A — governance prerequisites:** base-pinned verifier design, trusted attestation contract, exact-selection register, model availability evidence, RFC/ADR review и independent reports. Генерация и activation запрещены.
2. **3B — supply-chain foundation:** immutable snapshots/locks, append-only overlays, deterministic compositions, registries и validators только для owner-approved exact selections.
3. **3C — provisional generation:** project-local generated profiles, resolver/orchestrator, fixtures, bootstrap и CI. Все агенты первоначально `PROVISIONAL` и не становятся `ACTIVE` без полного acceptance evidence.
4. **3D — activation:** отдельный reviewed/owner-approved change после trusted execution, model, security, reproducibility и GitHub gate evidence.

## Exact upstream selection

Pinned commit не равен profile acceptance. Для каждого component фиксируются repository, commit, exact path/profile ID, raw/normalized SHA-256, license, order и selection rationale. Неоднозначные и условные формулировки не выбираются автоматически. Phase 3A register содержит 13 `SELECTED`, 31 `REQUIRES_OWNER_DECISION` и 0 `UPSTREAM_PROFILE_NOT_FOUND`; у owner-blocked rows выбранная composition пуста. Две workflow-фразы не задают exact profile ID и сохранены как explicit gaps. Никакой row не активирован.

## Supply-chain security

Bootstrap использует allowlist двух repositories, запрещает submodules, symlinks/path traversal, lifecycle/code execution и плавающие refs. Downloaded/generated/untracked/diff artifacts проходят privacy/security scan. Каждый профиль получает отдельный prompt-injection, capability и forbidden-actions verdict.

## Anti-tamper architecture

PR-head validator не является доверенной границей. После bootstrap PR canonical base предоставляет `tools/trusted-governance/validate.mjs`, `policy-floor.json` и `.github/workflows/trusted-agent-governance.yml`. Workflow использует `pull_request_target`, read-only permissions и pinned action SHA; verifier запускается только из checkout exact `BASE_SHA`. Отдельный head checkout рассматривается исключительно как недоверенные данные: candidate scripts, hooks, dependencies и package lifecycle не выполняются и не импортируются. Base и candidate policy объединяются по stricter-union rule; symlink/submodule, path escape, malformed schema, mixed unknown path, missing/stale/`NOT_AVAILABLE` evidence блокируют результат. Head validator запускается дополнительно, но не заменяет base minimum controls.

Both workflows run the governance regression suite. The privileged workflow runs only the base-owned tests. Full candidate history is currently required because trusted manifest freshness validation performs merge-base and report-only-tail diffs; reducing fetch depth requires a separate proven redesign. PR-scoped concurrency cancels obsolete runs.

GitHub документирует, что `pull_request_target` исполняет workflow в контексте base/default branch, и отдельно предупреждает не выполнять код из untrusted head. Выбранный дизайн следует этому ограничению: [Securely using pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target), [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target).

Первый bootstrap PR не может доказать base-pinned execution собственной новой версии: его acceptance требует independent review и owner merge decision. Любой последующий removal/platform PR блокируется, пока trusted verifier отсутствует в canonical base.

После merge bootstrap PR обязателен canary PR и внешняя настройка ruleset, требующая exact check context `trusted-agent-governance`. Эти GitHub settings не могут быть доказаны или изменены repository text. До canary и ruleset evidence anti-tamper verdict остаётся `BLOCKED_EXTERNAL_EVIDENCE_MISSING`. Полная архитектура, threat model и rollback закреплены в `docs/agents/TRUSTED-GOVERNANCE-VERIFIER.md`.

## Trusted execution attestation

PR-authored text недостаточен для REAL_SUBAGENT, фактической модели и owner approval. Versioned manifest сохраняет claims, но trusted verifier должен получать независимый runtime/GitHub evidence. До реализации claims получают `INSUFFICIENT_EVIDENCE`; automatic dispatch не объявляется полностью подтверждённым.

Bootstrap verifier therefore separates `IntegrityStatus` from `AttestationStatus`. A structurally valid candidate can obtain local structural integrity evidence, but every candidate-authored execution mode, including `REAL_SUBAGENT`, remains insufficient and keeps `OverallStatus=BLOCKED` until a separately trusted provider contract supplies commit-bound execution evidence. `AgentThreadId` remains traceability metadata only. Versioned contract `architecture/agents/schemas/execution-attestation.schema.json` binds issuer, execution/model, profile/overlay, base/head, owner decision and independence; trusted transport remains unavailable, so current status is `INSUFFICIENT_EVIDENCE`.

## Model policy

Exact-slug runtime dispatch принят для `gpt-5.6-terra` и `gpt-5.6-sol`; они остаются `AVAILABLE_CANDIDATE`, поскольку signed model attestation отсутствует. `gpt-5.6-luna` и `gpt-5.6-sol-pro` отсутствуют в доступном runtime catalog и записаны как `MODEL_NOT_AVAILABLE`. Sol Pro не запрашивался. Silent downgrade и substitution отсутствуют. Agent с недоступным verdict floor не активируется; Luna→Terra и Sol Pro→Sol требуют отдельного model-policy amendment.

## Rollback

- Phase 1 rollback: revert PR; old platform remains intact.
- Phase 2 rollback: revert removal PR; historical evidence and old profiles восстанавливаются из Git.
- Phase 3A rollback: revert только Phase 3A governance commit обычным новым commit; zero-agent cutover не восстанавливается автоматически.
- Phase 3B/3C rollback: revert соответствующий platform commit; production/App Script/Sheets/deployments не затрагиваются.
- Force push/history rewrite запрещены.

## Architecture Impact Check

Изменяется governance/development-platform boundary, но не runtime IOS, Apps Script, Sheets schema/formulas, Investment Logic, Decision Engine, R030, Market Regime или production deployment. Изменение требует Architecture/Security/Documentation/Test reviews и owner acceptance draft ADR.

## Acceptance gates

1. Governance and Phase 3A regression suite PASS locally.
2. Trusted verifier находится в canonical base и имеет negative/positive canary plus required-ruleset evidence.
3. 31 owner-blocked exact selections имеют отдельные decisions или остаются негенерируемыми.
4. Trusted execution/model/owner attestation provider реализован и tested.
5. Upstream prompt-injection/capability/license/privacy acceptance complete для каждой генерируемой composition.
6. Mandatory contract-compatible reviews привязаны к актуальному committed head.
7. Draft ADR отдельно подтверждён владельцем и только затем меняет status на `ACCEPTED`.

## Открытые вопросы

- Независимый provider trusted runtime/owner attestation.
- Доступность exact slugs Luna и Sol Pro.
- Owner decisions для 31 exact candidate set.
- Canonical-base canaries и protected ruleset evidence для выбранного base-checkout verifier.
