import { validateJsonSchema } from '../json-schema-validator.mjs';

const TRUSTED_TRANSPORTS = new Set(['CODEX_RUNTIME_CHANNEL', 'GITHUB_OIDC_CHANNEL']);

export function evaluateTrustedAttestation({ attestation, schema, expected, transport }) {
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
  if (attestation?.ownerApproval?.required && attestation.ownerApproval.decision !== 'APPROVED') errors.push('OWNER_APPROVAL_NOT_ATTESTED');
  return { status: errors.length ? 'INSUFFICIENT_EVIDENCE' : 'VERIFIED', errors: [...new Set(errors)].sort() };
}

export const trustedAttestationTransports = Object.freeze([...TRUSTED_TRANSPORTS]);
