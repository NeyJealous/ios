# CODEX-00 Runtime Access Report

## OAuth remediation

- Исходная ошибка: Google «Приложение заблокировано» при обычном `clasp login`.
- Классификация: `OAUTH_DEFAULT_CLIENT_BLOCKED`.
- Использованный Cloud Project suffix: `502201`.
- Тип OAuth client: Desktop app, `IOS clasp local`, user-provided.
- Consent screen: External / Testing.
- Test user: аккаунт владельца; 1 test user.
- Apps Script API: включён.
- Apps Script Cloud Project: standard, Project Number suffix `813597`.
- API Executable: существующий deployment, версия 15, доступ только владельцу.
- clasp authorization: named user `ios-dev`; user-provided OAuth client подтверждён.
- run-function result: успешно; `ok = true`, `sheetCount = 40`, возвращён список листов.
- scripts.run result: успешно через `clasp run-function` / Apps Script Execution API в dev mode; JSON-safe объект получен.
- Пользовательские действия: 2FA, выбор аккаунта и OAuth consent.
- Нерешённые риски: существующий immutable deployment версии 15 не обновлялся; health check проверен в dev mode. Production deployment не затронут.

## Scopes

| Source | Scope | Purpose/status |
|---|---|---|
| `appsscript.json` | `spreadsheets.currentonly` | existing spreadsheet access |
| `appsscript.json` | `spreadsheets` | required by `SpreadsheetApp.openById`; owner consent confirmed |
| `appsscript.json` | `script.external_request` | existing; health check не использует HTTP |
| `appsscript.json` | `script.scriptapp` | existing Apps Script management |
| `appsscript.json` | `script.storage` | existing script storage |
| clasp | `script.deployments` | deployment management |
| clasp | `script.projects` | project management |
| clasp | `script.webapp.deploy` | clasp deployment operations |
| clasp | `drive.metadata.readonly` | project discovery/metadata |
| clasp | `drive.file` | clasp-managed Drive files |
| clasp | `service.management` | API/service management |
| clasp | `logging.read` | execution diagnostics |
| clasp | `cloud-platform` | Google Cloud project operations |
| clasp | `userinfo.email`, `userinfo.profile` | authorized-user identification |

## Boundary

Работа ограничена CODEX-00. CODEX-01 и инвестиционная логика не изменялись.

## Health check

- Function: `TI_RemoteHealthCheck`
- Top-level / parameters: yes / none
- Spreadsheet access: `SpreadsheetApp.openById`
- UI, active cell, external HTTP: not used
- T-Invest, MOEX, ЦБ: not called
- Result type: JSON-safe object
- Result: `ok = true`; 40 sheet names returned
- Push: ordinary `clasp push`, without `--force`
- Credentials tracked by Git: none
