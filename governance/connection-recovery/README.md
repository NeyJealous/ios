# Connection Recovery Protocol

Эта директория задаёт обязательный lifecycle внешних операций IOS. Нормативное
правило: после timeout, network error, app crash или неизвестного результата
запись не повторяется. Сначала выполняется read-only проверка фактического
состояния; при `UNKNOWN` работа останавливается.

## Lifecycle

`NOT_STARTED → LOCAL_ONLY → PUSH_COMPLETED → PR_CREATED → MERGED → REMOTE_APPLY_COMPLETED`

Переход разрешён только по evidence целевой системы. Противоречивое,
отсутствующее или устаревшее evidence классифицируется как `UNKNOWN`.
Обратный переход запрещён. `UNKNOWN` блокирует новые записи того же типа до
ручной read-only верификации.

## Локальный workflow

```powershell
node tools/connection-recovery.mjs start --operation GIT_PUSH --gate CODEX-05 --branch feature/example --target GitHub --commit <sha>
node tools/remote-write-guard.mjs --operation GIT_PUSH --gate CODEX-05 --branch feature/example --target GitHub --commit <sha> --approved
# Вызывающий процесс выполняет ровно одну заранее показанную запись.
node tools/remote-write-verify.mjs --operation-id <id>
node tools/connection-recovery.mjs close --operation-id <id>
```

Доказанную невыполненную `NOT_STARTED`/`LOCAL_ONLY` operation можно закрыть как
superseded только явно:

```powershell
node tools/connection-recovery.mjs close --operation-id <old-id> --supersede --superseded-by <closed-successor-id> --reason "точная причина" --approved
```

Команда требует сохранённое evidence отсутствия исходного remote result,
более поздний закрытый successor того же типа/ветки и доказательство exact
remote post-state successor. `UNKNOWN`, неподтверждённый successor или отсутствие
явного approval всегда блокируют close. Recovery status не переписывается:
исходная operation остаётся исторически `LOCAL_ONLY`, но получает terminal
audit closure `supersededAt/supersededBy`.

Checkpoints записываются атомарно в `.audit/connection-recovery/`, исключены из
Git и всегда санитизируются. Реальные checkpoints, credentials, cookies,
Authorization headers, полные Script/Account ID и private payloads коммитить
запрещено.

Git/GitHub adapters запускают только `status`, `log`, `rev-parse`, `ls-remote`,
`pr list/view` и `run list/view`. Apps Script допускает только `clasp status` и
предоставленное санитизированное read-only status evidence. IcePanel и generic
API принимают только evidence из документированного GET/status/list endpoint;
если endpoint отсутствует или недоступен, результат — `UNKNOWN`.

Exit codes: `0` — состояние доказано и safe next step определён; `1` —
блокирующий конфликт; `2` — `UNKNOWN`/недостаточно evidence; `3` — неверное
использование или окружение.
