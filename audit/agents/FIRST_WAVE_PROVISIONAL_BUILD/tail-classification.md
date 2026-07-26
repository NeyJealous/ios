# Uncommitted documentation/evidence tail classification

Baseline classification was performed before remediation without deleting,
restoring or committing the tail as-is.

| Path | Initial classification | Final disposition |
|---|---|---|
| `adr/ADR-AGENT-PLATFORM-V2.md` | remediation source | corrected and committed in `ce0dad427aff61ebd3c18986703599b180cc6e75` |
| `rfc/RFC-AGENT-PLATFORM-V2.md` | remediation source | corrected and committed in `ce0dad427aff61ebd3c18986703599b180cc6e75` |
| `architecture/agents/registry/activation-register.json` | generated report requiring regeneration | converted into the committed fail-closed activation register in `fcb49c9ac2f336b8d392cceb4fa5a2112432d179` |
| `FIRST_WAVE_PROVISIONAL_BUILD/test-evidence.json` | stale generated evidence | regenerated against implementation SHA `7c81e2e28f04e4bbf9e5e56744afbe600d99cfc1` |
| `agent-platform-acceptance-report.md` | stale generated evidence | regenerated after five final reviews |
| `agent-platform-gap-register.json` | stale generated evidence | regenerated with Phase 3C external gates preserved |
| `upstream-integrity-report.json` | stale generated evidence | regenerated after final upstream validation |

No historical hash-locked report was removed or rewritten. The four generated
untracked outputs were never accepted as evidence at their stale
`e77f1aa8a8fcaf31c04d7e5d656e2e41f5bb77df` binding.
