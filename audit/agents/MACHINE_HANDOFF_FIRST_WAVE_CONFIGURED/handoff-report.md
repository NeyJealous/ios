# Machine handoff — first wave configured

Clone `https://github.com/NeyJealous/ios.git` and check out
`integration/ios-current` at the SHA recorded in `canonical-sha.txt`.

Expected repository state:

- five tracked TOML profiles in `.codex/agents/`;
- five byte-identical staging profiles in
  `architecture/agents/generated/provisional/`;
- Registry/Matrix/Resolver state is configured and fail-closed;
- runtime discovery, activation and custom-agent smoke are not verified;
- production governance eligibility is false;
- ADR remains `DRAFT_NOT_ACCEPTED`.

The old laptop returned `unknown agent_type 'ios-agent-orchestrator'`. Do not
assume a global product limitation. The next machine must start with a fresh
clone and a fresh Codex session, verify exact hashes, then perform only the
diagnostic task in `next-codex-task.md`.

No credentials, cookies, session tokens, Account IDs or Script IDs are included
in this package.
