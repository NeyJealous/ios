# Canonical first-wave configured acceptance

The non-squash merge at
`8d5cb22856fa66d43baf0bfdd798a0989715aef7` integrated feature source
`2899461187b9ab3d03c7e6264341737f2989f4bf` into
`integration/ios-current` without conflict.

Canonical validation passed after adding an explicit LF checkout policy for
versioned audit evidence and making historical hash assertions CRLF-safe. Git
blobs containing historical evidence were not rewritten.

- complete suite: 121 total, 119 pass, 0 fail, 2 skip
- clean checkout/bootstrap/reproducibility: PASS
- upstream integrity: PASS
- five staged and five tracked configured profiles: PASS
- old project profiles: absent
- second-wave profiles: absent
- Registry/Matrix/Resolver: PASS, fail-closed
- capability contracts: PASS, runtime enforcement unverified
- privacy: PASS
- non-agent safety validator: PASS

Runtime discovery and custom-agent smoke were not retried. The environment-
qualified blocker and unknown root cause remain open. This acceptance does not
claim `ACTIVE`, runtime validation, production readiness or trusted external
attestation.
