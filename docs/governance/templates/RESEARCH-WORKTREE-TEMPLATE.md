# Шаблон research worktree

## CONNECTION RECOVERY CHECK

Research worktree по умолчанию local/read-only. До любой remote write требуются
отдельная task branch, checkpoint, target preview, guard PASS и gate approval.
После write — read-only verification и close. После disconnect write не
повторять; handler + classification; при `UNKNOWN` остановиться.

DoD: unresolved UNKNOWN = 0, remote writes verified, production writes = 0.
