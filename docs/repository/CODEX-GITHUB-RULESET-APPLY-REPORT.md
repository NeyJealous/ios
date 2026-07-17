# CODEX GitHub Ruleset Apply Report

Date: 2026-07-17

## Repository baseline

- Repository: `NeyJealous/ios`.
- Visibility: public.
- Default branch: `integration/ios-current`.
- Authenticated GitHub account: `NeyJealous`.
- Viewer permission: `ADMIN`.
- Canonical worktree was clean and synchronized before the gate.
- Existing rulesets before apply: 0.
- Classic branch protection before apply: absent.

## Approved preview

Source:

`audit/github/CODEX-GITHUB-RULESET-PREVIEW.json`

The preview was parsed and semantically checked before the API write:

- target: branch;
- enforcement: active;
- include: `refs/heads/integration/ios-current`;
- branch deletion blocked;
- non-fast-forward updates blocked;
- pull request required;
- required approvals: 1;
- stale approvals dismissed on new reviewable commits;
- review conversations must be resolved;
- required status checks: none, because stable CI checks do not yet exist;
- one necessary repository-owner bypass, restricted to pull-request context.

The owner bypass prevents a one-collaborator approval deadlock. It does not
bypass the deletion or non-fast-forward rules and is not an ordinary
direct-push exemption.

## Apply result

- Result: PASS.
- GitHub settings writes: 1.
- Ruleset ID: `19090538`.
- Name: `Protect integration/ios-current`.
- Source type: repository.
- Target: branch.
- Enforcement: active.
- Created: `2026-07-17T10:22:39.820+03:00`.
- Masked response:
  `audit/github/CODEX-GITHUB-RULESET-APPLY-RESPONSE.json`.

No token, authorization header, credential, Script ID, Account ID, or private
filesystem path is stored in the response artifact.

## Effective verification

GitHub read-only verification returned one active ruleset and confirmed that
three rules apply to `integration/ios-current`:

1. `deletion`;
2. `non_fast_forward`;
3. `pull_request` with one approval, stale-review dismissal, and required
   conversation resolution.

No destructive force-push or branch-deletion test was performed.

## Runtime and data safety

- Apps Script changed: no.
- `clasp push`: not performed.
- Deployments changed: no; inventory remains 15.
- Production writes: 0.
- Account Scope changed: no.
- Market Regime changed: no.
- AppliedMultiplier changed: no.
- Decision Engine, Rule R030, and TradePlan changed: no.

## Privacy

- Current-tree privacy: PASS.
- Historical privacy:
  `ACCEPTED_PUBLIC_DOCUMENTED_RISK`.
- Historical `.clasp.json` entries were not removed and Git history was not
  rewritten.

## Open risk and transition

```text
CRITICAL_ACTIVE_INFLUENCE_RISK = OPEN
AppliedMultiplier = NOT_APPROVED
CODEX-06A = BLOCKED
```

The next recommended stage is a separate `CODEX-05 — R030 Remediation Gate`.
This gate prepared its plan but did not start runtime analysis or changes.

## Decision

```text
GITHUB_RULESET_APPLY = PASS
CODEX_05_PLAN_ONLY = COMPLETE
CODEX_05_EXECUTION = NOT_STARTED
```
