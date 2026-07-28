import { validateJsonSchema } from '../json-schema-validator.mjs';

const TRUSTED_TRANSPORTS = new Set(['CODEX_RUNTIME_CHANNEL', 'GITHUB_OIDC_CHANNEL']);
const REQUIRED_EXPECTED_FIELDS = [
  'repository', 'branch', 'baseSha', 'headSha', 'profileHash', 'capabilityContractHash',
  'agentId', 'executionId', 'executionMode', 'independenceStatus',
  'modelRequested', 'modelResolved', 'reasoningLevel', 'startedAt', 'completedAt', 'resultHash',
  'issuerType', 'issuerUri', 'audience', 'trustAnchorId', 'verifierId', 'keyId',
  'ownerApprovalRequired', 'maxTtlSeconds',
];
const TRANSPORT_ISSUER = new Map([
  ['CODEX_RUNTIME_CHANNEL', 'CODEX_RUNTIME_ATTESTER'],
  ['GITHUB_OIDC_CHANNEL', 'GITHUB_OIDC_VERIFIED'],
]);

export function validateTrustedExpectedPlan(expected) {
  const errors = [];
  if (!expected || typeof expected !== 'object' || Array.isArray(expected)) return ['ATTESTATION_EXPECTED_PLAN_INVALID'];
  for (const key of REQUIRED_EXPECTED_FIELDS) if (!(key in expected)) errors.push(`ATTESTATION_EXPECTED_PLAN_MISSING: ${key}`);
  const stringFields = REQUIRED_EXPECTED_FIELDS.filter((key) => !['ownerApprovalRequired', 'maxTtlSeconds'].includes(key));
  for (const key of stringFields) if (typeof expected[key] !== 'string' || !expected[key].trim()) errors.push(`ATTESTATION_EXPECTED_PLAN_INVALID: ${key}`);
  for (const key of ['baseSha', 'headSha']) if (typeof expected[key] === 'string' && !/^[0-9a-f]{40}$/.test(expected[key])) errors.push(`ATTESTATION_EXPECTED_PLAN_INVALID: ${key}`);
  for (const key of ['profileHash', 'capabilityContractHash', 'resultHash']) if (typeof expected[key] === 'string' && !/^[0-9a-f]{64}$/.test(expected[key])) errors.push(`ATTESTATION_EXPECTED_PLAN_INVALID: ${key}`);
  for (const key of ['startedAt', 'completedAt']) if (typeof expected[key] === 'string' && !Number.isFinite(Date.parse(expected[key]))) errors.push(`ATTESTATION_EXPECTED_PLAN_INVALID: ${key}`);
  if (expected.executionMode !== 'REAL_SUBAGENT') errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: executionMode');
  if (expected.independenceStatus !== 'INDEPENDENT') errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: independenceStatus');
  if (!['low', 'medium', 'high', 'extra_high'].includes(expected.reasoningLevel)) errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: reasoningLevel');
  if (!['CODEX_RUNTIME_ATTESTER', 'GITHUB_OIDC_VERIFIED'].includes(expected.issuerType)) errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: issuerType');
  if (expected.audience !== 'ios-agent-governance') errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: audience');
  if (typeof expected.ownerApprovalRequired !== 'boolean') errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: ownerApprovalRequired');
  if (!Number.isInteger(expected.maxTtlSeconds) || expected.maxTtlSeconds < 1 || expected.maxTtlSeconds > 3600) errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: maxTtlSeconds');
  if (expected.ownerApprovalRequired === true) {
    for (const key of ['ownerEvidenceRef', 'ownerScope', 'ownerActorId', 'ownerApprovedAt']) if (typeof expected[key] !== 'string' || !expected[key].trim()) errors.push(`ATTESTATION_EXPECTED_PLAN_MISSING: ${key}`);
    if (typeof expected.ownerApprovedAt === 'string' && !Number.isFinite(Date.parse(expected.ownerApprovedAt))) errors.push('ATTESTATION_EXPECTED_PLAN_INVALID: ownerApprovedAt');
  }
  return errors;
}

