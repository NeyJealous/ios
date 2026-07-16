# CODEX-04B Account Control UX Baseline Audit

## Current functions and UI patterns

- `Menu.gs` использует единое меню `Инвестиционный помощник` с русскими submenu.
- До CODEX-04B отдельного submenu «Счета» не было.
- Единственный HTMLService UI — modal `TokenDialog.html`.
- Token dialog использует `google.script.run`, success/failure handlers и не выводит сохранённый секрет.
- `AccountScope.gs` пакетно читает лист «Счета», кэширует данные на execution context и консервативно отключает unknown/missing flags.
- `MultiAccount.syncAccounts()` сохраняет существующие flags и добавляет неизвестные счета с пятью `false`.
- `Accounts.gs` уже блокирует account-specific provider calls при `Sync_Enabled=false`.
- `TechLog.gs` — append-only технический журнал.
- Отдельного append-only аудита пользовательских scope-настроек не было.
- Защиты flag columns и Account ID от ручного редактирования не было.

## Current sheet state

- Лист «Счета»: 3 business rows.
- Flag columns: пять, contiguous, boolean.
- `…020546`: true / false / true / false / true.
- `…531683`: true / true / true / true / true.
- `…864109`: false / false / false / false / false.
- Remote source baseline: 59/59.
- Deployments: 15.

## Gaps

- Нет безопасной формы управления flags.
- Нет preview/revision guard.
- Нет запрета `Recommendations=true` при `Calculation=false` на write boundary.
- Нет критического подтверждения для отключения Calculation.
- Нет scoped rollback только flags.
- Нет account-scope diagnostics.
- Нет пользовательской истории изменений.
- Full Account ID может быть виден при прямом открытии технического листа.

## Risks

- Optimistic-lock conflict между preview и apply.
- Активная sync может пересечься с flag write.
- Включение очищенного счёта не восстанавливает историю/позиции.
- Отключение History не должно трактоваться как purge.
- Protection не должна мешать Apps Script batch writes.
- `CRITICAL_ACTIVE_INFLUENCE_RISK`: legacy multiplier > 1 может влиять на приоритет покупки через Decision Engine / Rule R030. Статус OPEN, вне scope CODEX-04B.

## Proposed write set

При реальном future apply:

- только 15-cell flag matrix на листе «Счета», с фактическим изменением только выбранных rows;
- append-only rows листа «История настроек счетов»;
- DocumentProperties rollback snapshot;
- TechLog audit message;
- warning-only protections flag columns и скрытого Account ID.

Gate A выполняет только NO_CHANGES apply; реальные flag cells не изменяются.
