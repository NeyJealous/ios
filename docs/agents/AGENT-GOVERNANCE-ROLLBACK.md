# Agent Governance Rollback

1. Создать отдельный rollback PR, который revert-ит merge commit governance.
2. Владелец отдельно отключает required status check в ruleset; workflow не
   меняет ruleset автоматически.
3. При необходимости откатить workflow/registry/matrix к предыдущей versioned
   версии тем же PR.
4. Не удалять старые `audit/agents/**` и `docs/reviews/**`: это audit history.
5. Проверить privacy, tests и отсутствие runtime/production diff.

Rollback не выполняет history rewrite/force push, не меняет Apps Script,
Google Sheets, deployments, Investment Logic или production. Откат самого
governance слоя также является anti-tamper change и требует review/owner
approval.
