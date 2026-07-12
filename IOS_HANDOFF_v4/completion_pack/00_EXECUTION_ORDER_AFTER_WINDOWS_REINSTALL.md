# Порядок выполнения после чистой установки Windows

1. Прочитать `00A_WINDOWS_CLEAN_INSTALL_BOOTSTRAP.md`.
2. Запустить `tools\Install-IOSCoreTools.ps1` без `-Apply` для preview.
3. После подтверждения запустить с `-Apply`.
4. Перезагрузить Windows.
5. Выполнить:
   `tools\Check-IOSDevEnvironment.ps1 -ProjectPath "C:\Projects\IOS"`.
6. Проверить, что `ReadyForCodex00 = true`.
7. Скопировать `01_AGENTS.md` в корень проекта как `AGENTS.md`.
8. Выполнить `CODEX-PRE-00`.
9. Затем выполнить `CODEX-00 — Runtime Access`.
10. Далее CODEX-01—08 строго по очереди.

## Резервный путь

Если CODEX-00 не удалось завершить после документированной диагностики:

11. Прочитать `CODEX-00B_BROWSER_RUNTIME_FALLBACK.md`.
12. Выполнить CODEX-00B с отдельным Chrome-профилем.
13. Продолжить CODEX-01—07 через локальный Git + clasp push + browser-run.
14. CODEX-08 принимает browser-run только при наличии полного журнала Run ID и утверждения пользователя.