export function evaluateTrustedAttestation({ attestation, schema, expected, transport, now, seenAttestationIds = [], seenReplayKeys = [], signatureVerifier, replayStore }) {
  const errors = validateJsonSchema(attestation, schema, { path: 'executionAttestation' });
  errors.push(...validateTrustedExpectedPlan(expected));
  if (!TRUSTED_TRANSPORTS.has(transport)) {
    errors.push('ATTESTATION_ORIGIN_UNTRUSTED: repository/PR-authored evidence is insufficient');
  }
  if (TRANSPORT_ISSUER.get(transport) && attestation?.issuer?.type !== TRANSPORT_ISSUER.get(transport)) errors.push('ATTESTATION_TRANSPORT_ISSUER_MISMATCH');
  const bindings = attestation?.bindings || {};
  for (const key of ['repository', 'branch', 'baseSha', 'headSha', 'profileHash', 'capabilityContractHash']) {
    if (bindings[key] !== expected?.[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
  }
  const expectedPaths = [
    ['agentId', attestation?.subject?.agentId], ['executionId', attestation?.subject?.executionId],
    ['executionMode', attestation?.subject?.executionMode], ['independenceStatus', attestation?.subject?.independenceStatus],
    ['modelRequested', attestation?.execution?.modelRequested], ['modelResolved', attestation?.execution?.modelResolved],
    ['reasoningLevel', attestation?.execution?.reasoningLevel], ['startedAt', attestation?.execution?.startedAt],
    ['completedAt', attestation?.execution?.completedAt], ['resultHash', attestation?.execution?.resultHash],
    ['issuerType', attestation?.issuer?.type], ['issuerUri', attestation?.issuer?.issuerUri],
    ['audience', attestation?.issuer?.audience], ['trustAnchorId', attestation?.issuer?.trustAnchorId],
    ['verifierId', attestation?.verification?.verifierId], ['keyId', attestation?.verification?.keyId],
  ];
  for (const [key, actual] of expectedPaths) if (actual !== expected?.[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
  if (attestation?.verification?.signatureVerified !== true) errors.push('ATTESTATION_SIGNATURE_NOT_VERIFIED');
  if (typeof signatureVerifier !== 'function' || signatureVerifier(attestation, expected) !== true) errors.push('ATTESTATION_SIGNATURE_CRYPTOGRAPHICALLY_UNVERIFIED');
  const evaluationTime = Date.parse(now || new Date().toISOString());
  const issuedAt = Date.parse(attestation?.issuedAt || '');
  const expiresAt = Date.parse(attestation?.expiresAt || '');
  const startedAt = Date.parse(attestation?.execution?.startedAt || '');
  const completedAt = Date.parse(attestation?.execution?.completedAt || '');
  const verifiedAt = Date.parse(attestation?.verification?.verifiedAt || '');
  const maxTtlMilliseconds = (Number.isInteger(expected?.maxTtlSeconds) ? expected.maxTtlSeconds : 0) * 1000;
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > evaluationTime || expiresAt <= evaluationTime || expiresAt <= issuedAt || expiresAt - issuedAt > maxTtlMilliseconds) errors.push('ATTESTATION_TIME_WINDOW_INVALID');
  if (![startedAt, completedAt, issuedAt, verifiedAt].every(Number.isFinite) || startedAt > completedAt || completedAt > issuedAt || issuedAt > verifiedAt || verifiedAt > evaluationTime) errors.push('ATTESTATION_TEMPORAL_ORDER_INVALID');
  const replayKey = [attestation?.issuer?.issuerUri, attestation?.attestationId, attestation?.nonce, attestation?.verification?.envelopeHash].join('|');
  if (seenAttestationIds.includes(attestation?.attestationId) || seenReplayKeys.includes(replayKey) || replayStore?.has?.(replayKey)) errors.push('ATTESTATION_REPLAY_DETECTED');
  const ownerRequired = expected?.ownerApprovalRequired === true;
  if (attestation?.ownerApproval?.required !== ownerRequired) errors.push('OWNER_APPROVAL_POLICY_MISMATCH');
  if (ownerRequired && (
    attestation.ownerApproval.decision !== 'APPROVED' ||
    !attestation.ownerApproval.evidenceRef ||
    !attestation.ownerApproval.scope ||
    !attestation.ownerApproval.actorId ||
    !attestation.ownerApproval.approvedAt
  )) errors.push('OWNER_APPROVAL_NOT_ATTESTED');
  if (ownerRequired) {
    for (const [key, actual] of [['ownerEvidenceRef', attestation.ownerApproval.evidenceRef], ['ownerScope', attestation.ownerApproval.scope], ['ownerActorId', attestation.ownerApproval.actorId], ['ownerApprovedAt', attestation.ownerApproval.approvedAt]]) {
      if (actual !== expected?.[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
    }
  }
  const structuralErrors = [...new Set(errors)].sort();
  if (!structuralErrors.length) structuralErrors.push('TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED');
  return {
    status: 'INSUFFICIENT_EVIDENCE',
    structuralStatus: structuralErrors.length === 1 && structuralErrors[0] === 'TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED' ? 'PASS' : 'FAIL',
    errors: structuralErrors,
  };
}

export const trustedAttestationTransports = Object.freeze([...TRUSTED_TRANSPORTS]);
