# Шаблон PR/merge

## CONNECTION RECOVERY CHECK

До PR create выполнить read-only поиск по head/base. Один существующий PR даёт
`PR_CREATED` и повторное создание запрещено; несколько — `UNKNOWN`. После одной
PR_CREATE write проверить PR по head/base. Merge требует отдельного разрешения,
одной PR_MERGE operation и проверки `state=MERGED` + merge commit. Timeout не
разрешает повтор create/merge.

DoD: duplicate PR = 0, merge verified, checkpoints closed, unresolved UNKNOWN = 0.
