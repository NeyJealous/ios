# Verification commands

```bash
git rev-parse HEAD
git status --short
git ls-files .codex/agents
npm ci
npm run agents:bootstrap
npm run agents:check
node tools/agents/validate-upstream-integrity.mjs
node tools/agents/validate-generated-agents.mjs
node tools/agents/validate-activation-boundary.mjs
node tools/publication-privacy-check.mjs
git diff --check
git diff --exit-code
```

Expected boundary status:
`NOT_DISPATCHED_RUNTIME_DISCOVERY_UNVERIFIED`.
The five files being present is not proof that the Codex runtime has discovered
their agent types.
