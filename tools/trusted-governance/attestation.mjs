import { validateJsonSchema } from '../json-schema-validator.mjs';

const TRUSTED_TRANSPORTS = new Set(['CODEX_RUNTIME_CHANNEL', 'GITHUB_OIDC_CHANNEL']);

export function evaluateTrustedAttestation({ attestation, schema, expected, transport, now, seenAttestationIds = [] }) {
  const errors = validateJsonSchema(attestation, schema, { path: 'executionAttestation' });
  if (!TRUSTED_TRANSPORTS.has(transport)) {
    errors.push('ATTESTATION_ORIGIN_UNTRUSTED: repository/PR-authored evidence is insufficient');
  }
  const bindings = attestation?.bindings || {};
  for (const key of ['repository', 'branch', 'baseSha', 'headSha', 'profileHash', 'overlayHash']) {
    if (expected?.[key] !== undefined && bindings[key] !== expected[key]) errors.push(`ATTESTATION_BINDING_MISMATCH: ${key}`);
  }
  if (expected?.agentId !== undefined && attestation?.subject?.agentId !== expected.agentId) errors.push('ATTESTATION_BINDING_MISMATCH: agentId');
  if (expected?.modelRequested !== undefined && attestation?.execution?.modelRequested !== expected.modelRequested) errors.push('ATTESTATION_BINDING_MISMATCH: modelRequested');
  if (expected?.modelResolved !== undefined && attestation?.execution?.modelResolved !== expected.modelResolved) errors.push('ATTESTATION_BINDING_MISMATCH: modelResolved');
  if (attestation?.verification?.signatureVerified !== true) errors.push('ATTESTATION_SIGNATURE_NOT_VERIFIED');
  const evaluationTime = Date.parse(now || new Date().toISOString());
  const issuedAt = Date.parse(attestation?.issuedAt || '');
  const expiresAt = Date.parse(attestation?.expiresAt || '');
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || issuedAt > evaluationTime || expiresAt <= evaluationTime || expiresAt <= issuedAt) errors.push('ATTESTATION_TIME_WINDOW_INVALID');
  if (seenAttestationIds.includes(attestation?.attestationId)) errors.push('ATTESTATION_REPLAY_DETECTED');
  if (attestation?.ownerApproval?.required && (
    attestation.ownerApproval.decision !== 'APPROVED' ||
    !attestation.ownerApproval.evidenceRef ||
    !attestation.ownerApproval.scope ||
    !attestation.ownerApproval.actorId ||
    !attestation.ownerApproval.approvedAt
  )) errors.push('OWNER_APPROVAL_NOT_ATTESTED');
  const structuralErrors = [...new Set(errors)].sort();
  if (!structuralErrors.length) structuralErrors.push('TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED');
  return {
    status: 'INSUFFICIENT_EVIDENCE',
    structuralStatus: structuralErrors.length === 1 && structuralErrors[0] === 'TRUSTED_ATTESTATION_PROVIDER_NOT_CONFIGURED' ? 'PASS' : 'FAIL',
    errors: structuralErrors,
  };
}

export const trustedAttestationTransports = Object.freeze([...TRUSTED_TRANSPORTS]);
