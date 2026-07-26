# Pre-cleanup inventory агентной платформы IOS

## Baseline

- Canonical branch: `integration/ios-current`
- Canonical/base SHA: `d2d60713e580fa1bcce8ba874216619598094093`
- Task branch: `feature/agent-platform-v2-integration`
- Current-tree privacy scan: `PASS` — 688 tracked files, findings отсутствуют.

## Состав старого слоя

- Активные `.codex/agents/*.toml`: **10**.
- Registry entries: **12**; `SECURITY_REVIEWER` и `PRIVACY_REVIEWER` существуют только как `PARTIAL` registry/CI roles.
- Review Matrix rules: **20**.
- Historical reports: **8** с честным `CODEX_ROLE_SIMULATION`; ложных `REAL_SUBAGENT` claims не найдено.
- Exact reconstruction: `git show d2d60713e580fa1bcce8ba874216619598094093:<repository-relative-path>`.

## Главный finding

Все десять активных TOML-профилей содержат вручную переписанный IOS prompt. Полный upstream prompt не включён неизменяемо. Это подтверждает `docs/agents/UPSTREAM-AGENT-ADAPTATION.md`: прежняя платформа намеренно не копировала определения полностью и заменяла model pins общим `gpt-5.6-terra`.

По Agent Platform v2.1 такой подход классифицирован как `INVALID_REWRITTEN`. Composite-профили `BOND_SPECIALIST`, `COMPANY_RATING_REVIEWER` и `INVESTMENT_LOGIC_REVIEWER` вручную сводят несколько upstream-ролей без immutable composition и conflict-resolution contract.

## Инвентаризированные агенты

| Agent ID | Active path | Status | Причина удаления |
|---|---|---|---|
| `APPS_SCRIPT_REVIEWER` | `.codex/agents/apps-script-reviewer.toml` | `INVALID_REWRITTEN` | Upstream переписан |
| `ARCHITECTURE_REVIEWER` | `.codex/agents/architecture-reviewer.toml` | `INVALID_REWRITTEN` | Upstream переписан; Terra-only |
| `BOND_SPECIALIST` | `.codex/agents/bond-specialist.toml` | `INVALID_REWRITTEN` | Ручное смешивание prompts |
| `COMPANY_RATING_REVIEWER` | `.codex/agents/company-rating-reviewer.toml` | `INVALID_REWRITTEN` | Ручное смешивание prompts |
| `DOCUMENTATION_REVIEWER` | `.codex/agents/documentation-reviewer.toml` | `INVALID_REWRITTEN` | Upstream переписан; stale model |
| `GOOGLE_SHEETS_REVIEWER` | `.codex/agents/google-sheets-reviewer.toml` | `INVALID_REWRITTEN` | Upstream заменён adaptation |
| `INVESTMENT_LOGIC_REVIEWER` | `.codex/agents/investment-logic-reviewer.toml` | `INVALID_REWRITTEN` | Ручное смешивание prompts |
| `PERFORMANCE_AUDITOR` | `.codex/agents/performance-auditor.toml` | `INVALID_REWRITTEN` | Upstream переписан |
| `TEST_GENERATOR` | `.codex/agents/test-generator.toml` | `INVALID_REWRITTEN` | Upstream переписан |
| `UX_REVIEWER` | `.codex/agents/ux-reviewer.toml` | `INVALID_REWRITTEN` | Upstream переписан |
| `SECURITY_REVIEWER` | registry only | `INVALID_CONTRACT` | Нет TOML/provenance/model contract |
| `PRIVACY_REVIEWER` | registry only | `INVALID_SOURCE_UNKNOWN` | Нет TOML/source/model/matrix rule |

Полные hashes, references, execution modes и model contracts находятся в JSON inventory.

## Platform findings

1. `CRITICAL`: Resolver не fail-closes смешанный known+unknown diff.
2. `HIGH`: validator принимает `NOT_AVAILABLE + PASS` и не полностью применяет schemas.
3. `HIGH`: Windows baseline suite — 30 PASS / 1 FAIL из-за LF-only assertion.
4. `INFO`: historical reports сохраняются как audit history и не действуют для новых profile/model hashes.

## Статус удаления

`BLOCKED`. Inventory завершён, но старый слой не удалён: PRE_CHANGE gate выявил `BLOCKER/CRITICAL`; v2.1 остаётся `PROPOSED` без принятого RFC/ADR и exact composition decision.

Production impact: `NONE`. Apps Script, Google Sheets, deployments, broker/API и production data не изменялись.
