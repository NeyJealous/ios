# CODEX-04A Flag Initialization Report

## Result

- Status: PASS
- Accounts verified: 3
- Account IDs unique: yes
- Target match: exactly one (`…864109`)
- Columns appended after the existing Account ID column: 5
- Boolean cells written in one batch: 15
- Checkbox validation: applied
- Existing Account ID, names and columns: unchanged
- Rollback snapshot: `CODEX04A_ACCOUNTS_FLAGS_BEFORE`
- Production purge: not performed

## Values

| Account ID suffix | Sync | Calculation | Display | Recommendations | History |
|---|---:|---:|---:|---:|---:|
| `…020546` | true | false | true | false | true |
| `…864109` | false | false | false | false | false |
| `…531683` | true | true | true | true | true |

The `…020546` values preserve the approved legacy `Включать в общий портфель=Нет` business semantics.

## Recovery after network interruption

- what completed before interruption: five headers and 15 boolean values were written atomically and verified.
- what was verified: current remote values exactly match the table above; the rollback snapshot still exists.
- what was resumed: read-only verification only.
- duplicate writes avoided: initializer was not rerun and no flag cell changed during recovery.
- final remote state: three unique accounts, 15 valid boolean values, no duplicate headers.
