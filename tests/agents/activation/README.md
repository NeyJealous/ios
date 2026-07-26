# First-wave activation fixtures

These fixtures exercise the owner-gated development activation boundary. They
never grant production governance authority and use temporary repository
copies. The canonical runtime discovery directory is not used by negative
fixtures.

- `additional-profile.json`: rejects a sixth runtime profile.
- `profile-hash-mismatch.json`: rejects mutation of an approved staged profile.
- `spoofed-owner-decision.json`: rejects an unapproved owner decision ID.
- `rollback.json`: requires runtime discovery zero and fail-closed dispatch.
