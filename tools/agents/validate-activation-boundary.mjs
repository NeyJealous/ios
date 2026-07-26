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

const EXPECTED_FILES = FIRST_WAVE.map((agentId) => `${agentId}.toml`).sort();
const STAGING_PATH = 'architecture/agents/generated/provisional';
const DISCOVERY_PATH = '.codex/agents';
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

function regularTomlFiles(directory, errors, label) {
  if (!existsSync(directory)) return [];
  if (lstatSync(directory).isSymbolicLink()) {
    errors.push(`${label}_SYMLINK_REJECTED`);
    return [];
  }
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.name.endsWith('.toml')) continue;
    const path = resolve(directory, entry.name);
    if (!entry.isFile() || lstatSync(path).isSymbolicLink()) errors.push(`${label}_UNSAFE_FILE:${entry.name}`);
    else files.push(entry.name);
  }
  return files.sort();
}

export function validateActivationRequest(request, { expectedHead } = {}) {
  const errors = [];
  if (!request || typeof request !== 'object' || Array.isArray(request)) return ['ACTIVATION_REQUEST_INVALID'];
  // Phase 3B deliberately has no activation operation or trusted external
  // verifier adapter. Repository-authored PASS/VERIFIED strings can describe
  // claims but can never authorize activation.
  errors.push('ACTIVATION_OPERATION_NOT_IMPLEMENTED');
  errors.push('TRUSTED_EXTERNAL_ACTIVATION_VERIFIER_NOT_IMPLEMENTED');
  if (!expectedHead || request.headSha !== expectedHead) errors.push('STALE_ACTIVATION_MANIFEST');
  if (!/^OWNER_ACTIVATION_[A-Z0-9_-]+$/.test(request.ownerDecisionId || '')) errors.push('OWNER_ACTIVATION_EVIDENCE_UNTRUSTED');
  if (request.adrStatus !== 'ACCEPTED') errors.push('ADR_NOT_ACCEPTED');
  if (request.trustedVerifierStatus !== 'VERIFIED') errors.push('TRUSTED_VERIFIER_NOT_VERIFIED');
  if (request.requiredReviewsStatus !== 'PASS') errors.push('REQUIRED_REVIEWS_NOT_PASSED');
  if (request.modelEligibilityStatus !== 'PASS') errors.push('MODEL_ELIGIBILITY_NOT_PASSED');
  if (request.externalEvidenceStatus !== 'PASS') errors.push('EXTERNAL_EVIDENCE_NOT_PASSED');
  if (request.authoritySource !== 'TRUSTED_EXTERNAL_ATTESTATION') errors.push('OWNER_ACTIVATION_EVIDENCE_UNTRUSTED');
  if (JSON.stringify([...(request.requestedAgents || [])].sort()) !== JSON.stringify(FIRST_WAVE.slice().sort())) errors.push('ACTIVATION_AGENT_SET_INVALID');
  return [...new Set(errors)].sort();
}

export function validateActivationBoundary(root) {
  const errors = [];
  const stagingDirectory = resolve(root, STAGING_PATH);
  const discoveryDirectory = resolve(root, DISCOVERY_PATH);
  const staged = regularTomlFiles(stagingDirectory, errors, 'PROVISIONAL_STAGING');
  const discovered = regularTomlFiles(discoveryDirectory, errors, 'RUNTIME_DISCOVERY');
  const discoveredPlatform = discovered.filter((name) => EXPECTED_FILES.includes(name));
  const additionalProfiles = discovered.filter((name) => !EXPECTED_FILES.includes(name));
  if (JSON.stringify(staged) !== JSON.stringify(EXPECTED_FILES)) errors.push('PROVISIONAL_STAGING_PROFILE_SET_INVALID');

  const registry = readJson(resolve(root, 'architecture/agents/registry/agents.yaml'));
  const activation = readJson(resolve(root, 'architecture/agents/registry/activation-register.json'));
  const active = activation.activationGate === 'OPEN_FOR_PROJECT_DEVELOPMENT';
  if (additionalProfiles.length) errors.push(`RUNTIME_DISCOVERY_ADDITIONAL_PROFILE:${additionalProfiles.join(',')}`);
  if (active) {
    if (JSON.stringify(discoveredPlatform) !== JSON.stringify(EXPECTED_FILES)) errors.push('RUNTIME_DISCOVERY_ACTIVE_SET_INVALID');
    if (registry.activationAllowed !== true || registry.activeAgents !== FIRST_WAVE.length ||
        registry.agents.some((agent) => agent.activationEligible !== true || agent.platformActivationEligible !== false)) {
      errors.push('REGISTRY_DEVELOPMENT_ACTIVATION_INVALID');
    }
  } else {
    if (discoveredPlatform.length) errors.push(`RUNTIME_DISCOVERY_CONTAINS_PROVISIONAL_PROFILE:${discoveredPlatform.join(',')}`);
    if (registry.activationAllowed !== false || registry.activeAgents !== 0 ||
        registry.agents.some((agent) => agent.activationEligible !== false)) errors.push('REGISTRY_ACTIVATION_GATE_OPEN');
  }
  for (const agentId of FIRST_WAVE) {
    const composition = readJson(resolve(root, `architecture/agents/compositions/${agentId}.yaml`));
    if (composition.generatedPath !== `${STAGING_PATH}/${agentId}.toml`) errors.push(`${agentId}:GENERATED_PATH_NOT_STAGED`);
  }

  if (!['CLOSED', 'OPEN_FOR_PROJECT_DEVELOPMENT'].includes(activation.activationGate) ||
      activation.runtimeDiscoveryPath !== DISCOVERY_PATH || activation.provisionalStagingPath !== STAGING_PATH ||
      activation.platformActivationEligible !== false || activation.productionGovernanceEligible === true) {
    errors.push('ACTIVATION_REGISTER_INVALID');
  }

  return {
    ok: errors.length === 0,
    platformState: registry.platformState,
    provisionalStagingProfiles: staged.length,
    runtimeDiscoveredPlatformAgents: discoveredPlatform.length,
    runtimeDispatchStatus: active ? 'ACTIVE_RUNTIME_SMOKE_PENDING' : 'NOT_DISPATCHED_ACTIVATION_CLOSED',
    activationCommand: activation.activationCommand,
    errors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateActivationBoundary(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
