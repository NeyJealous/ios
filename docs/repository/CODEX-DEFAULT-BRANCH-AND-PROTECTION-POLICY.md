# CODEX Default Branch and Repository Protection Policy

## 1. Current repository state

- Remote: `https://github.com/NeyJealous/ios.git`
- Canonical branch: `integration/ios-current`
- Upstream: `origin/integration/ios-current`
- Remote heads: 1
- Remote tags: 0
- Remote HEAD: `refs/heads/integration/ios-current`
- Default branch status: `DEFAULT_BRANCH_INTEGRATION_IOS_CURRENT`
- Working tree at policy gate start: clean and synchronized

## 2. Default branch decision

```text
DEFAULT_BRANCH = integration/ios-current
```

`main` is intentionally not created at this stage.

Reasons:

- `integration/ios-current` is already the accepted and published canonical
  integration branch;
- runtime and documentation were validated together before publication;
- the repository is new and does not need a second permanent branch yet;
- creating `main` now would add branch ambiguity without providing a release
  boundary;
- architecture and remediation gates are still active;
- the R030 active-influence risk remains open.

GitHub's remote HEAD independently confirms `integration/ios-current` as the
current default branch.

## 3. Branching model

```text
integration/ios-current
  current canonical integration branch

feature/codex-*
  isolated implementation branches

integration/*
  intermediate branches that have passed their own integration gates

release/*
  future release candidates

main
  future stable production/release branch; not created yet
```

Rules:

- a feature branch never becomes canonical automatically;
- every merge into the canonical branch requires a separate integration gate;
- experimental and specification branches remain isolated until explicitly
  accepted for transfer;
- CODEX-06-PRE is not merged automatically;
- accepted tags remain local unless a separate tag-publication gate approves
  them;
- force push is prohibited;
- history rewrite is prohibited without a separate security decision.

## 4. Canonical branch protection policy

Target:

```text
integration/ios-current
```

Required protection:

1. Block force pushes.
2. Block branch deletion.
3. Require a pull request before merge.
4. Require at least one approving review.
5. Dismiss stale approvals when new commits materially change the review set.
6. Require all review conversations to be resolved.
7. Apply the policy to administrators where the repository plan and GitHub UI
   support it.
8. Do not allow bypass for ordinary feature integration.
9. Do not require linear history while accepted no-ff integration merges remain
   part of the project history model.

Direct pushes are allowed only during an explicitly authorized bootstrap or
emergency gate and must be documented. The first empty-repository publication
was such an approved bootstrap operation.

## 5. Required release and merge checks

Before any canonical merge or release:

- CONNECTION RECOVERY CHECK завершён: unresolved `UNKNOWN` = 0, pre-write
  guard и post-write evidence зафиксированы, checkpoints закрыты;
- working tree is clean;
- privacy scanner is PASS;
- tracked `.clasp.json`, secrets, full identifiers, private backups, production
  exports, and ZIP artifacts are absent;
- Apps Script syntax and scoped regression tests are PASS;
- duplicate top-level function scan is PASS;
- AccountScope and AccountControl contracts remain PASS when relevant;
- Apps Script source round-trip is exact;
- deployment inventory is recorded and unchanged unless a deployment gate
  explicitly authorizes a change;
- read-only gates report production writes as zero;
- branch-specific migration, rollback, and idempotency checks pass;
- the integration report identifies every runtime and documentation change.

После timeout/network error/app crash внешнюю операцию запрещено повторять до
read-only классификации. Timeout не является доказательством failure.

GitHub can require only status checks that exist in the repository. Until CI
workflows publish stable named checks, these validations remain mandatory
documented gate evidence. A later CI gate should expose at least:

```text
privacy
syntax-and-tests
source-round-trip
deployment-inventory
```

After those checks exist successfully on the branch, add them to the GitHub
required-status-check list.

## 6. Merge policy

- Unreviewed feature branches must not be merged into the canonical branch.
- Runtime conflicts are resolved file by file; whole-file ours/theirs selection
  is not an accepted default.
