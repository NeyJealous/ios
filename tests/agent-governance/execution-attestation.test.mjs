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
    issuedAt: '2026-07-22T00:01:00Z', expiresAt: '2026-07-22T00:03:00Z',
    issuer: { type: 'CODEX_RUNTIME_ATTESTER', issuerUri: 'https://attester.example.invalid', audience: 'ios-agent-governance', trustAnchorId: 'fixture-anchor' },
    subject: { agentId: 'architecture-reviewer', executionId: 'execution-0001', executionMode: 'REAL_SUBAGENT', independenceStatus: 'INDEPENDENT' },
    execution: { modelRequested: 'gpt-5.6-sol', modelResolved: 'gpt-5.6-sol', reasoningLevel: 'high', startedAt: '2026-07-22T00:00:00Z', completedAt: '2026-07-22T00:01:00Z', resultHash: hash },
    bindings: { repository: 'NeyJealous/ios', branch: 'feature/agent-platform-v2-integration', baseSha: gitSha, headSha, profileHash: hash, overlayHash: hash },
    ownerApproval: { required: false, decision: 'NOT_REQUIRED', evidenceRef: null, scope: null },
    verification: { status: 'VERIFIED', signatureVerified: true, verifiedAt: '2026-07-22T00:01:01Z', verifierId: 'fixture-verifier', envelopeHash: hash, signatureAlgorithm: 'EdDSA', keyId: 'fixture-key', signature: 'a'.repeat(86) },
  };
}

const expected = { repository: 'NeyJealous/ios', branch: 'feature/agent-platform-v2-integration', baseSha: gitSha, headSha, profileHash: hash, overlayHash: hash, agentId: 'architecture-reviewer', executionId: 'execution-0001', executionMode: 'REAL_SUBAGENT', independenceStatus: 'INDEPENDENT', modelRequested: 'gpt-5.6-sol', modelResolved: 'gpt-5.6-sol', reasoningLevel: 'high', startedAt: '2026-07-22T00:00:00Z', completedAt: '2026-07-22T00:01:00Z', resultHash: hash, issuerType: 'CODEX_RUNTIME_ATTESTER', issuerUri: 'https://attester.example.invalid', audience: 'ios-agent-governance', trustAnchorId: 'fixture-anchor', verifierId: 'fixture-verifier', keyId: 'fixture-key', ownerApprovalRequired: false, maxTtlSeconds: 300 };
const evaluation = { now: '2026-07-22T00:02:00Z' };
const cryptographicallyVerified = { signatureVerifier: () => true };

test('schema-valid PR-authored attestation remains insufficient evidence', () => {
  const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected, transport: 'PR_ARTIFACT', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.some((error) => error.startsWith('ATTESTATION_ORIGIN_UNTRUSTED')));
});

test('trusted transport still rejects stale head and model bindings', () => {
  const claim = envelope(); claim.bindings.headSha = 'd'.repeat(40); claim.execution.modelResolved = 'gpt-5.6-terra';
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: headSha'));
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: modelResolved'));
});

test('owner-required claim cannot pass without attested approval', () => {
  const claim = envelope(); claim.ownerApproval = { required: true, decision: 'NOT_PROVIDED', evidenceRef: null, scope: null };
  const ownerExpected = { ...expected, ownerApprovalRequired: true };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected: ownerExpected, transport: 'GITHUB_OIDC_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('OWNER_APPROVAL_NOT_ATTESTED'));
});

test('APPROVED text without external owner evidence fields cannot pass', () => {
  const claim = envelope();
  claim.ownerApproval = { required: true, decision: 'APPROVED', evidenceRef: null, scope: null };
  const ownerExpected = { ...expected, ownerApprovalRequired: true };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected: ownerExpected, transport: 'GITHUB_OIDC_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(result.errors.includes('OWNER_APPROVAL_NOT_ATTESTED'));
});

test('fully bound envelope remains insufficient until trusted provider integration exists', () => {
  const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.structuralStatus, 'PASS');
  assert.deepEqual(result.errors, ['TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED']);
});

test('expired and replayed envelopes fail closed', () => {
  const claim = envelope();
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', now: '2026-07-22T00:04:00Z', seenAttestationIds: [claim.attestationId], ...cryptographicallyVerified });
  assert.equal(result.structuralStatus, 'FAIL');
  assert.ok(result.errors.includes('ATTESTATION_TIME_WINDOW_INVALID'));
  assert.ok(result.errors.includes('ATTESTATION_REPLAY_DETECTED'));
});

