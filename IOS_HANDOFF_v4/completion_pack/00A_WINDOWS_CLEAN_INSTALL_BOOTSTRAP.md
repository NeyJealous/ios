# CODEX-PRE-00 — Подготовка чистой Windows к работе над IOS

## Назначение

Этот этап выполняется первым после чистой переустановки Windows.

Его цель — не менять проект, а доказать, что на компьютере установлены и корректно работают все инструменты, необходимые Codex для:

- чтения и изменения репозитория;
- работы с Git;
- запуска Node.js-скриптов;
- работы с Google Apps Script через `clasp`;
- запуска Codex локально;
- входа в Google и OpenAI;
- выполнения удалённых smoke tests;
- сохранения резервных копий;
- диагностики ошибок.

Переход к `CODEX-00 — Runtime Access` запрещён, пока этот этап не завершён.

---

# 1. Рекомендуемая среда

Основной вариант для этого проекта:

- Windows 11, полностью обновлённая;
- нативный PowerShell;
- нативный Windows sandbox Codex;
- проект хранится в обычной локальной папке, например:
  `C:\Projects\IOS`;
- WSL пока не использовать.

Почему: проект построен на Google Apps Script, Node.js и `clasp`, которым не требуется Linux. Нативная Windows-среда проще для браузерной авторизации Google и для пользователя без опыта программирования.

WSL2 использовать только если:

- нативный sandbox Codex стабильно не работает;
- появляется несовместимость конкретного инструмента;
- Codex явно требует Linux-native tooling.

Не смешивать один репозиторий между нативной Windows и WSL без отдельного решения.

---

# 2. Обязательные инструменты

## Системные

| Инструмент | Обязателен | Назначение |
|---|---:|---|
| Windows Update | Да | Безопасность и актуальные компоненты |
| WinGet | Да | Установка и обновление программ |
| PowerShell 7 | Да | Основная консоль и скрипты проверки |
| Windows Terminal | Рекомендуется | Удобная консоль |
| Браузер Edge или Chrome | Да | OAuth Google и вход в Codex |

## Разработка

| Инструмент | Обязателен | Требование |
|---|---:|---|
| Git for Windows | Да | Доступна команда `git` |
| Node.js LTS | Да | Версия не ниже 22; рекомендуется 24 LTS |
| npm | Да | Устанавливается вместе с Node.js |
| Visual Studio Code | Да | Основной редактор |
| Codex CLI | Да | Доступна команда `codex` |
| `@google/clasp` | Да | Доступна команда `clasp` |
| Codex IDE extension | Рекомендуется | Работа Codex внутри VS Code |

## Не обязательны для базового релиза

Не устанавливать без реальной необходимости:

- Python;
- Java/JDK;
- Docker Desktop;
- Google Cloud CLI;
- Visual Studio Community;
- отдельный сервер;
- базы данных;
- Yandex Cloud CLI.

Visual Studio Build Tools устанавливать только если Codex или его IDE extension выдаёт ошибку нативной зависимости.

---

# 3. Первый запуск проверки

Распакуй этот пакет.

Открой PowerShell 7 в папке проекта и выполни:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\tools\Check-IOSDevEnvironment.ps1 -ProjectPath "C:\Projects\IOS"
```

Скрипт:

- ничего не устанавливает;
- не меняет код;
- не читает токены;
- не выводит полный Script ID;
- создаёт отчёт:
  - `docs/environment/windows-toolchain-report.md`;
  - `docs/environment/windows-toolchain-report.json`.

Если проект пока не скопирован на компьютер:

```powershell
.\tools\Check-IOSDevEnvironment.ps1
```

---

# 4. Установка отсутствующих базовых инструментов

Сначала показать план без установки:

```powershell
.\tools\Install-IOSCoreTools.ps1
```

Для фактической установки:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\tools\Install-IOSCoreTools.ps1 -Apply
```

Скрипт устанавливает через WinGet:

- Git;
- Node.js LTS;
- Visual Studio Code;
- PowerShell 7;
- Windows Terminal.

После установки:

1. закрой все окна терминала;
2. перезагрузи Windows;
3. открой PowerShell 7;
4. повторно запусти установочный скрипт с `-Apply`.

На втором проходе он установит через npm:

```powershell
npm install -g @google/clasp @openai/codex
```

---

# 5. Ручная проверка после установки

В новом окне PowerShell 7:

```powershell
winget --version
pwsh --version
git --version
node --version
npm --version
clasp --version
clasp help
codex --version
code --version
```

Критерии:

- все команды найдены;
- Node.js имеет major version ≥ 22;
- `clasp help` содержит:
  - `login`;
  - `pull`;
  - `push`;
  - `show-file-status` или эквивалент;
  - `list-deployments` или эквивалент;
  - `run-function`;
- Codex запускается командой `codex`;
- VS Code запускается командой `code .`.

