# CODEX-03 synchronization risks

| Severity | Finding | Consequence | Minimal treatment |
|---|---|---|---|
| Critical | BatchSync has no execution-wide lock | concurrent runs can overwrite state, triggers and sheets | one Script Lock spanning each active continuation and guarded state ownership |
| Critical | Full uses `Trades.rebuild()` | history is cleared before a full API reload | switch Full to incremental `Trades.sync()` after safety tests |
| High | no API counter/guard | Recalc zero-API cannot be proven | execution context plus guard in shared API boundaries |
| High | Quick contains heavy/unapproved steps | latency and unnecessary writes | reduce registry to canonical Quick outputs |
| High | state lacks Run ID and metrics | failures and partial completion are hard to audit | JSON-safe execution context and Diagnostics summary |
| High | multi-step run is not transactional | partial sheet freshness after a failure | explicit failed step, warnings, safe retry and per-step idempotence |
| Medium | direct Inflation fetch bypasses T-Invest wrapper | incomplete API accounting | common accounting hook at both HTTP boundaries |
| Medium | UI formatting runs in every mode | expensive repeated sheet operations | remove from Quick/Recalc unless explicitly needed |
| Medium | TechLog uses `appendRow` | slow under frequent warnings | batch only within synchronization logging path |
| Medium | DataCache has `setValue` inside stale-flag loop | many sheet writes | compute column values and write once |
| Medium | derived sheets clear then rewrite | failed write can leave an empty view | calculate first, then bounded batch replace/restore where critical |

No investment formula or allocation change is required for these treatments.
