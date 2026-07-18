# Baseline Agent Platform v2 migration

- Canonical branch: `integration/ios-current`
- Baseline SHA after fetch: `d2d60713e580fa1bcce8ba874216619598094093`
- Local/remote divergence: `0/0`
- Task branch: `feature/agent-platform-v2-integration`
- Separate task worktree: confirmed; machine-specific path intentionally omitted.
- Canonical and task worktrees: clean before audit writes.
- Unfinished Git operation: none.
- Agent Platform v2.1 SHA-256: `797d775c5bc899432ea1a1da836f2e295672e849347b238310f9186ceea9ce93`.
- Master Specification v4.0 package SHA-256: `a8e941965c140c88434dc14804c256b83a87da40ca896c0674be319863ace889`.
- VoltAgent candidate pin: `5605c9c18b3687993919d6cc467af4a34898fee2`.
- wshobson candidate pin: `b6af3711058190e4b5c5274b9758498fe626ec5a`.

## Baseline controls

- Existing governance validator: `PASS` (`12` registry entries, `20` rules).
- Current-tree privacy scan: `PASS` (`688` tracked files, no findings).
- Existing test suite: `FAIL` (`30` passed, `1` CRLF-sensitive failure).
- Mixed known/unknown resolver probe: `CRITICAL FAIL`.
- Production writes: `0`.
- `clasp push`: `0`.
- Deployment updates: `0`.
- Google Sheets writes: `0`.
- Broker/API writes: `0`.
- Market Regime production influence: `CLOSED`.
- AppliedMultiplier: `1.00` normative invariant; production runtime was not accessed.
