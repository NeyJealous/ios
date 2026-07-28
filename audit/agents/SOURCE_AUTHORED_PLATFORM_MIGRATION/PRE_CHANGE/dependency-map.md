# Dependency map

## Method

Repository-wide fixed-string searches were executed for:

`architecture/agents/overlays`, `APPEND_ONLY`, `overlayHash`, `overlayPath`,
`compose-agents`, `generated/provisional`, `composition-lock`,
`compositions/`, `upstreamCompositionHash`, `generatedHash`,
`activation manifest`, `activation gate`, `FULL_UNMODIFIED`,
`upstream snapshots`, `upstream-lock`, `upstream-selection-register`,
`activation-register`, `generated profile`, and
`runtime profile hash mismatch`.

Historical `audit/**` and `docs/reviews/**` are retained as evidence and are not
rewritten merely to remove old terminology.

## Confirmed execution graph

```text
npm/CI bootstrap
→ tools/agents/bootstrap.mjs
→ upstream/capability validators
→ tools/agents/compose-agents.mjs
→ overlays + compositions
→ generated/provisional profiles + composition-lock
→ generated/activation validators
```

```text
npm activation command
→ activate-first-wave.mjs
→ activation-lib.mjs
→ copy/remove .codex/agents profiles
→ mutate Registry + Matrix + activation/dispatch registers
```

```text
task preflight
→ Resolver/Review Matrix
→ orchestration-lib
→ Registry + model availability
→ fail-closed plan
```

The compositions are not consumed by the Resolver or runtime source profiles.
After multiple bases, overlays, generator and generated output are removed,
their remaining useful content is historical provenance/conflict metadata.
That data is migrated to audit evidence and minimal per-profile provenance;
composition has no independent live runtime function.

## Classification

### REMOVE after consumer migration

- `architecture/agents/overlays/*.yaml`
- `architecture/agents/compositions/*.yaml`
- `architecture/agents/generated/provisional/*.toml`
- `architecture/agents/registry/composition-lock.json`
- `tools/agents/compose-agents.mjs`
- mutating `tools/agents/activate-first-wave.mjs`
- mutating `tools/agents/deactivate-first-wave.mjs`
- write-capable portions of `tools/agents/activation-lib.mjs`
- composition/overlay/generated-only validators and test assertions

Removal order:

1. migrate semantic content and provenance;
2. introduce source validator/Integrity Registry;
3. switch Registry, bootstrap/check, CI and tests;
4. prove zero live consumer;
5. remove artifacts and re-run repository search.

### REPLACE

| Old artifact/contract | Replacement |
|---|---|
| `composition-lock.json` | `registry/agent-integrity-registry.yaml` |
| generated profile validator | strict canonical source profile validator |
| generated hash equality | raw canonical TOML SHA-256 binding |
| overlay append-only validator | exact source schema + preserved behavior/escalation contract tests |
| activation copy/deactivate commands | validate-only integrity/activation-readiness command |
| `NON_DISCOVERY_STAGING_BOUNDARY` | `CANONICAL_SOURCE_PROFILE_HASH` |
| `IOS_APPEND_ONLY_OVERLAY` | no replacement; source TOML is reviewed canonical content |
| generated staging bootstrap | read-only source validation bootstrap |

### RETAIN

- `.codex/agents/*.toml` as canonical source
- capability contracts and schema, with target enforcement-layer migration
- Review Matrix and deterministic Resolver
- security/privacy/secret scan
- review contract, manifests and SHA freshness controls
- base-pinned trusted verifier concept and stricter-union policy
- model registry/availability as policy evidence, without behavioral prompt
  authority
- upstream selection registers/candidates for broader 44-role historical/future
  provenance
- pinned upstream snapshots and license files as historical provenance
- all historical audit/review artifacts

### MIGRATE

- `architecture/agents/registry/agents.yaml`: remove overlay/composition/generated
  authority; bind canonical profile/integrity/capability/evidence fields
- `architecture/agents/agent-registry.yaml`: update or reduce to an explicitly
  derived compatibility projection
- `architecture/agents/review-matrix.yaml`: replace old required controls and
  staging paths with source/integrity controls
