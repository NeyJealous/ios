# Инструкции Codex: Connection Recovery

## Обязательное правило

> После timeout, network error, app crash или неизвестного результата внешней
> операции не повторяй её. Сначала используй Connection Recovery Protocol,
> установи фактический статус read-only проверками и продолжай только с первого
> подтверждённо незавершённого идемпотентного шага. При UNKNOWN остановись.

Правило действует для всех текущих и будущих gate, включая CODEX-05,
CODEX-06A+, research worktree, Git/GitHub, GitHub Actions, Apps Script,
Google Sheets, broker/API, IcePanel и любые production writes.

## CONNECTION RECOVERY CHECK

Перед remote write:

1. Подтвердить clean/expected worktree и baseline.
2. Проверить все активные checkpoints; `UNKNOWN` должен отсутствовать.
3. Запустить `connection-recovery.mjs start` и сохранить `operationId`.
4. Запустить `remote-write-guard.mjs`, проверить target, idempotency и preview.
5. Получить разрешение соответствующего gate.
6. Выполнить точную write-операцию ровно один раз.

После remote write:

1. Не считать exit code достаточным evidence.
2. Запустить `remote-write-verify.mjs` и сопоставить branch/commit/PR/run/deployment.
3. Сохранить санитизированное evidence и доказанный recovery status.
4. Закрыть checkpoint только после достижения expected state.

При disconnect:

1. Остановить retries.
2. Запустить `connection-disconnect-handler.mjs`.
3. Выполнить только read-only classification.
4. Сформировать resume plan. При `UNKNOWN` остановиться и запросить решение.

## Definition of Done для любого gate

- нет незакрытых `UNKNOWN` операций;
- все remote writes подтверждены целевой системой;
- recovery checkpoints закрыты;
- duplicate PR/push/deployment отсутствуют;
- production writes явно посчитаны;
- evidence санитизировано, реальные checkpoints не отслеживаются Git.
