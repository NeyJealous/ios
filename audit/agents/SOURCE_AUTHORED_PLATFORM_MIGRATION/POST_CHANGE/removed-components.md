# Removed components and migration mapping

| Legacy content | Target |
|---|---|
| overlay role/instructions/output requirements | already present in canonical TOML |
| overlay model contract | top-level TOML plus model registry |
| overlay capability boundary | separate capability contract |
| overlay/composition/generated hashes | canonical profile SHA in Agent Integrity Registry |
| multiple upstream composition | one closest-role VoltAgent provenance record |
| generated provisional profile | canonical `.codex/agents/<id>.toml` |
| mutating file-copy activation | validation-only governance activation gate |

Removed live components: five overlays, five compositions, five generated
profiles, composition lock, composer, generated-profile validator, registry
builder, mutation activation/deactivation library and composition-specific
tests. Historical audit evidence and pinned upstream snapshots were retained.
