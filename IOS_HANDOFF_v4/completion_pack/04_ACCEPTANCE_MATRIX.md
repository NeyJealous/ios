# Матрица приёмки

| Область | Критерий |
|---|---|
| Workstation | Windows обновлена, WinGet работает |
| Toolchain | Git, Node.js ≥ 22, npm, clasp, Codex, VS Code, PowerShell 7 |
| Security | credentials отсутствуют в репозитории |
| Encoding | русский UTF-8 тест проходит |
| Runtime | Remote health check возвращает `ok=true` |
| Runtime fallback | При отсутствии API: Apps Script Execution + Run ID + запись в «Диагностика» |
| Delivery | push/pull без конфликтов |
| Files | `.gs` сохранены, канон определён |
| Globals | дубли top-level функций отсутствуют |
| Accounts | связи только по Account ID |
| Portfolio Health | видит позиции и корректную стоимость |
| Quick | не запускает тяжёлые слои |
| Full | полный контролируемый pipeline |
| Recalc | 0 внешних API calls |
| Trades | повторный запуск не создаёт дублей |
| Universe | выходной не исключает инструмент |
| Decisions | неполные данные блокируют покупку |
| Advisor | нет `00`, пустых и нулевых строк |
| Trade Plan | цена, лоты, количество и сумма > 0 |
| Reserve | фонд и лоты рассчитываются |
| UX | русский интерфейс, ID скрыты |
| Dates | нет serial numbers |
| Logs | runId, этапы, длительность и ошибки |
| Release | backup и rollback существуют |

Базовый релиз запрещён при провале Runtime, Account ID, Portfolio Health, false-buy guard или трёх режимов sync.


## Уровни приёмки runtime

### Целевой

Автоматический запуск через `scripts.run`, `clasp run-function` или MCP.

### Временный допустимый

Browser fallback с:

- отдельным профилем;
- Run ID;
- журналом;
- записью на листе «Диагностика»;
- ручным утверждением пользователя.

Browser fallback не закрывает задачу автоматизации runtime.
