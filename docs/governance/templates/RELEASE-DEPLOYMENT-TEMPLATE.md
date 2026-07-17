# Шаблон release/deployment

## CONNECTION RECOVERY CHECK

Зафиксировать target/version/hash, operationId, idempotency, preview и отдельное
deployment approval. Выполнить deployment ровно один раз. Затем status/get
должен подтвердить exact target и состояние `REMOTE_APPLY_COMPLETED`. Timeout
не означает failure; retry запрещён, `UNKNOWN` останавливает release.

DoD: deployment verified, checkpoint closed, duplicates = 0, production writes
явно посчитаны, unresolved UNKNOWN = 0.