- `tools/agents/bootstrap.mjs`, `check.mjs`, validation libraries and workflows
- activation policy/register/manifests to non-mutating validation state
- capability enforcement layers and model/agent spawn denials
- RFC/ADR/AGENTS/docs status language
- tests/fixtures from overlay/generated/composition equality to source
  integrity and escalation-contract behavior

### ARCHIVE

- old composition membership/order/conflict-resolution metadata
- old generated profile hashes and activation hashes
- old overlay semantic mappings
- prior runtime failures and hash-mismatch evidence
- upstream snapshots that no longer participate in live runtime assembly

Archive means retain existing Git/audit history and record migration mapping.
It does not mean copy obsolete runtime artifacts into another live directory.

### OWNER_DECISION_REQUIRED

The current owner instruction resolves:

- source-authored architecture;
- current five TOMLs as full canonical baseline;
- current top-level models/reasoning, including orchestrator `Terra/high`;
- removal of multiple-base/overlay/generator requirements;
- replacement of composition lock;
- deferral of universal escalation agents and Obsidian Mind.

Still deferred to a later owner gate:

- final ADR acceptance;
- trusted bootstrap PR/canary/ruleset acceptance;
- external attestation provider;
- universal escalation implementation;
- platform activation;
- compatibility Registry removal if external consumers are later identified.

## High-impact live references to migrate

### Overlay/composition/generated consumers

- `architecture/agents/registry/agents.yaml`
- `architecture/agents/agent-registry.yaml`
- `architecture/agents/review-matrix.yaml`
- `architecture/agents/activation/*.json`
- `architecture/agents/registry/activation-register.json`
- `tools/agents/activation-lib.mjs`
- `tools/agents/bootstrap.mjs`
- `tools/agents/build-first-wave-registry.mjs`
- `tools/agents/compose-agents.mjs`
- `tools/agents/first-wave-validation-lib.mjs`
- `tools/agents/validate-generated-agents.mjs`
- `tools/agents/validate-activation-boundary.mjs`
- `tests/agent-governance/activation-boundary.test.mjs`
- `tests/agent-governance/first-wave-activation.test.mjs`
- `tests/agent-governance/first-wave-agent-validation.test.mjs`
- `tests/agent-governance/first-wave-platform.test.mjs`
- `.github/workflows/agent-governance.yml`
- `.github/workflows/trusted-agent-governance.yml`
- `package.json`
- root `AGENTS.md`
- `rfc/RFC-AGENT-PLATFORM-V2.md`
- `adr/ADR-AGENT-PLATFORM-V2.md`
- `docs/agents/FIRST_WAVE_CONFIGURATION/*.md`

### Attestation consumers

`overlayHash` remains present in historical execution-attestation schemas and
trusted attestation tooling. Those contracts must be versioned rather than
silently weakened. The target migration either:

- introduces a new source-profile attestation version using `profileSha256`
  and `capabilityContractSha256`; or
- keeps the old schema solely for historical evidence while new runtime claims
  use the new schema.

## Overlay semantic migration rule

Every overlay field is mapped before removal:

| Overlay content | Target |
|---|---|
| purpose/role instructions | existing canonical TOML developer instructions |
| fail-closed and forbidden actions | canonical TOML + capability contract |
| model primary binding | top-level TOML + Model Matrix |
| direct escalation routes | removed; replaced by `ESCALATION_REQUIRED` |
| owner approval boundaries | canonical TOML + platform policy |
| required output/evidence fields | canonical TOML output contract |
| triggers/routing | Review Matrix/Resolver, not profile self-authority |
| overlay status/activation flags | Integrity Registry and activation policy |
| append-only metadata | superseded; recorded in migration evidence |

The POST_CHANGE comparison must prove that no unique safety, role or output
requirement was lost.

## Fail-closed deletion criteria

An artifact is not deleted until all are true:

1. replacement exists and validates;
2. every live consumer has migrated;
3. semantic mapping is recorded;
4. historical evidence remains intact;
5. privacy/secret scan passes;
6. negative tests cover stale references and missing artifacts;
7. repository search finds no unclassified live reference;
8. activation and production gates remain closed.
