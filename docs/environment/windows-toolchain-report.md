# Windows Toolchain Report

- Проверено: 2026-07-12 11:23:02 +03:00
- Готовность к CODEX-00: **Нет**
- Критических проблем: 5

| Категория | Проверка | Статус | Значение | Обязательная |
|---|---|---|---|---:|
| System | Windows | PASS | Майкрософт Windows 11 Pro 10.0.26100 build 26100 | Да |
| System | Architecture | PASS | AMD64 | Да |
| System | RAM | INFO | 15,4 GB | Нет |
| Tools | winget | PASS | v1.29.280 | Да |
| Tools | PowerShell 7 | PASS | PowerShell 7.6.3 | Да |
| Tools | Git | PASS | git version 2.55.0.windows.2 | Да |
| Tools | Node.js | PASS | v24.18.0 | Да |
| Tools | npm | PASS | 11.16.0 | Да |
| Tools | clasp | FAIL | NOT_FOUND | Да |
| Tools | Codex CLI | PASS | FOUND_BUT_VERSION_FAILED: Program 'codex.exe' failed to run: An error occurred trying to start process 'C:\Program Files\WindowsApps\OpenAI.Codex_26.707.3748.0_x64__2p2nqsd0c76g0\app\resources\codex.exe' with working directory 'C:\Users\NeyJealous\Documents\Инвест'. Отказано в доступе.At C:\Users\NeyJealous\Documents\Инвест\IOS_HANDOFF_v4\completion_pack\tools\Check-IOSDevEnvironment.ps1:34 char:19  +         $output = & $Command @Arguments 2>&1 \| Select-Object -First 1  +                   ~~~~~~~~~~~~~~~~~~~~~~~~~~. | Да |
| Tools | VS Code | PASS | 1.127.0 | Да |
| Compatibility | Node.js major >= 22 | PASS | 24 | Да |
| Git | user.name | FAIL | NOT_CONFIGURED | Да |
| Git | user.email | FAIL | NOT_CONFIGURED | Да |
| Network | github.com:443 | PASS | REACHABLE | Да |
| Network | registry.npmjs.org:443 | PASS | REACHABLE | Да |
| Network | script.google.com:443 | PASS | REACHABLE | Да |
| Network | oauth2.googleapis.com:443 | PASS | REACHABLE | Да |
| Network | chatgpt.com:443 | PASS | REACHABLE | Да |
| Project | Project path | PASS | C:\Users\NeyJealous\Documents\Инвест | Да |
| Project | .gitignore | FAIL | MISSING | Да |
| Project | .clasp.json | PASS | .\IOS_SOURCE_SNAPSHOT\work\apps-script\.clasp.json | Да |
| Project | .claspignore | PASS | .\IOS_SOURCE_SNAPSHOT\work\apps-script\.claspignore | Да |
| Project | appsscript.json | PASS | .\IOS_SOURCE_SNAPSHOT\work\apps-script\appsscript.json | Да |
| Project | AGENTS.md | FAIL | MISSING | Да |
| Project | Git repository | PASS | FOUND | Да |
| Project | clasp scriptId | PASS | ...5loFhY | Да |
| Project | clasp rootDir | INFO | . | Нет |
| Project | Apps Script runtime | PASS | V8 | Да |
| Project | executionApi | PASS | CONFIGURED | Да |
| Security | Sensitive files in repository | PASS | NONE_FOUND | Да |
| Encoding | UTF-8 Russian text | PASS | Счета / Стратегии / Советник | Да |

## Блокирующие проблемы

- **clasp:** NOT_FOUND Command 'clasp' is not available in PATH.
- **user.name:** NOT_CONFIGURED 
- **user.email:** NOT_CONFIGURED 
- **.gitignore:** MISSING 
- **AGENTS.md:** MISSING 
