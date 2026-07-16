# CODEX-04B Audit and Rollback

## Audit trail

Реальный apply создаёт/дополняет append-only лист «История настроек счетов». Он хранит timestamp, masked ID, before/after flags, reason, preview hash, revisions, result и rollback availability.

Полный Account ID в audit sheet не записывается.

## Rollback

Перед batch write создаётся DocumentProperties snapshot с предыдущими flags и revision. Rollback:

- восстанавливает только пять flags;
- повторно проходит preview, validation, revision и lock checks;
- создаёт новый audit event;
- не восстанавливает Trades, Portfolio или cache;
- не запускает purge;
- не вызывает private archive restore;
- не запускает provider API.

NO_CHANGES apply не создаёт audit row и не изменяет rollback snapshot.
