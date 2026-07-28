# Rollback plan

Before merge, revert migration commits in reverse order. Do not run the retired
composer and do not overwrite `.codex/agents/`. If a runtime regression is
found, set the affected entry back to
`CANONICAL_SOURCE_PENDING_REVALIDATION`, keep activation closed, and open a
separate reviewed correction. Historical artifacts remain available in Git.
