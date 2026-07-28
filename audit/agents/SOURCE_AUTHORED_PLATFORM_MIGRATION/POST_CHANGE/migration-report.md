# Source-authored Agent Platform migration

The first-wave architecture now uses `.codex/agents/*.toml` as the sole profile
source. Provenance is metadata, capabilities remain separate, and integrity is
bound directly to canonical profile bytes. The generator, overlays,
compositions and generated staging profiles were retired.

Static validation passed. Fifteen sequential runtime scenarios passed: positive,
negative capability and escalation contract for each of five profiles.
Filesystem fingerprints were identical before and after every run. No fallback,
activation, production write, commit, push, PR or merge occurred during smoke.

ADR status remains `PROPOSED_AWAITING_OWNER_ACCEPTANCE`. Platform activation is
closed and outside this phase.

Post-change governance, security and documentation review dispatches were
attempted after runtime validation but did not start because the Codex usage
limit was reached. They are recorded as `NOT_AVAILABLE`, not PASS. This blocks
PR, merge and activation readiness; it does not invalidate the completed static
or profile-runtime evidence.
