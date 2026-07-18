# Аудит возможностей Codex

Проверено 2026-07-18 по свежему официальному Codex manual. Основные источники:
[Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents.md),
[AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md.md),
[Hooks](https://learn.chatgpt.com/docs/hooks.md),
[MCP](https://learn.chatgpt.com/docs/extend/mcp.md),
[Codex GitHub Action](https://learn.chatgpt.com/docs/github-action.md),
[Skills & Plugins](https://learn.chatgpt.com/docs/skills-and-plugins.md).

| Возможность | Статус | Вывод |
|---|---|---|
| Repository instruction file | SUPPORTED | Корневой `AGENTS.md` автоматически читается до работы. |
| Directory inheritance | SUPPORTED | Цепочка строится root → cwd; ближайший файл имеет больший приоритет. |
| Project-level instructions | SUPPORTED | Versioned и переносимы через Git. |
| User-level instructions | LOCAL_ONLY | `~/.codex/AGENTS.md` — личные defaults, не repository guarantee. |
| Реальные subagents | SUPPORTED | Codex app/CLI/IDE создают отдельные agent threads и собирают результаты. |
| Project custom agents | SUPPORTED_WITH_LIMITS | `.codex/agents/*.toml`; формат может развиваться, доступность зависит от клиента/account. |
| Automatic delegation | SUPPORTED_WITH_LIMITS | Явный prompt или applicable project/skill instruction; proactive delegation зависит от Ultra/eligibility. |
| Reusable skills | SUPPORTED | Project/user skills подходят для повторяемых workflows, но этот PR не создаёт skill. |
| Hooks | SUPPORTED_WITH_LIMITS | Project hooks требуют trusted project и отдельного trust exact hash; prompt/agent handlers пока пропускаются. |
| MCP | SUPPORTED_WITH_LIMITS | Даёт tools/context; permissions и доступность server-specific, не является разрешением на write. |
| Git portability | SUPPORTED | `AGENTS.md`, `.codex/agents`, scripts и workflow versioned. User config/hook trust не переносится. |
| Worktree behavior | SUPPORTED | Worktree получает файлы checkout своей ветки; shared Git metadata не переносит отсутствующие governance files в старую ветку. |
| CI applicability | SUPPORTED | Repository scripts/workflow работают в CI; Codex Action также существует, но требует API key. |
| Fully autonomous independent mandatory review | NOT_SUPPORTED | Нельзя гарантировать запуск/независимость только файлом: нужен runtime и evidence; CI валидирует артефакты. |

## Выбранная деградация

Когда клиент не предоставляет subagents, Codex последовательно выполняет
применимые profiles и маркирует их `CODEX_ROLE_SIMULATION`. Это допустимый
fallback, но не независимый review. `REAL_SUBAGENT` требует отдельного agent
thread evidence. CI не запускает LLM и не использует OpenAI key; он только
валидирует registry/matrix/manifest/reports и baseline controls.

## Почему не hooks как глобальный gate

Project hooks требуют trust на конкретной машине, могут быть отключены policy,
а некоторые handler types ещё не исполняются. Поэтому они не являются общей
гарантией для всех contributors/worktrees/PR. Основной hard gate — GitHub
Actions и ruleset required check после отдельного owner action.

## Фактическая доступность в этом gate

В текущем Codex-сеансе orchestration tools существуют, однако независимые
reviews для этого изменения не запускались: отчёты должны честно иметь
`CODEX_ROLE_SIMULATION`. Наличие десяти TOML-файлов означает доступный тип
project agent в поддерживаемом клиенте, но не доказывает его конкретный запуск.

Все десять project agents адаптированы из VoltAgent collection и по требованию
репозитория используют `model = "gpt-5.6-terra"`. Это IOS override исходных
upstream model pins; provenance остаётся pinned и проверяется validator.
