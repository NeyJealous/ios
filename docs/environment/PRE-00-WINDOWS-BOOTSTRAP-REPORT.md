# Отчёт CODEX-PRE-00 — Windows Workstation Bootstrap

Дата проверки: 12.07.2026  
Режим: read-only, без установки программ, без `clasp pull/push/run-function`.

## Итог

**Готовность к CODEX-00: Да.** Финальная автоматическая проверка завершилась без обязательных ошибок.

## Обновление после подтверждения пользователя

- Установлен `@google/clasp` 3.3.0.
- Установлен `@openai/codex` CLI 0.144.1.
- Команды `login`, `pull`, `push`, `run-function`, `show-file-status` и `list-deployments` доступны.
- Глобальный npm-каталог доступен через пользовательский PATH.
- Создан канонический рабочий каталог `C:\Projects\IOS`.
- Snapshot перенесён в `C:\Projects\IOS\apps-script` без изменения исходников.
- В корень установлены `AGENTS.md` и `.gitignore`.
- Git-репозиторий инициализирован на ветке `main`; коммитов ещё нет.
- Настроены `init.defaultBranch=main` и `core.longpaths=true`.
- Настроены `git user.name=NeyJealous` и `git user.email=rismahanov@yandex.ru`.
- Повторный автоматический PRE‑00 прошёл все обязательные проверки.

## Система

| Проверка | Результат |
|---|---|
| Windows | Windows 11 Pro 10.0.26100, build 26100 |
| Архитектура | AMD64 |
| ОЗУ | 15,4 ГБ |
| Windows Update service | Работает (`wuauserv`) |
| Полная актуальность обновлений | Не доказана; Windows Settings не открывались |
| UTF‑8 и русский текст | Успешно |

## Инструменты

| Инструмент | Статус | Версия / комментарий |
|---|---|---|
| WinGet | Готов | 1.29.280 |
| PowerShell 7 | Готов | 7.6.3 |
| Git | Готов | 2.55.0.windows.2 |
| Node.js | Готов | 24.18.0; требование ≥22 выполнено |
| npm | Готов | 11.16.0 |
| `clasp` | Готов | 3.3.0; обязательные команды доступны |
| Codex Desktop executable | Найден | Исполняемый файл установлен приложением Codex |
| Codex CLI | Готов | codex-cli 0.144.1 через npm shim |
| VS Code | Готов | 1.127.0 |
| ripgrep | Готов | Доступен в среде Codex |

## Сеть

TCP 443 доступен для:

- `github.com`;
- `registry.npmjs.org`;
- `script.google.com`;
- `oauth2.googleapis.com`;
- `chatgpt.com`.

Авторизация Google/OpenAI и фактические API-вызовы не проверялись.

## Git

- В текущей папке есть `.git`.
- Репозиторий не имеет коммитов; ветка отображается как `master`.
- `git user.name=NeyJealous`.
- `git user.email=rismahanov@yandex.ru`.
- `init.defaultBranch=main`.
- `core.longpaths=true`.
- Текущие распакованные каталоги не отслеживаются.

Значения имени и почты нельзя угадывать — требуется ввод пользователя.

## Рабочая структура проекта

Канонический путь: `C:\Projects\IOS`.

Найдено:

- корневой `.git` на ветке `main`;
- `apps-script` с исходным snapshot;
- `.clasp.json`, `.claspignore`, `appsscript.json` внутри `apps-script`;
- `AGENTS.md` и `.gitignore` в корне;
- документация, инструменты и исходный XLSX snapshot.

Рабочий путь короткий, латинский и не находится в Downloads/OneDrive.

## Проектные файлы

- `.clasp.json` существует в каноническом `apps-script`; полный Script ID не выводился.
- `appsscript.json` использует V8 и содержит `executionApi`.
- Snapshot содержит конфликтный набор 47 `.gs` и 31 `.js`; исправление относится к CODEX-01, не к PRE‑00.
- `AGENTS.md` установлен в корень проекта.

## Секреты

- Чувствительные файлы по имени не обнаружены.
- Известные сигнатуры токенов/ключей в текстовых файлах не обнаружены.
- Токены, Script Properties и содержимое `.clasprc.json` не читались.

## Блокирующие проблемы

Отсутствуют.

Неблокирующее замечание: полная актуальность Windows Update не подтверждена через графический интерфейс, хотя служба обновления работает.

## Безопасные следующие действия

Без установки программ можно:

1. После отдельного подтверждения начать CODEX‑00 — Runtime Access.

Требуют подтверждения пользователя:

1. Переход к CODEX‑00 и любые команды `clasp login/pull/push/run-function`.

## Не выполнялось

- установка ПО;
- `clasp login`;
- `clasp pull`;
- `clasp push`;
- `clasp run-function`;
- изменение Apps Script-кода;
- изменение Google Sheets;
- чтение секретов;
- CODEX-00 и последующие этапы.

## Решение gate

`ReadyForCodex00 = true`

PRE‑00 завершён. Переход к CODEX‑00 разрешён только отдельным следующим этапом.
