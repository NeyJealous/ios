#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIRST_WAVE = [
  'ios-agent-orchestrator',
  'agent-governance-auditor',
  'security-privacy-auditor',
  'audit-traceability-reviewer',
  'ios-codebase-auditor',
];

export function validateActivationRequest(request, { expectedHead } = {}) {
  const errors = ['ACTIVATION_STATUS_MUTATION_NOT_IMPLEMENTED'];
  if (!request || typeof request !== 'object' || Array.isArray(request)) return [...errors, 'ACTIVATION_REQUEST_INVALID'];
  if (!expectedHead || request.headSha !== expectedHead) errors.push('STALE_ACTIVATION_EVIDENCE');
  if (request.integrityStatus !== 'PASS') errors.push('INTEGRITY_NOT_PASSED');
  if (request.discoveryStatus !== 'PASS') errors.push('DISCOVERY_NOT_PASSED');
  if (request.positiveSmokeStatus !== 'PASS') errors.push('POSITIVE_SMOKE_NOT_PASSED');
  if (request.negativeSmokeStatus !== 'PASS') errors.push('NEGATIVE_SMOKE_NOT_PASSED');
  if (request.ownerApprovalStatus !== 'APPROVED') errors.push('OWNER_APPROVAL_MISSING');
  if (request.adrStatus !== 'ACCEPTED') errors.push('ADR_NOT_ACCEPTED');
  if (request.authoritySource !== 'TRUSTED_EXTERNAL_ATTESTATION') errors.push('TRUSTED_ATTESTATION_MISSING');
  return [...new Set(errors)].sort();
}

export function validateActivationBoundary(root) {
  const errors = [];
  const discovery = resolve(root, '.codex/agents');
  const expected = FIRST_WAVE.map((id) => `${id}.toml`).sort();
  if (!existsSync(discovery) || lstatSync(discovery).isSymbolicLink()) {
    errors.push('CANONICAL_DISCOVERY_DIRECTORY_INVALID');
  } else {
    const actual = readdirSync(discovery, { withFileTypes: true })
      .filter((entry) => entry.name.endsWith('.toml'))
      .map((entry) => entry.name)
      .sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push('CANONICAL_PROFILE_SET_INVALID');
  }
  const registry = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/agents.yaml'), 'utf8'));
  const integrity = JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/agent-integrity-registry.yaml'), 'utf8'));
  if (registry.activationAllowed !== false || registry.activeAgents !== 0 ||
      registry.agents?.some((agent) => agent.activationEligible !== false || agent.platformActivationEligible !== false)) {
    errors.push('REGISTRY_ACTIVATION_NOT_CLOSED');
  }
  if (integrity.activationAllowed !== false) errors.push('INTEGRITY_REGISTRY_ACTIVATION_NOT_CLOSED');
  return {
    ok: errors.length === 0,
    platformState: registry.platformState,
    canonicalProfiles: FIRST_WAVE.length,
    runtimeDiscoveryPath: '.codex/agents',
    runtimeDispatchStatus: 'NOT_DISPATCHED_OWNER_ACTIVATION_REQUIRED',
    activationMutationImplemented: false,
    productionWrites: 0,
    errors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateActivationBoundary(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
