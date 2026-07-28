# Migration scope

## Авторизация

Владелец 2026-07-27 явно утвердил переход IOS Agent Platform на
source-authored profiles и определил пять текущих файлов
`.codex/agents/<agent-id>.toml` как полный файловый, функциональный и
поведенческий канон первой волны.

Эта авторизация разрешает локальную implementation-фазу в отдельной feature
branch. Она не является:

- принятием нового ADR;
- разрешением platform activation;
- разрешением push, PR, merge или deployment;
- trusted external attestation;
- подтверждением runtime tool enforcement;
- разрешением на universal escalation agents;
- разрешением на Obsidian Mind integration.

## In scope

1. Новый proposed RFC/ADR для Source-authored IOS Agent Profiles.
2. Пять canonical TOML с неизменными top-level model/reasoning/sandbox и
   сохранённым проверенным role behavior.
3. Удаление индивидуальных model escalation routes из developer instructions.
4. Единый structured output `ESCALATION_REQUIRED`.
5. Agent Integrity Registry, schema и read-only validator.
6. Прямая привязка capability contracts к canonical profile hashes.
7. Decommissioning live overlays, generated provisional profiles,
   compositions, composition lock и compose generator после migration
   dependency/semantic coverage.
8. Замена mutating activation tooling на validate-only governance boundary.
9. Миграция Registry, Matrix, Resolver, bootstrap/check, CI, tests и docs.
10. Static validation и повторные positive/negative/escalation runtime smokes.
11. PRE_CHANGE/POST_CHANGE audit evidence и локальные logical commits.

## Out of scope

- изменение top-level model или reasoning;
- platform-wide `ACTIVE`;
- universal Sol High agent;
- maximum escalation agent;
- фактический centralized escalation spawn/router;
- Obsidian Mind integration;
- production, Apps Script, Sheets, broker/API или deployment writes;
- push, PR, merge, tag mutation;
- history rewrite;
- изменение historical audit evidence.

## Fail-closed boundaries

- `.codex/agents` является canonical source path, но наличие файла не
  доказывает activation, trusted execution или production readiness.
- `ESCALATION_REQUIRED` является запросом, а не model route.
- Профиль не выбирает model slug, не меняет собственную модель и не запускает
  escalation agent.
- `MAXIMUM_OWNER_APPROVAL` требует отдельного owner decision.
- Capability contracts остаются `RUNTIME_ENFORCEMENT_UNVERIFIED`, пока нет
  независимого runtime evidence.
- Любой unknown live consumer удаляемого слоя блокирует его удаление.
- Candidate-authored integrity validation не заменяет base-pinned trusted
  verifier и external PR evidence.

## Required gates

1. Dependency map and semantic coverage before code/profile edits.
2. Proposed RFC/ADR and target contract freeze.
3. Source profile/Integrity Registry implementation.
4. Consumer migration before deletion.
5. Static validation with zero critical failures.
6. Sequential runtime discovery, positive, negative and escalation smokes.
7. Independent reviews bound to the implementation SHA.
8. Local commits only; stop before push.
