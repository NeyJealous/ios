# Почему у Codex может не получаться запускать функции Apps Script

## 1. Apps Script нельзя полноценно выполнить локально

`SpreadsheetApp`, `PropertiesService`, `LockService` и `UrlFetchApp` существуют только в Google Apps Script. Локальный Node.js может проверить синтаксис и чистую логику, но не реальную работу таблицы.

Нужны:
- `clasp run-function`;
- прямой `scripts.run`;
- либо MCP, который использует один из этих способов.

## 2. Устаревшая команда clasp

Старые инструкции используют `clasp run`. В актуальной ветке clasp 3.x используется `run-function`.

Всегда выполнить:

```bash
clasp --version
clasp help
```

## 3. Нет API Executable deployment

`clasp push` загружает код, но сам по себе не создаёт возможность `scripts.run`.

Нужен deployment типа API Executable.

## 4. Разные Google Cloud Projects

Apps Script и OAuth client вызывающего приложения должны использовать один standard Google Cloud Project. Default Apps Script project для этого недостаточен.

## 5. Apps Script API не включён

Проверить:
- Google Cloud Console;
- настройку Apps Script API пользователя;
- правильный Google account.

## 6. OAuth не содержит всех scopes

Токен должен покрывать все scopes проекта, а не только одной функции.

Для clasp 3.x runtime scopes задаются при login, например:

```bash
clasp login --user ios-dev --use-project-scopes --include-clasp-scopes --creds client_secret.json
clasp run-function --user ios-dev TI_RemoteHealthCheck
```

Не передавать `--use-project-scopes` команде `run-function`, если локальный `clasp help` не показывает такую опцию.

## 7. Codex не имеет credentials

Cloud/sandbox Codex не получает автоматически:
- `.clasprc.json`;
- OAuth client JSON;
- refresh token;
- интерактивный browser login;
- доступ к Google account.

Практический путь:
- Codex CLI локально на ПК;
- защищённый MCP;
- локальные credentials вне Git.

## 8. Service account

Google `scripts.run` не поддерживает service accounts. Нужен пользовательский OAuth.

## 9. Функция не top-level

Вызов должен идти через wrapper:

```javascript
function TI_RunSmokeTests() {
  return TI.SmokeTests.runAll();
}
```

## 10. Код не загружен или deployment устарел

Проверить:
- scriptId;
- rootDir;
- `.claspignore`;
- конфликт `.gs/.js`;
- `clasp status`;
- push;
- deployment;
- dev/non-dev mode.

## 11. Зависимость от активного UI

Remote-функция не должна зависеть от:
- active cell;
- selected sheet;
- `SpreadsheetApp.getUi()`;
- event object;
- `onOpen(e)`/`onEdit(e)`.

Использовать явный `SpreadsheetApp.openById`.

## 12. Неподдерживаемый return type

Возвращать:
- string;
- number;
- boolean;
- null;
- array;
- plain object.

Даты преобразовывать в ISO string.

## 13. Нет первичной авторизации

Codex не может подтвердить Google permissions в интерактивном окне. Владелец проекта один раз запускает bootstrap-функцию вручную и подтверждает scopes.

## 14. Истёк access token

Перед долгим запуском обновить OAuth token.

## 15. Дубли top-level функций

Одинаковые имена в нескольких `.gs` могут переопределять друг друга. Сначала устранить дубли.

## 16. Почему ручной запуск не показывает разрешения

Возможные причины:
- разрешения уже выданы;
- функция не использует новый scope;
- функция падает до обращения к сервису;
- запускается другая одноимённая функция;
- удалённый код не обновлён;
- выбран другой Google account.

Проверять Apps Script Executions и Cloud logs, а не только наличие окна.

## 17. Возможное несоответствие executionApi.access

В текущем проекте ранее использовалось `executionApi.access = MYSELF`, тогда как README актуального clasp для `run-function` показывает пример с `ANYONE`.

Это реальный кандидат на причину отказа, но нельзя автоматически расширять доступ production-проекта.

Порядок:
1. проверить фактический тип API Executable deployment и доступ владельца;
2. попробовать прямой `scripts.run` с пользовательским OAuth;
3. при необходимости создать отдельный dev deployment;
4. менять access только после проверки и с минимально необходимыми правами;
5. не публиковать функцию анонимно.

## Browser fallback

Если после последовательной проверки:

- версии clasp;
- standard Google Cloud Project;
- Apps Script API;
- API Executable;
- OAuth scopes;
- пользовательской авторизации;
- top-level JSON-safe wrapper;
- правильного Script ID;

машинный запуск всё ещё не работает, выполнить `CODEX-00B_BROWSER_RUNTIME_FALLBACK.md`.

Browser fallback позволяет продолжить создание рабочей таблицы, но не маскирует нерешённую проблему API/MCP.

