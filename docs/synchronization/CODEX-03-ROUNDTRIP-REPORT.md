# CODEX-03 Round-trip Report

- Source: canonical local Apps Script directory.
- Destination: isolated `%TEMP%\ios-codex03-roundtrip-…` folder.
- Operation: read-only `clasp pull`; no pull over the working copy.
- Canonical files: 55.
- Exact normalized content/SHA-256 matches: 55.
- Mismatches: 0.
- Manifest: match.
- `.gs`/remote `.js` source: match.
- Top-level registry: local validation reports zero duplicates; remote source is byte-equivalent after extension/newline normalization.
- Production deployment count: 15, unchanged.

`ROUND_TRIP_MATCH = true`

Final post-recovery round-trip on 2026-07-15 compared 55 canonical files:

- exact matches: 55;
- mismatches: 0;
- temporary pull used only for read-only comparison.
