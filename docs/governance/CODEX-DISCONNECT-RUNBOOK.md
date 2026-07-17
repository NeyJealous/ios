# Runbook: disconnect и неизвестный результат

## Немедленные действия

1. Не повторять последнюю внешнюю операцию.
2. Зафиксировать время и последний шаг в локальном checkpoint.
3. Запустить disconnect handler по operationId.
4. Проверить локальный Git и удалённый status только read-only командами.
5. Присвоить доказанный status; при конфликте выбрать `UNKNOWN`.

## Read-only источники

- Git: status, log, rev-parse, ls-remote.
- GitHub: pr list/view и run list/view.
- Apps Script: clasp status и status/list/get evidence; push/deploy запрещены.
- IcePanel/API: только официальный GET/status/list endpoint.

Если read-only endpoint отсутствует, недоступен или evidence устарело,
`recoveryStatus = UNKNOWN`.

## Resume plan

План обязан указать доказанное состояние, выполненные и недоказанные шаги,
первый безопасный незавершённый шаг, необходимость пользовательского
разрешения и список запрещённых повторов. При `UNKNOWN` единственный следующий
шаг — ручная read-only проверка/решение пользователя; write запрещена.

Повторный запуск handler идемпотентен: он добавляет verification history, но не
выполняет внешнюю запись и не ослабляет status.
