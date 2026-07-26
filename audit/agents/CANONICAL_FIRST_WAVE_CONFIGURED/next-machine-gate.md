# Next-machine gate

Use the clean-machine package at
`audit/agents/MACHINE_HANDOFF_FIRST_WAVE_CONFIGURED/`.

The next gate starts from a fresh clone and fresh Codex session. It verifies
remote canonical/tag SHA, exact file hashes, bootstrap reproducibility and the
runtime-supported catalog. It must stop on any unknown exact first-wave type.

No custom-agent runtime smoke, activation expansion, second wave or production
operation is authorized by this evidence.
