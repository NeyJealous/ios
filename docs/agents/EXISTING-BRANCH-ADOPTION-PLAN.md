# Existing Branch Adoption Plan

## Read-only inventory на 2026-07-18

После `git fetch origin --prune` remote содержит только canonical head:

| Remote branch | Класс | Behind/Ahead canonical | Merged | Protected | Governance present до merge |
|---|---|---:|---|---|---|
| `origin/integration/ios-current` | canonical/protected | 0/0 | Да | GitHub ruleset: deletion, non-fast-forward, PR+1 approval | Нет |

Remote active/task/research/hotfix/stale branches отсутствуют. Локальные
worktree branches не являются remote inventory и не изменялись.

## Adoption policy

- После merge governance находится в canonical; новые ветки создаются только
  от обновлённого canonical и наследуют его.
- Существующие активные ветки обновляются только при clean status и отдельном
  разрешении через merge/rebase/cherry-pick по выбранной policy.
- Research branch может импортировать governance commit, оставаясь research.
- Archived/stale branches не меняются.
- Existing branch нельзя назвать покрытой, пока соответствующий commit
  фактически не входит в её history.
- Worktree получает файлы checkout своей ветки; shared `.git` не означает
  shared working-tree files.
- CI проверяет каждый PR независимо от локальных Codex/user settings.

Текущая task branch `codex-global-agent-governance` становится источником
предлагаемого governance commit, но canonical и другие worktree остаются без
него до отдельного merge.
