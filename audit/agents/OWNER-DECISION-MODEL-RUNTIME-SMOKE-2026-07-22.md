# Owner decision — runtime model set and smoke evidence

Date: `2026-07-22`

The repository owner required actual Codex runtime smoke for the Agent Platform model set:

- Terra;
- Luna;
- Sol;
- Sol Ultra.

Availability may be assigned only from the actual runtime request and provider/execution response. UI, documentation and capability-list assumptions are not accepted as availability evidence.

For this amendment, Sol Ultra means the exact runtime request `gpt-5.6-sol` with reasoning level `ultra`; it is neither an invented separate slug nor a silent replacement for historical Sol Pro policy. Historical Sol Pro reports and manifests remain immutable evidence of their earlier gate, but their model-set statements are superseded for current availability routing by this owner instruction, RFC draft amendment and `architecture/agents/registry/model-availability.yaml` version `1.1.0`.

This decision authorizes recording smoke results. It does not accept the draft ADR, activate an agent, waive trusted attestation, authorize a model substitution, or authorize production/remote writes.
