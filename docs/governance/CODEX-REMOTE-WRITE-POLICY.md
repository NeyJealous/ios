# Политика внешних записей Codex

## Область действия

Внешней записью считается `git push`, создание/обновление/merge PR, workflow
dispatch, `clasp push`, deployment, Google Sheets write, broker/API write,
IcePanel import/snapshot и любая production mutation.

## До записи

Write разрешена только когда worktree clean и ожидаемый, checkpoint создан,
operationId зафиксирован, target однозначен, незакрытые `UNKNOWN` отсутствуют,
idempotency проверена, preview показан и gate approval получен. Guard сам write
не выполняет.

## После записи

Вызывающий процесс обязан немедленно выполнить read-only verification. Exit
code, timeout и отсутствие ответа не доказывают исход. Write никогда не
повторяется автоматически. Несовпадение SHA, неоднозначный PR или недоступный
status endpoint дают `UNKNOWN`.

## Специальные ограничения

- Force push и history rewrite запрещены.
- Merge и production writes требуют отдельного разрешения.
- Для target без idempotency/status endpoint автоматическое продолжение
  невозможно.
- Credentials, private payloads и полные Account/Script ID не входят в evidence.
- Workflow validation не получает production secrets и не выполняет write.