---

# 6. Настройка Git

Выполняется один раз. Подставить собственные данные:

```powershell
git config --global user.name "ВАШЕ ИМЯ"
git config --global user.email "ВАША ПОЧТА"
git config --global init.defaultBranch main
git config --global core.longpaths true
```

Не менять `core.autocrlf`, пока Codex не проверит `.gitattributes` проекта.

Проверка:

```powershell
git config --global --list
```

---

# 7. Подготовка рабочей папки

Рекомендуемая структура:

```text
C:\Projects\IOS\
  apps-script\
  docs\
  tests\
  tools\
  AGENTS.md
  .gitignore
  .clasp.json
```

Правила:

- не работать из `Downloads`, Desktop, OneDrive или временной папки;
- путь не должен содержать кириллицу и слишком длинные имена;
- не хранить проект одновременно в двух местах;
- не открывать один репозиторий одновременно из Windows и WSL;
- до первого изменения создать zip-копию папки.

---

# 8. Проверка файлов проекта

Codex должен подтвердить наличие:

- `.git`;
- `.gitignore`;
- `.clasp.json`;
- `.claspignore`;
- `appsscript.json`;
- `AGENTS.md`;
- папки Apps Script;
- Master Specification;
- тестовых файлов;
- текущего архива/backup.

Проверить, что `.gitignore` исключает:

```gitignore
.clasprc.json
client_secret*.json
credentials*.json
.env
.env.*
*.token
*.secret
node_modules/
```

Не удалять существующие правила `.gitignore`; только дополнять после review.

---

# 9. Авторизация Codex

В папке проекта:

```powershell
codex
```

Первый вход:

- выбрать `Sign in with ChatGPT`;
- использовать тот же аккаунт, которому доступен Codex;
- открыть `/status`;
- открыть `/permissions`;
- оставить sandbox включённым;
- не включать полный доступ ко всему диску.

Codex официально поддерживает нативную Windows-среду. Предпочтительный sandbox — `elevated`; при системной ошибке временно допускается `unelevated`.

Если Codex не читает папку проекта:

```text
/sandbox-add-read-dir C:\Projects\IOS
```

---

# 10. Авторизация Google и clasp

После проверки инструментов:

```powershell
clasp login
```

Использовать Google-аккаунт владельца Apps Script проекта.

Не размещать `.clasprc.json` в репозитории.

Далее в папке проекта выполнить команды, которые реально показывает текущий `clasp help`, например:

```powershell
clasp show-authorized-user
clasp show-file-status
clasp list-deployments
```

До `clasp pull` и `clasp push` Codex обязан сверить последние 6 символов Script ID, не выводя полный ID в отчёт.

---

# 11. Проверка доступа в интернет

Требуется HTTPS-доступ к:

- GitHub;
- npm registry;
- Google Apps Script;
- Google OAuth;
- ChatGPT/OpenAI.

Скрипт проверки тестирует TCP 443, но не выполняет вход и не передаёт токены.

Если Codex sandbox не имеет сети, это отдельная проблема permissions/sandbox, а не отсутствие Node.js или clasp.

---

# 12. Проверка русской кодировки

В PowerShell 7:

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
```

Проверка:

```powershell
"Проверка русского текста: Счета, Стратегии, Советник"
```

Файлы проекта должны сохраняться в UTF-8.

Не выполнять массовую перекодировку проекта до создания backup и проверки diff.

---

# 13. Отчёт Codex по PRE-00

Codex создаёт:

`docs/environment/PRE-00-WINDOWS-BOOTSTRAP-REPORT.md`

Структура:

1. Версия Windows.
2. Архитектура x64/ARM64.
3. Установленные инструменты и версии.
4. Отсутствующие инструменты.
5. Состояние PATH.
6. Состояние Git.
7. Состояние папки проекта.
8. Проверка обязательных файлов.
9. Проверка сети.
10. Состояние Codex sandbox.
11. Состояние `clasp login`.
12. Найденные риски.
13. Готовность к CODEX-00: Да/Нет.

Не включать:

- токены;
- OAuth client secret;
- полный Script ID;
- полный Spreadsheet ID;
- содержимое `.clasprc.json`;
- значения Script Properties.

---

# 14. Definition of Done

Этап завершён только если:

- Windows обновлена;
- WinGet работает;
- PowerShell 7 работает;
- Git работает и настроен;
- Node.js ≥ 22;
- npm работает;
- `clasp` установлен и показывает `run-function`;
- Codex CLI установлен и авторизован;
- VS Code установлен;
- рабочая папка проекта существует;
- обязательные проектные файлы найдены;
- credentials исключены из Git;
- русская кодировка отображается правильно;
- создан environment report;
- Codex подтверждает: `Готовность к CODEX-00: Да`.

После этого выполнять `CODEX-00 — Runtime Access`.
