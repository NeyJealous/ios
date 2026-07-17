# Шаблон task gate

## CONNECTION RECOVERY CHECK

- Активные операции/статусы:
- Незакрытые UNKNOWN: 0
- Pre-write guard/checkpoint/target preview:
- Post-write verification/evidence/close:
- Disconnect handler и resume plan при необходимости:
- Запрещённые повторы:

Обязательное правило: после timeout или неизвестного результата write не
повторяется; сначала read-only classification, при `UNKNOWN` — stop.

## Definition of Done

- все writes verified; checkpoints closed; duplicate writes отсутствуют;
- production writes явно посчитаны; unresolved UNKNOWN = 0.
