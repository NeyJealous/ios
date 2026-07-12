# CODEX-00 Runtime Report

Дата: 12.07.2026  
Статус: **Не завершён — остановлен до удалённой авторизации/проверки**.

## Baseline

- Рабочий каталог: `C:\Projects\IOS`.
- Ветка: `main`.
- Commit: отсутствует; репозиторий ещё без первого коммита.
- Node.js: `v24.18.0`.
- npm: `11.16.0`.
- clasp: `3.3.0`.
- Script ID suffix: `5loFhY`.
- Spreadsheet ID suffix: не подтверждён.

## Проверенные файлы

- `AGENTS.md`.
- `docs/completion_pack/CODEX_MASTER_HANDOFF_IOS_v1.md`.
- `docs/completion_pack/ARCHITECTURE_CORRECTION_MEMO_v1.md`.
- `docs/completion_pack/02_CODEX_SEQUENTIAL_TASKS.md`.
- `docs/completion_pack/03_RUN_FUNCTIONS_TROUBLESHOOTING.md`.
- `apps-script/.clasp.json`.
- `apps-script/.claspignore`.
- `apps-script/appsscript.json`.
- `apps-script/Core.gs`.
- `apps-script/Config.gs`.
- `apps-script/Diagnostics.gs`.
- `apps-script/SmokeTests.gs`.

## Проверенная конфигурация

- `.clasp.json` найден; Script ID настроен.
- `rootDir=.`.
- `filePushOrder`: 48 записей.
- Локально: 47 `.gs`, 31 `.js`.
- `.claspignore` исключает `**/*.js`, `.clasp.json`, `spec_unpack/**`.
- `clasp show-file-status` отслеживает `.gs`, HTML и `appsscript.json`; `.js` показаны как untracked и не входят в push.
- Runtime: V8.
- `executionApi.access=MYSELF`.
- OAuth scopes: 4.
- Используется `spreadsheets.currentonly`, а не полный `spreadsheets` scope.
- API Executable deployment: ещё не проверен.
- Авторизованный Google-пользователь: ещё не проверен.
- Связанная Google-таблица: ещё не подтверждена runtime-вызовом.

## Найденная diagnostic-функция

Найдены:

- `TI_TestPing()` — top-level, без параметров, возвращает JSON-safe plain object, но не проверяет Google Sheets.
- `TI_RunSmokeTestsApi()` — top-level и без UI, но запускает полный набор smoke-тестов; для первичного health check слишком широк.
- `TI_RunSmokeTests()` и `TI_RunDiagnostics()` используют `SpreadsheetApp.getUi()` и не подходят для удалённого запуска.

Не найдены:

- `TI_RemoteHealthCheck()`;
- `TI.Diagnostics.remoteHealthCheck()`;
- явный `SPREADSHEET_ID` в просмотренной конфигурации.

## Внесённые изменения

Изменения Apps Script-кода не вносились.

Причины:

1. Сначала требуется определить безопасный источник Spreadsheet ID без раскрытия секрета.
2. Репозиторий не имеет baseline commit/tag.
3. До минимального diff необходимо проверить авторизацию, deployments и возможность запуска уже существующего `TI_TestPing()`.

## Выполненные команды

- `pwd`.
- `git status --short --branch`.
- `git log -1 --oneline`.
- `node --version`.
- `npm --version`.
- `clasp --version`.
- `clasp help`.
- `clasp help run-function`.
- `clasp help login`.
- `clasp help list-deployments`.
- `clasp show-file-status`.
- статический поиск diagnostic wrappers и Spreadsheet-конфигурации через `rg`.

Не выполнялись:

- `clasp login`;
- `clasp pull`;
- `clasp push`;
- `clasp run-function`;
- `scripts.run`;
- MCP runtime;
- Chrome/browser fallback.

## Результат push

Push не выполнялся.

Локальная проверка показывает, что `.js` исключены из push. Это снижает риск конфликта расширений, но удалённое состояние ещё не подтверждено.

## Результат remote execution

Удалённый запуск не выполнялся.

## Ошибки и классификация

### Попытка продолжить read-only проверку

- Результат: среда Codex отклонила следующую инструментальную операцию из-за исчерпанного лимита разрешённых вызовов.
- Классификация: `LOCAL_TOOLING`.
- Причина: ограничение текущей среды Codex, а не Google Apps Script.
- Минимальное следующее действие: после восстановления доступности инструментов продолжить с `clasp show-authorized-user` и `clasp list-deployments`, не меняя код.

## Что подтверждено

- Версии локального toolchain.
- Фактические команды clasp 3.3.0.
- Локальный Script ID настроен; раскрыт только суффикс.
- `.js` исключены локальными правилами clasp.
- Существуют безопасные top-level wrappers, включая `TI_TestPing()`.
- Существующие UI wrappers нельзя использовать как remote health check.

## Что не подтверждено

- Правильный Google-аккаунт.
- API Executable deployment.
- Standard Google Cloud Project и включённый Apps Script API.
- Runtime OAuth scopes.
- Фактический удалённый запуск функции.
- Доступ к правильной Google-таблице.
- Spreadsheet ID suffix.
- Успешный push.

## Требуется действие пользователя

На текущем шаге не требуется разрешение на browser fallback: терминальная диагностика ещё не исчерпана.

Нужно возобновить CODEX-00 после восстановления инструментального лимита среды. Следующие действия:

1. `clasp show-authorized-user`.
2. `clasp list-deployments`.
3. При наличии авторизации — попытка `clasp run-function TI_TestPing`.
4. Классификация фактической Google/clasp ошибки.
5. Только затем решение о минимальном wrapper и push.

## Готовность к CODEX-01

**Нет.**

CODEX-00 не завершён, код не доставлялся и remote execution не доказан.

