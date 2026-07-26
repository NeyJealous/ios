# Clean-machine setup

```bash
git clone https://github.com/NeyJealous/ios.git
cd ios
git checkout integration/ios-current
git verify-tag agent-platform-v2-first-wave-configured-v1
npm ci
npm run agents:bootstrap
npm run agents:check
git diff --exit-code
git status --short
```

Start a new Codex session from this repository only after the hash and clean
state checks pass. Do not activate a second wave, alter model contracts or
perform production writes.