test('complete owner approval is structurally valid but still not trusted', () => {
  const claim = envelope();
  claim.ownerApproval = {
    required: true, decision: 'APPROVED', evidenceRef: 'owner-decision:fixture-1',
    scope: 'PHASE_3A_ONLY', actorId: 'owner-fixture', approvedAt: '2026-07-22T00:00:30Z',
  };
  const ownerExpected = { ...expected, ownerApprovalRequired: true, ownerEvidenceRef: 'owner-decision:fixture-1', ownerScope: 'PHASE_3A_ONLY', ownerActorId: 'owner-fixture', ownerApprovedAt: '2026-07-22T00:00:30Z' };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected: ownerExpected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.equal(result.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(result.structuralStatus, 'PASS');
  assert.deepEqual(result.errors, ['TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED']);
});

test('signature boolean without external cryptographic verifier remains structurally invalid', () => {
  const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation });
  assert.equal(result.structuralStatus, 'FAIL');
  assert.ok(result.errors.includes('ATTESTATION_SIGNATURE_CRYPTOGRAPHICALLY_UNVERIFIED'));
});

test('all security-critical execution, issuer, owner-policy and replay bindings fail closed', () => {
  const claim = envelope();
  claim.subject.executionId = 'spoofed-execution';
  claim.execution.resultHash = 'd'.repeat(64);
  claim.issuer.trustAnchorId = 'spoof-anchor';
  const replayKey = [claim.issuer.issuerUri, claim.attestationId, claim.nonce, claim.verification.envelopeHash].join('|');
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, seenReplayKeys: [replayKey], ...cryptographicallyVerified });
  assert.equal(result.structuralStatus, 'FAIL');
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: executionId'));
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: resultHash'));
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: trustAnchorId'));
  assert.ok(result.errors.includes('ATTESTATION_REPLAY_DETECTED'));
});

test('schema enforces uri, maxLength and conditional owner approval semantics', () => {
  const claim = envelope();
  claim.issuer.issuerUri = 'not a uri';
  claim.attestationId = 'x'.repeat(257);
  claim.ownerApproval = { required: true, decision: 'NOT_PROVIDED', evidenceRef: null, scope: null };
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected: { ...expected, ownerApprovalRequired: true }, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.ok(result.errors.some((error) => error.includes('invalid uri')));
  assert.ok(result.errors.some((error) => error.includes('longer than maxLength')));
  assert.ok(result.errors.some((error) => error.includes('must equal schema const')));
});

test('incomplete trusted expected plan fails closed for every omitted security binding', () => {
  for (const key of Object.keys(expected)) {
    const incomplete = { ...expected };
    delete incomplete[key];
    const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected: incomplete, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
    assert.equal(result.structuralStatus, 'FAIL', key);
    assert.ok(result.errors.includes(`ATTESTATION_EXPECTED_PLAN_MISSING: ${key}`), key);
  }
});

test('undefined, null, empty and malformed trusted expected values fail closed', () => {
  const mutations = [
    ['repository', undefined], ['branch', null], ['modelRequested', ''],
    ['baseSha', 'not-a-sha'], ['profileHash', 'not-a-hash'],
    ['startedAt', 'not-a-date'], ['executionMode', 'CODEX_ROLE_SIMULATION'],
    ['independenceStatus', 'SELF_REVIEW'], ['reasoningLevel', 'unknown'],
    ['issuerType', 'PR_AUTHORED'], ['audience', 'other'],
    ['ownerApprovalRequired', null], ['maxTtlSeconds', 0],
  ];
  for (const [key, value] of mutations) {
    const malformed = { ...expected, [key]: value };
    const result = evaluateTrustedAttestation({ attestation: envelope(), schema, expected: malformed, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
    assert.equal(result.structuralStatus, 'FAIL', key);
    assert.ok(result.errors.some((error) => error === `ATTESTATION_EXPECTED_PLAN_INVALID: ${key}` || error === `ATTESTATION_EXPECTED_PLAN_MISSING: ${key}`), key);
  }
});

test('trusted transport and issuer class must be paired', () => {
  const claim = envelope();
  claim.issuer.type = 'GITHUB_OIDC_VERIFIED';
  const result = evaluateTrustedAttestation({ attestation: claim, schema, expected, transport: 'CODEX_RUNTIME_CHANNEL', ...evaluation, ...cryptographicallyVerified });
  assert.ok(result.errors.includes('ATTESTATION_TRANSPORT_ISSUER_MISMATCH'));
  assert.ok(result.errors.includes('ATTESTATION_BINDING_MISMATCH: issuerType'));
});
