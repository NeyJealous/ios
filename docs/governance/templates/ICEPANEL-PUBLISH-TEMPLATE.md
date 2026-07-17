# Шаблон IcePanel publish

## CONNECTION RECOVERY CHECK

До import/snapshot: official target GET, checkpoint, idempotency/uniqueness,
preview и approval. Import/snapshot выполняется ровно один раз. После ответа или
disconnect — только official GET/status. При отсутствии endpoint либо
неоднозначном snapshot/import status — `UNKNOWN`, no retry.

DoD: exact object/version verified, checkpoint closed, duplicate snapshot/import
отсутствует, unresolved UNKNOWN = 0.
