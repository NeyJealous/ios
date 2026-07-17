# CODEX First Canonical Remote Publication Report

## 1. Local canonical state

- Branch: `integration/ios-current`
- Canonical commit before report: `9a79238`
- Working tree before publication: clean
- Privacy-ready local tag: `ios-current-privacy-ready-20260717`
- Tag published: no

## 2. Remote configuration

- Remote: `origin`
- URL: `https://github.com/NeyJealous/ios.git`
- URL classification: approved project remote
- Existing mismatched remote replaced: no

## 3. Remote state before publication

- Heads: 0
- Tags: 0
- Repository classification: empty
- Existing default branch: none
- Fetch, pull, merge, or rebase before publication: not required

## 4. Privacy and release pre-flight

```text
CURRENT_TREE_PRIVACY = PASS
HISTORICAL_PRIVACY = ACCEPTED_DOCUMENTED_RISK
```

- tracked `.clasp.json`: 0
- tracked ZIP/private spreadsheet exports: 0
- personalized absolute paths: 0
- tracked private archive/backup paths: 0
- full Account ID findings: 0
- Script ID findings: 0
- credential/token value findings: 0
- working tree: clean

Three historical `.clasp.json` paths remain in existing commits. The user
explicitly accepted this documented residual risk for publication without a
history rewrite. No force push or history filtering was used.

## 5. Apps Script and production safety

- Apps Script source: `EXACT_MATCH`
- Round-trip: PASS, 61/61
- `clasp push` required: no
- `clasp push` performed: no
- Deployments: 15, unchanged
- Deployment operations: 0
- Production writes: 0
- Account flag changes: 0

## 6. Push dry-run

- Result: PASS
- Planned source: `integration/ios-current`
- Planned destination: `origin/integration/ios-current`
- Branch refs included: 1
- Tags included: 0
- Force: no
- Other branches included: 0

## 7. First publication

- Result: PASS
- Published commit: `9a79238`
- Published branch: `integration/ios-current`
- Upstream configured: `origin/integration/ios-current`
- Force used: no
- Tags published: no

## 8. Remote state after first push

- Remote heads: 1
- Head: `refs/heads/integration/ios-current`
- Remote tags: 0
- Remote HEAD: `refs/heads/integration/ios-current`
- Default branch status: `DEFAULT_BRANCH_INTEGRATION_IOS_CURRENT`

No `main` or `master` branch was created or published.

## 9. CODEX-06-PRE preservation

- Branch: `codex-06-pre-market-regime-spec`
- Commit: `aa2b10a`
- Worktree: clean
- Published in this gate: no
- Merged or cherry-picked: no

## 10. Open R030 risk

```text
CRITICAL_ACTIVE_INFLUENCE_RISK = OPEN
AppliedMultiplier = NOT_APPROVED
CODEX-06A = BLOCKED
```

This publication gate did not change Market Regime, Decision Engine, Rule R030,
or TradePlan.

## 11. Recommended next gate

Run a separate canonical-branch governance gate to decide whether to:

1. retain `integration/ios-current` as the protected default branch; or
2. create `main` under a separately approved branch policy.

Before CODEX-06A, complete the independent `CODEX-05 / R030 Remediation Gate`.
Do not publish CODEX-06-PRE or local tags without separate authorization.
