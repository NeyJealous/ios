# IOS Agent Orchestrator — owner configuration view

- Status: `PROVISIONAL`
- Generated staging profile: `architecture/agents/generated/provisional/ios-agent-orchestrator.toml`
- Profile SHA-256: `ec85df02b13de9433041d1521947fbda8e01b55a3c14fd46cad9c4c9c876dd66`
- Model: `gpt-5.6-terra`, reasoning `medium`
- Upstream result: `UPSTREAM_UNCHANGED_BYTE_IDENTICAL`
- Activation eligible: `false`
- Runtime discovered: `false`

Upstream composition:

1. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/09-meta-orchestration/agent-organizer.toml` — `3bbd908a8a0664a9a57c8503151200a2855f8de9e1c3e98edc7d289fdfe269cf`
2. `VoltAgent/awesome-codex-subagents@5605c9c18b3687993919d6cc467af4a34898fee2:categories/09-meta-orchestration/agent-installer.toml` — `e1a7b8c709791e973cd8be5d32c548d8f49c3ef655a492de56aedb894dc77d82`
3. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/conductor/agents/conductor-validator.md` — `f7957d977522813b6d3f5ad4ecf3636b6fe7878c94d1a7d14665b7cbd411ced6`
4. `wshobson/agents@b6af3711058190e4b5c5274b9758498fe626ec5a:plugins/agent-teams/agents/team-lead.md` — `a87785bac5111c47e1160f64ef43ef58e6671fe7a96f9e0ac14c5f248c139a48`

IOS additions:

- invoke deterministic Resolver
- run PRE_CHANGE and POST_CHANGE phases
- separate mandatory and advisory agents
- build an acyclic execution DAG and parallel groups
- validate model availability without downgrade
- collect separate commit-bound reports
- stop on BLOCKER, CRITICAL, UNKNOWN or mandatory NOT_AVAILABLE

Prohibitions:

- install or remove agents
- modify global Codex profiles or user environment
- modify .codex/agents without a separate governance task
- update upstream automatically
- download unlocked profiles
- execute install scripts
- install packages
- mutate Registry or Model Registry autonomously
- activate agents or waves
- issue subject-matter verdicts
- self-review
- replace mandatory review with simulation
- merge, deploy, approve production or perform writes

The complete overlay, capability envelope, conflict register, annotated
upstream blocks and byte evidence are in
`audit/agents/FIRST_WAVE_CONFIGURATION_REVIEW/agents/ios-agent-orchestrator.md`.

Readiness: `READY_FOR_OWNER_ACTIVATION_REVIEW`; no activation was performed.
