import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { evaluateTrustedAttestation } from '../../tools/trusted-governance/attestation.mjs';

const root = resolve(import.meta.dirname, '../..');
const schema = JSON.parse(readFileSync(resolve(root, 'architecture/agents/schemas/execution-attestation.schema.json'), 'utf8'));
const gitSha = 'a'.repeat(40);
const headSha = 'b'.repeat(40);
const hash = 'c'.repeat(64);

function envelope() {
  return {
    schemaVersion: '1.0.0', attestationId: 'attestation-fixture-0001', nonce: 'nonce-fixture-00000001',
    issuedAt: '2026-07-22T00:00:00Z', expiresAt: '2026-07-22T00:02:00Z',
    issuer: { type: 'CODEX_RUNTIME_ATTESTER', issuerUri: 'https://attester.example.invalid', audience: 'ios-agent-governance', trustAnchorId: 'fixture-anchor' },
    subject: { agentId: 'architecture-reviewer', executionId: 'execution-0001', executionMode: 'REAL_SUBAGENT', independenceStatus: 'INDEPENDENT' },
    execution: { modelRequested: 'gpt-5.6-sol', modelResolved: 'gpt-5.6-sol', reasoningLevel: 'high', startedAt: '2026-07-22T00:00:00Z', completedAt: '2026-07-22T00:01:00Z', resultHash: hash },
    bindings: { repository: 'NeyJealous/ios', branch: 'feature/agent-platform-v2-integration', baseSha: gitSha, headSha, profileHash: hash, overlayHash: hash },
    ownerApproval: { required: false, decision: 'NOT_REQUIRED', evidenceRef: null, scope: null },
    verification: { status: 'VERIFIED', signatureVerified: true, verifiedAt: '2026-07-22T00:01:01Z', verifierId: 'fixture-verifier', envelopeHash: hash },
  };
}

const expected = { repository: 'NeyJealous/ios', branch: 'feature/agent-platform-v2-integration', baseSha: gitSha, headSha, profileHash: hash, overlayHash: hash, agentId: 'architecture-reviewer', modelRequested: 'gpt-5.6-sol', modelResolved: 'gpt-5.6-sol' };
const evaluation = { now: '2026-07-22T00:01:30Z' };

test('schema-valid PR-authored attestation remains insufficient evidence', () => {
  const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected, transport: 'PR_ARTIFACT', ...evaluation });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.some((error) => error.startsWith('ATTESTATION_ORIGIN_UNTRUSTED')));
});

test('trusted transport still rejects stale head and model bindings', () => {
  const claim = envelope(); claim.bindings.headSha = 'd'.repeat(40); claim.execution.modelResolved = 'gpt-5.6-terra';
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: headSha'));
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: modelResolved'));
});

test('owner-required claim cannot pass without attested approval', () => {
  const claim = envelope(); claim.ownerApproval = { required: true, decision: 'NOT_PROVIDED', evidenceRef: null, scope: null };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'GITHUB_OIDC_CHANNEL', ...evaluation });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('OWNER_APPROVAL_NOT_ATTESTED'));
});

test('APPROVED text without external owner evidence fields cannot pass', () => {
  const claim = envelope();
  claim.ownerApproval = { required: true, decision: 'APPROVED', evidenceRef: null, scope: null };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'GITHUB_OIDC_CHANNEL', ...evaluation });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('OWNER_APPROVAL_NOT_ATTESTED'));
});

test('fully bound envelope remains insufficient until trusted provider integration exists', () => {
  const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.structuralStatus, 'PASS');
  assert.deepEqual(result.errors, ['TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED']);
});

test('expired and replayed envelopes fail closed', () => {
  const claim = envelope();
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', now: '2026-07-22T00:03:00Z', seenAttestationIds: [claim.attestationId] });
  assert.equal(result.structuralStatus, 'FAIL');
  assert.ok(result.errors.includes('ATTESTATION_TIME_WINDOW_INVALID'));
  assert.ok(result.errors.includes('ATTESTATION_REPLAY_DETECTED'));
});
