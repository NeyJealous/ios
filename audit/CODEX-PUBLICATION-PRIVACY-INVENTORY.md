# CODEX Publication Privacy Inventory

## Scope

- Branch: `integration/ios-current`
- Base: `ec5a0a7`
- Scope: tracked files and files planned for publication
- Secret and identifier values are intentionally omitted.

## Inventory summary

| Finding | Before | After | Classification | Remediation | Historical exposure | Publication decision |
| --- | ---: | ---: | --- | --- | --- | --- |
| Tracked `.clasp.json` | 0 | 0 | Private runtime configuration | Explicit recursive ignore rules verified | Three old paths remain in existing commits | Exclude from current publication tree |
| Personalized absolute-path files | 21 | 0 | Documentation, audit evidence, and one tooling file | Portable placeholders and runtime path resolution | Old commits retain prior text | Publish remediated current tree only |
| Tracked ZIP artifacts | 2 | 0 | Recovery artifact and redundant public-source archive | Removed from index; local files retained and ignored | Old commits retain blobs | Do not publish in canonical tree |
| Tracked spreadsheet backup/export | 1 | 0 | Private backup / production workbook | Removed from index; local file retained and ignored | Old commits retain blob | Do not publish in canonical tree |
| Production-derived row snapshots | 15 | 0 | Private audit/recovery artifacts | Removed from index; local files retained and ignored | Old commits retain blobs | Do not publish in canonical tree |
| Full production Account ID values | 0 | 0 | Secret identifier | Generic tracked-tree scan | No new exposure found | PASS |
| Production Script ID values | 0 | 0 | Private identifier | Generic tracked-tree scan | Historical `.clasp.json` risk documented separately | PASS for current tree |
| OAuth/access/refresh/API token values | 0 | 0 | Secret | Generic tracked-tree scan | No new exposure found | PASS |
| Private archive or backup directories | 0 | 0 | Private artifacts | Existing ignore rules retained | Not assessed as a history rewrite | PASS for current tree |

The broader portable-path scan found 21 tracked files rather than the earlier
14-file preliminary count because it also covered escaped JSON paths, generated
toolchain reports, and tooling imports. A round-trip evidence file generated
during this gate was immediately normalized to `<TEMP_ROOT>`, and its generator
was changed to keep future evidence portable.

## Historical `.clasp.json` findings

Current tree:

```text
tracked .clasp.json = 0
```

Historical paths, values not inspected or reproduced:

- Apps Script project runtime path
- bound-create runtime path
- legacy clean-copy runtime path

Unique historical paths: 3.

Status:

```text
HISTORICAL_EXPOSURE_DOCUMENTED
```

No history rewrite, filter operation, BFG operation, or force push was used.

## Local path remediation

Classifications:

- `D. AUDIT_REPORT`: generated audit Markdown/JSON paths replaced by
  `<REPO_ROOT>`, `<WORKTREE_ROOT>`, or `<TEMP_ROOT>`.
- `E. DOCUMENTATION`: canonical and historical report paths replaced by
  portable placeholders.
- `B. TOOLING`: the live snapshot tool now resolves the global clasp package,
  user home, and auth file at runtime or through environment variables.
- Generated round-trip evidence: temp output is recorded as `<TEMP_ROOT>`.

Runtime Apps Script business source was not modified.

## ZIP classification

### Source snapshot archive

- Size: 238467 bytes
- SHA-256: `C1BA562C812057B700060207ABDF3066B58D382DA25066CAAA137F48CB365A9F`
- Entries: 99
- Contains three `.clasp.json` entries
- Classification: `RECOVERY_ARTIFACT`
- Action: removed from Git index, retained locally, ignored

### Visual roadmap archive

- Size: 27408 bytes
- SHA-256: `1C63CD1139E3B1C4CB208999F9E5209DCB658C1CC1AA768DBB30BF2C5563177D`
- Entries: 6 (five SVG files and one HTML file)
- Credential-like entry names: 0
- Classification: `PUBLIC_SOURCE_ARCHIVE`, but redundant as a ZIP artifact
- Action: removed from Git index, retained locally, ignored

## Private spreadsheet backup

- Size: 2845680 bytes
- SHA-256: `81A008FA92317B7B83E1C8FCBCEC162FAB47BCFCD09EF63D20CC5AF26989717E`
- Classification: `PRIVATE_BACKUP`
- Action: removed from Git index, retained locally, ignored

The workbook filename and contents are not reproduced in this report.

## Production-derived snapshots

Fifteen JSON artifacts containing row-level account, portfolio, advisory,
trade-validation, or UI-model data were classified as private recovery/audit
snapshots. They were removed from the Git index and retained locally under
specific ignore rules. Count/digest-only audit evidence remains tracked.

## Test result

```text
CURRENT_TREE_PRIVACY = PASS
HISTORICAL_PRIVACY = DOCUMENTED_RISK
```

The current-tree scanner reports:

- tracked `.clasp.json`: 0
- personalized paths: 0
- tracked ZIP/spreadsheet/CSV exports: 0
- tracked private archive/backup paths: 0
- full Account ID findings: 0
- Script ID findings: 0
- secret value findings: 0
