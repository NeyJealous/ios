# Матрица Connection Recovery Status

| Status | Достаточное evidence | Safe next step | Запрещено |
|---|---|---|---|
| `NOT_STARTED` | Нет локального/remote свидетельства начала | Создать локальный результат/checkpoint | Утверждать, что write была |
| `LOCAL_ONLY` | Локальный commit/result есть, remote отсутствует | Gate approval, затем одна write | Автоматический retry |
| `PUSH_COMPLETED` | Remote branch SHA точно равен expected SHA | Проверить существующий PR | Повторный push без нового operation |
| `PR_CREATED` | Один PR однозначно совпал по head/base | Ждать отдельного merge approval | Создать duplicate PR или merge без approval |
| `MERGED` | GitHub сообщает MERGED и merge commit | Следующий разрешённый gate | Повторный merge |
| `REMOTE_APPLY_COMPLETED` | Target status подтверждает точный apply/write | Закрыть checkpoint | Повторный apply/deploy |
| `UNKNOWN` | Evidence нет, stale, конфликтует или status недоступен | Остановиться; ручная read-only проверка | Любая автоматическая write/retry |

Допустимый прямой порядок:
`NOT_STARTED → LOCAL_ONLY → PUSH_COMPLETED → PR_CREATED → MERGED → REMOTE_APPLY_COMPLETED`.
Обратный переход означает конфликт наблюдения и переводит operation в
`UNKNOWN`. Из `UNKNOWN` выход возможен только по новому однозначному read-only
evidence.
