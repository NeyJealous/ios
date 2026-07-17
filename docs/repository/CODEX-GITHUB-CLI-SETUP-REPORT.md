# CODEX GitHub CLI Setup Report

Date: 2026-07-17
Repository: `NeyJealous/ios`
Canonical branch: `integration/ios-current`

## 1. Windows environment

- Platform: Windows / PowerShell.
- Canonical worktree was clean and synchronized with
  `origin/integration/ios-current` before installation.
- Baseline policy commit: `895a7fe`.

## 2. GitHub CLI installation

- GitHub CLI version: `2.96.0`.
- Installation source: official `GitHub.cli` package from the `winget` source.
- Installation scope: current Windows user.
- The first machine-scope attempt waited on an unavailable interactive Windows
  installer prompt and was cancelled without leaving a registered package. A
  clean user-scope installation then completed successfully.

## 3. Authentication

- Method: GitHub browser/device OAuth.
- Authenticated account: `NeyJealous`.
- Host: `github.com`.
- Git protocol: HTTPS.
- Credential storage: Windows keyring, configured through GitHub CLI.
- No token value was requested, copied into project files, or included in this
  report.

## 4. Git credential helper

`gh auth setup-git --hostname github.com` completed successfully. Git has
host-specific GitHub CLI credential-helper entries for `github.com` and
`gist.github.com`; the system Git Credential Manager remains configured as the
general helper. Credential-store contents were not read.

## 5. Repository access

- Repository: `NeyJealous/ios`.
- Visibility: private.
- Viewer permission: `ADMIN`.
- Default branch: `integration/ios-current`.
- Remote branch access: PASS.
- Remote heads: one canonical branch.
- Remote tags: zero.
- Collaborators visible to the administrator: one.

## 6. Existing GitHub protection

- `gh ruleset list --parents` listed zero rulesets.
- Ruleset evaluation and REST ruleset inventory returned HTTP 403:
  GitHub reports that the private repository must be upgraded to GitHub Pro or
  made public to enable this feature.
- Classic branch-protection inventory returned the same HTTP 403, not HTTP 404.
  Classic protection is therefore `UNKNOWN` rather than confirmed absent.
- No ruleset or branch-protection write was performed.

## 7. Proposed ruleset

Preview:

`audit/github/CODEX-GITHUB-RULESET-PREVIEW.json`

The preview targets only `refs/heads/integration/ios-current` and proposes:

- active branch enforcement;
- deletion protection;
- non-fast-forward protection, which blocks force pushes;
- pull requests before merge;
- one approving review;
- stale-review dismissal;
- resolved review conversations;
- no required status checks until stable CI check names exist;
- a PR-scoped bypass for the sole repository owner.

The narrowly scoped owner bypass is necessary while the repository has one
collaborator: without it, a one-approval rule would make the owner unable to
merge. It does not bypass deletion or non-fast-forward rules and does not allow
ordinary direct feature integration.

The JSON parses locally. It is a preview only and must not be submitted while
the repository capability remains unavailable.

## 8. Technical availability

Automatic protection application is currently **not available** for this
private repository: both ruleset and classic-protection APIs return the GitHub
plan capability error. The repository administrator permission itself is
sufficient, but the repository plan is not.

After a separate approval and after GitHub enables the capability, the exact
creation command would be:

```powershell
gh api --method POST repos/NeyJealous/ios/rulesets `
  --input audit/github/CODEX-GITHUB-RULESET-PREVIEW.json
```

That command was not run.

## 9. Runtime and production safety

- GitHub protection writes: 0.
- Apps Script round-trip: PASS, 61/61 exact source matches.
- Apps Script source changes: 0.
- `clasp push`: not performed.
- Deployment changes: 0; inventory remains 15.
- Production writes: 0.
- Account Scope changes: 0.
- Market Regime, Decision Engine, Rule R030, and TradePlan changes: 0.

## 10. Open risk and next approval

```text
CRITICAL_ACTIVE_INFLUENCE_RISK = OPEN
AppliedMultiplier = NOT_APPROVED
CODEX-06A = BLOCKED
```

Recommended next decision for repository protection:

1. keep the repository private and enable a GitHub plan that supports rulesets
   or classic branch protection; or
2. defer automatic protection while keeping the documented manual gate policy.

Only after that decision should a separate protection-apply gate re-read the
live repository state, preview the exact write, and request explicit approval.
