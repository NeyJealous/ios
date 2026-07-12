# Последовательные задания для Codex

## CODEX-PRE-00 — Windows Workstation Bootstrap

Прочитай `00A_WINDOWS_CLEAN_INSTALL_BOOTSTRAP.md`.

Выполни:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\tools\Check-IOSDevEnvironment.ps1 -ProjectPath "C:\Projects\IOS"
```

Если обязательные инструменты отсутствуют, сначала показать пользователю preview:

```powershell
.\tools\Install-IOSCoreTools.ps1
```

Фактическую установку выполнять только после подтверждения пользователя:

```powershell
.\tools\Install-IOSCoreTools.ps1 -Apply
```

После установки полностью перезапустить Windows/терминал и повторить проверку.

Не выполнять `clasp pull`, `clasp push` и не менять код проекта на этом этапе.

DoD:
- `ReadyForCodex00 = true`;
- Node.js ≥ 22;
- `clasp help` содержит `run-function`;
- Codex CLI авторизован;
- Git настроен;
- обязательные файлы проекта найдены;
- secrets отсутствуют в репозитории;
- создан `docs/environment/PRE-00-WINDOWS-BOOTSTRAP-REPORT.md`.

## CODEX-00 — Runtime Access

Цель: выполнить `TI_RemoteHealthCheck` удалённо.

Требования к функции:

```javascript
function TI_RemoteHealthCheck() {
  const spreadsheetId = TI.CONFIG.SPREADSHEET_ID;
  if (!spreadsheetId) {
    return { ok: false, errorCode: "SPREADSHEET_ID_NOT_CONFIGURED" };
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  return {
    ok: true,
    projectVersion: String(TI.CONFIG.PROJECT_VERSION || "unknown"),
    spreadsheetIdSuffix: spreadsheetId.slice(-6),
    sheets: ss.getSheets().map(s => s.getName()),
    timestamp: new Date().toISOString()
  };
}
```

Адаптировать к фактическому `TI`, не выводить полный ID и секреты.

Для clasp 3.x сначала проверить:

```bash
clasp help
clasp run-function TI_RemoteHealthCheck --use-project-scopes
```

Использовать только команду, реально присутствующую в установленной версии.

DoD:
- JSON `ok=true`;
- получен список листов;
- создан `docs/runtime-access-report.md`.

## CODEX-00B — Browser Runtime Fallback

Выполнять только если CODEX-00 не завершён и пользователь разрешил резервный режим.

Прочитай `CODEX-00B_BROWSER_RUNTIME_FALLBACK.md`.

DoD:
- health check запущен через Apps Script UI;
- статус подтверждён в «Выполнения»;
- Run ID записан в «Диагностика»;
- связанная таблица подтверждена;
- создан browser fallback report;
- проблема терминального runtime зарегистрирована отдельно.

## CODEX-01 — Canonical Files

- backup;
- сравнение `.gs/.js`;
- канонические `.gs`;
- дубли top-level функций;
- dead code;
- Project Version;
- чистый push/pull round-trip;
- remote health check.

## CODEX-02 — Account Strategy Core

- связи только Account ID;
- миграция существующих строк;
- исправление «Пассивный/Пасивный»;
- Portfolio Health видит позиции;
- включение/исключение счетов;
- remote tests.

## CODEX-03 — Sync Modes

- sequence diagram Quick/Full/Recalc;
- Quick не трогает тяжёлые слои;
- Recalc не вызывает API;
- LockService;
- метрики;
- incremental trades;
- batch read/write;
- tests.

## CODEX-04 — Directory Universe

- нормализованный Справочник;
- Investment Universe;
- Universe Diff;
- три уровня доступности;
- weekend test;
- Decision использует Universe.

## CODEX-05 — Decision Safety

- найти все места создания действий;
- оставить действия только в Decision Engine;
- Data Completeness ≠ Investment Rating;
- неполные данные = «Недостаточно данных»;
- post-validation;
- отрицательные тесты.

## CODEX-06 — User Sheets

- Advisor/Trade Plan/Main используют Решения;
- убрать пустые/нулевые/технические строки;
- русский UX;
- нормальные даты;
- скрыть ID.

## CODEX-07 — Reserve Baseline

- фонд денежного рынка настраивается;
- резерв по счетам и общему портфелю;
- расчёт лотов;
- решение через Decision Engine;
- конкретная строка Trade Plan.

## CODEX-08 — Test and Release

- полный remote test suite;
- backup;
- release version;
- deployment;
- release notes;
- rollback;
- итоговая матрица приёмки.
