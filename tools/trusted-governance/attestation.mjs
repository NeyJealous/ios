import { validateJsonSchema } from '../json-schema-validator.mjs';

const TRUSTED_TRANSPORTS = new Set(['CODEX_RUNTIME_CHANNEL', 'GITHUB_OIDC_CHANNEL']);

export function evaluateTrustedAttestation({ attestation, schema, expected, transport, now, seenAttestationIds = [], seenReplayKeys = [], signatureVerifier, replayStore }) {
  const errors = validateJsonSchema(attestation, schema, { path: 'executionAttestation' });
  if (!TRUSTED_TRANSPORTS.has(transport)) {
    errors.push('ATTESTATION_ORIGIN_UNTRUSTED: repository/PR-authored evidence is insufficient');
  }
  const bindings = attestation?.bindings || {};
  for (const key of ['repository', 'branch', 'baseSha', 'headSha', 'profileHash', 'overlayHash']) {
    if (expected?.[key] !== undefined && bindings[key] !== expected[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
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
  for (const [key, actual] of expectedPaths) if (expected?.[key] !== undefined && actual !== expected[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
  if (attestation?.verification?.signatureVerified !== true) errors.push('ATTESTATION_SIGNATURE_NOT_VERIFIED');
  if (typeof signatureVerifier !== 'function' || signatureVerifier(attestation, expected) !== true) errors.push('ATTESTATION_SIGNATURE_CRYPTOGRAPHICALLY_UNVERIFIED');
  const evaluationTime = Date.parse(now || new Date().toISOString());
  const issuedAt = Date.parse(attestation?.issuedAt || '');
  const expiresAt = Date.parse(attestation?.expiresAt || '');
  const startedAt = Date.parse(attestation?.execution?.startedAt || '');
  const completedAt = Date.parse(attestation?.execution?.completedAt || '');
  const verifiedAt = Date.parse(attestation?.verification?.verifiedAt || '');
  const maxTtlMilliseconds = (expected?.maxTtlSeconds ?? 300) * 1000;
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
      if (expected?.[key] !== undefined && actual !== expected[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
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
