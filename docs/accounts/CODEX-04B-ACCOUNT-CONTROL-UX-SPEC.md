# CODEX-04B Account Control UX Specification

## Architecture

`TI.AccountControl` является единственной write boundary для пяти scope-флагов. Browser UI не получает и не отправляет полный Account ID. Сервер выдаёт opaque `accountRef`, вычисленный из Account ID, а перед preview/apply повторно разрешает его по текущему реестру.

## Menu

`IOS → Счета`:

- Настроить счета
- Проверить настройки счетов
- Предпросмотр влияния
- История изменений
- Восстановить предыдущие настройки

## Account card

Форма показывает имя, тип, статус, masked ID, стратегии, позиции, сделки, объём истории, пять flags и предупреждения. Для очищенного исключённого счёта показываются статусы «Счёт исключён», «Данные очищены», «Архив доступен».

## Presets

- Полностью активный: `true/true/true/true/true`
- Только отображение и история: `true/false/true/false/true`
- Только история: `false/false/false/false/true`
- Синхронизация без расчётов: `true/false/false/false/true`
- Полностью исключён: `false/false/false/false/false`

## Preview and apply

Preview read-only показывает flag changes, API paths, calculation/display/recommendation sheets, необходимость Recalc и отдельного purge/restore gate. Apply требует global lock, inactive sync, matching `scopeRevision`, matching `previewHash`, validation, batch write and post-validation.

Включение/выключение flags само по себе не запускает sync, Recalc, purge или restore.
