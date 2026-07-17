# Отчёт о публикации governance-изменений через pull request

Дата: 2026-07-17

## Исходное состояние

- Репозиторий: `NeyJealous/ios`.
- Каноническая ветка: `integration/ios-current`.
- Публикационная ветка:
  `codex/governance-and-ruleset-publication`.
- Рабочее дерево до публикации: чистое.
- Локальная каноническая ветка опережала remote ровно на три ожидаемых
  commits.
- Ruleset `19090538` имел состояние `active` и требовал pull request.

## Публикуемые исходные commits

Три ранее созданных commit SHA сохранены без `rebase`, `squash`, `amend`,
`cherry-pick` и переписывания истории:

1. `f344e71` — подтверждение применения ruleset, masked audit evidence, отчёт
   и план `CODEX-05`.
2. `00fb1b1` — доказательство фактического запрета прямого push.
3. `27e940a` — постоянная политика русского языка.

Этот отчёт добавлен отдельным документационным commit и не изменяет три
перечисленных commits.

## Pull request

- Номер: `#1`.
- Заголовок: «Публикация правил управления и доказательств защиты
  репозитория».
- URL: `https://github.com/NeyJealous/ios/pull/1`.
- Базовая ветка: `integration/ios-current`.
- Исходная ветка: `codex/governance-and-ruleset-publication`.
- Требуемый метод: merge commit без `squash` и `rebase`.

## Проверенный состав изменений

До merge подтверждено:

- изменение Apps Script runtime отсутствует;
- `.clasp.json` в отслеживаемом текущем дереве отсутствует;
- ZIP, private backup и private snapshot не отслеживаются;
- полные Account ID отсутствуют;
- токены, OAuth credentials и Script ID отсутствуют;
- current-tree privacy: `PASS`;
- deployments: 15, без изменений;
- записи в production: 0;
- CODEX-06-PRE сохранён на `aa2b10a` и не изменён.

## Защита ветки и bypass

Ruleset не отключался и не изменялся. Он блокирует deletion,
non-fast-forward update и прямые изменения без pull request, а также требует
один approval и разрешение обсуждений.

В репозитории один collaborator, поэтому владелец не может одобрить собственный
pull request. Если обычный merge блокируется только отсутствием внешнего
approval, разрешено использовать исключительно настроенный PR-scoped owner
bypass. Прямой push, force push и ослабление ruleset запрещены.

## Влияние на runtime и production

- Apps Script изменён: нет.
- `clasp push`: не выполнялся.
- Deployments изменены: нет.
- Записи в production: 0.
- Account Scope изменён: нет.
- Market Regime изменён: нет.
- AppliedMultiplier изменён: нет.
- Decision Engine, Rule R030 и TradePlan изменены: нет.

## Конфиденциальность

- Текущее дерево: `PASS`.
- Исторический риск:
  `ACCEPTED_PUBLIC_DOCUMENTED_RISK`.
- Git history не переписывалась.

## Аудиторская граница merge commit

Этот файл является частью самого pull request. GitHub создаёт SHA merge commit
только после фиксации содержимого PR, поэтому точный SHA невозможно включить в
этот файл без создания последующего изменения. SHA merge commit, итоговое
совпадение local/remote и удаление публикационной ветки подтверждаются
постфактум в итоговом ответе этапа и непосредственно в Git history.

## Готовность к следующему этапу

`CODEX-05` не запускается автоматически. После успешного merge, синхронизации
канонического worktree и финальных read-only проверок требуется отдельное
разрешение пользователя.
