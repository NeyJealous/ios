# Шаблон Apps Script sync

## CONNECTION RECOVERY CHECK

`clasp push` запрещён без отдельного apply gate. До него: source hash/roundtrip,
checkpoint, target preview, guard и approval. Push выполняется один раз, после
него source comparison/status подтверждают exact state. Deployment — отдельная
operation и отдельное разрешение. После timeout push/deploy не повторять; при
`UNKNOWN` остановиться.

DoD: exact source verified, deployments явно сверены, checkpoints closed,
production writes посчитаны, unresolved UNKNOWN = 0.
