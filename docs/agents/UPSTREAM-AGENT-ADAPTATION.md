# VoltAgent upstream agent adaptation

## Provenance

- Repository: https://github.com/VoltAgent/awesome-codex-subagents
- Pinned commit: `5605c9c18b3687993919d6cc467af4a34898fee2`
- License: MIT, `third_party/VoltAgent-awesome-codex-subagents-LICENSE.txt`
- Integration date: 2026-07-18

Upstream предупреждает, что профили поставляются без security/correctness
гарантий. Поэтому определения не копируются слепо: capability и working-mode
сохранены, а permissions, scope, output contract и запреты усилены IOS policy.

## Mapping

| IOS agent | Upstream source | IOS adaptation |
|---|---|---|
| Architecture Reviewer | `architect-reviewer.toml` | Master Specification, source-of-truth, RFC/ADR, read-only |
| Apps Script Reviewer | `javascript-pro.toml` | Apps Script runtime, batch I/O, locks, quotas, no clasp/remote |
| Performance Auditor | `performance-engineer.toml` | Apps Script/Sheets/API targets and measurable evidence |
| Investment Logic Reviewer | `fintech-engineer.toml` + `quant-analyst.toml` | Decision Engine, strategy/reserve, R030/Market Regime safety |
| Bond Specialist | `quant-analyst.toml` + `fintech-engineer.toml` | YTM, bond risks, coupon ladder, no independent action |
| Company Rating Reviewer | `quant-analyst.toml` + `fintech-engineer.toml` | scoring/data/uncertainty and no independent action |
| Google Sheets Reviewer | `data-engineer.toml` | sheet lineage/schema/migrations/integrity, no Sheets write |
| Documentation Reviewer | `documentation-engineer.toml` | canonical traceability, Russian language, no fabricated guarantees |
| UX Reviewer | `ui-ux-tester.toml` | Russian Sheets flows, hidden IDs, explainability/accessibility |
| Test Generator | `test-automator.toml` | deterministic governance/domain tests, no production access |

## Intentional overrides

- Все profiles используют `gpt-5.6-terra` по явному указанию владельца;
  upstream model pins не наследуются.
- Reviewers/auditors — `read-only`; Test Generator — `workspace-write`, но
  только для явно назначенных test files.
- Все remote write, commit/push/merge/deploy/production actions запрещены.
- Каждый результат должен соответствовать IOS review contract.
- Upstream names не выдаются за канонические IOS names; mapping versioned.

## Update policy

Upstream не обновляется плавающим `main`. Обновление требует нового pinned
commit, diff каждого используемого source, license/security review, повторной
адаптации, обновления этого mapping и governance self-change reviews.