- Documentation-only branches are evaluated separately from runtime changes.
- A merge must preserve accepted privacy, rollback, and production-safety
  evidence.
- CODEX-06-PRE and other experimental branches are not auto-merged.
- R030 remediation must use its own isolated branch, tests, integration gate,
  and acceptance decision.

## 7. Secret and private-data handling

- Never commit `.clasp.json`, `.clasprc.json`, OAuth data, tokens, Script IDs,
  full Account IDs, private archive rows, spreadsheet backups, production
  exports, or local machine paths.
- Store GitHub authentication only through Git Credential Manager or another
  approved secure credential store.
- Credentials pasted into conversation or another non-secret channel are
  considered compromised and must be rotated.
- The credential disclosed before this gate was confirmed rotated before any
  policy work continued.
- Secret values must not appear in reports, audit evidence, shell commands,
  screenshots, or commit messages.
- Historical privacy remediation requires a separate security decision; no
  filter operation or force push is permitted by this policy gate.

## 8. Tag publication policy

- Local acceptance and readiness tags are not published automatically.
- `git push --tags`, `git push --mirror`, and implicit multi-tag publication are
  prohibited.
- Every remote tag requires separate authorization, an exact target commit, and
  a privacy/release pre-flight.
- Existing remote tags at this gate: 0.
- Existing local tags remain local.

## 9. Future `main` release criteria

Create `main` only through a separate release gate after all of the following:

1. Core runtime modules are stable and accepted.
2. `CRITICAL_ACTIVE_INFLUENCE_RISK` for Rule R030 is closed.
3. AppliedMultiplier has an explicitly approved safe status.
4. CODEX-06A and required successor stages are accepted.
5. CI provides stable mandatory privacy, test, source, and deployment checks.
6. Release versioning, rollback, tag, and deployment policies are documented.
7. The exact commit promoted from `integration/ios-current` is reviewed and
   approved.
8. The GitHub default branch and protection transition are explicitly
   authorized.

Until then, `integration/ios-current` remains the canonical default branch.

## 10. Manual GitHub protection steps

GitHub CLI is not installed in the current environment. No API workaround or
automatic settings mutation was attempted. Protection status is therefore:

```text
GITHUB_PROTECTION = MANUAL_REQUIRED
```

Repository administrator steps:

1. Open the repository on GitHub.
2. Open **Settings → Rules → Rulesets**. If rulesets are unavailable for the
   repository plan, use **Settings → Branches → Branch protection rules**.
3. Create a branch ruleset/rule targeting the exact branch name
   `integration/ios-current`.
4. Set the ruleset to active/enforced.
5. Enable deletion protection and block force pushes.
6. Require a pull request before merging.
7. Require at least one approval, dismiss stale approvals, and require resolved
   conversations.
8. Enable administrator enforcement or disable bypass where supported.
9. Do not add required status-check names until those checks have completed at
   least once and are selectable in GitHub.
10. When the named CI checks exist, require `privacy`, `syntax-and-tests`,
    `source-round-trip`, and `deployment-inventory`.
11. Confirm the repository default branch remains
    `integration/ios-current` under **Settings → General → Default branch**.
12. Save the rule and verify it with a separate protection-validation gate.

No `main` branch should be created during these manual steps.

## 11. Runtime and production impact

- Apps Script source changed: no
- `clasp push`: not performed
- Deployment changes: 0
- Production writes: 0
- Account Scope changes: 0
- Market Regime changes: 0
- Decision Engine or Rule R030 changes: 0

## 12. Next gate

```text
CODEX-05 — R030 Remediation Gate
```

The next gate must remove the legacy multiplier's active influence on buy
priority, keep Market Regime preview-only, and require separate approval before
any effect can reach executable recommendations or trades.

Current status remains:

```text
CRITICAL_ACTIVE_INFLUENCE_RISK = OPEN
AppliedMultiplier = NOT_APPROVED
CODEX-06A = BLOCKED
```
