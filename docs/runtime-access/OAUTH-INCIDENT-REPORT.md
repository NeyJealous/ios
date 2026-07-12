# OAuth Incident Report

## Incident

- Stage: `CODEX-00 — Runtime Access`
- Classification: `OAUTH_DEFAULT_CLIENT_BLOCKED`
- Symptom: Google blocked the built-in/default OAuth client used by a normal `clasp login`.
- Recorded: 2026-07-12

## Remediation state

- `clasp`: 3.3.0
- Standard Cloud Project: `IOS Development` (suffix `502201`)
- Apps Script Cloud Project: standard; Project Number suffix `813597`
- Google Auth Platform: External / Testing
- Test users: owner only
- Google Apps Script API: enabled
- OAuth client: Desktop app, `IOS clasp local`, user-provided
- Credentials: stored outside Git in the owner profile
- Apps Script suffix: `5loFhY`
- API Executable: existing version 15; access limited to owner
- Runtime verification: `TI_RemoteHealthCheck` succeeded in dev mode with `ok = true` and 40 sheet names.

## Safety

- Billing was not enabled.
- Google Drive API was not enabled.
- Production and OAuth verification were not started.
- Deployment access was not expanded.
- Investment logic was not changed.
- No credentials, tokens, full IDs, or secrets are included here.
