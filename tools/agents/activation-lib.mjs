import {
  copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync,
  rmSync, writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';

export const FIRST_WAVE = [
  'ios-agent-orchestrator',
  'agent-governance-auditor',
  'security-privacy-auditor',
  'audit-traceability-reviewer',
  'ios-codebase-auditor',
];
export const STAGING_PATH = 'architecture/agents/generated/provisional';
export const DISCOVERY_PATH = '.codex/agents';
export const MANIFEST_PATH = 'architecture/agents/activation/first-wave-activation-manifest.json';
export const ROLLBACK_PATH = 'architecture/agents/activation/first-wave-rollback-manifest.json';
export const DISPATCH_PATH = 'architecture/agents/activation/first-wave-dispatch-manifest.json';
export const REGISTER_PATH = 'architecture/agents/registry/activation-register.json';
export const REGISTRY_PATH = 'architecture/agents/registry/agents.yaml';
export const MATRIX_PATH = 'architecture/agents/review-matrix.yaml';
export const COMPAT_REGISTRY_PATH = 'architecture/agents/agent-registry.yaml';

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const save = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

export function listRuntimeProfiles(root) {
  const directory = resolve(root, DISCOVERY_PATH);
  if (!existsSync(directory)) return [];
  if (lstatSync(directory).isSymbolicLink()) throw new Error('RUNTIME_DISCOVERY_SYMLINK_REJECTED');
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.toml'))
    .map((entry) => entry.name)
    .sort();
}

function expectedFiles() {
  return FIRST_WAVE.map((id) => `${id}.toml`).sort();
}

export function verifyActivationInputs(root) {
  const manifest = json(resolve(root, MANIFEST_PATH));
  const errors = [];
  if (manifest.ownerDecisionId !== 'OWNER_DECISION_ACTIVATE_FIRST_WAVE_20260727') errors.push('OWNER_DECISION_INVALID');
  if (manifest.productionGovernanceEligible !== false) errors.push('PRODUCTION_GOVERNANCE_MUST_REMAIN_FALSE');
  if (JSON.stringify([...manifest.agentIds].sort()) !== JSON.stringify(FIRST_WAVE.slice().sort())) errors.push('ACTIVATION_AGENT_SET_INVALID');
  for (const binding of manifest.agents || []) {
    const staged = resolve(root, STAGING_PATH, `${binding.agentId}.toml`);
    const composition = resolve(root, `architecture/agents/compositions/${binding.agentId}.yaml`);
    const overlay = resolve(root, `architecture/agents/overlays/${binding.agentId}.yaml`);
    const capability = resolve(root, `architecture/agents/contracts/capabilities/${binding.agentId}.json`);
    if (!existsSync(staged) || lstatSync(staged).isSymbolicLink()) errors.push(`${binding.agentId}:STAGED_PROFILE_MISSING_OR_UNSAFE`);
    else if (sha256(staged) !== binding.profileHash) errors.push(`${binding.agentId}:PROFILE_HASH_MISMATCH`);
    if (!existsSync(composition)) errors.push(`${binding.agentId}:COMPOSITION_MISSING`);
    else {
      const value = json(composition);
      if (value.upstreamCompositionHash !== binding.compositionHash) errors.push(`${binding.agentId}:COMPOSITION_HASH_MISMATCH`);
      if (value.overlayHash !== binding.overlayHash) errors.push(`${binding.agentId}:OVERLAY_BINDING_MISMATCH`);
      if (value.capabilityEnvelopeHash !== binding.capabilityHash) errors.push(`${binding.agentId}:CAPABILITY_BINDING_MISMATCH`);
    }
    if (!existsSync(overlay) || sha256(overlay) !== binding.overlayHash) errors.push(`${binding.agentId}:OVERLAY_HASH_MISMATCH`);
    if (!existsSync(capability) || sha256(capability) !== binding.capabilityHash) errors.push(`${binding.agentId}:CAPABILITY_HASH_MISMATCH`);
  }
  if ((manifest.agents || []).length !== FIRST_WAVE.length) errors.push('ACTIVATION_BINDINGS_INCOMPLETE');
  const runtime = listRuntimeProfiles(root);
  const additional = runtime.filter((name) => !expectedFiles().includes(name));
  if (additional.length) errors.push(`ADDITIONAL_RUNTIME_PROFILES:${additional.join(',')}`);
  return { ok: errors.length === 0, manifest, runtimeProfiles: runtime, errors };
}

function setRegistryState(root, active) {
  const registryPath = resolve(root, REGISTRY_PATH);
  const registry = json(registryPath);
  registry.platformState = active ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL_PLATFORM_BUILD';
  registry.activationAllowed = active;
  registry.activeAgents = active ? FIRST_WAVE.length : 0;
  registry.provisionalAgents = active ? 0 : FIRST_WAVE.length;
  for (const agent of registry.agents) {
    agent.status = active ? 'ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL';
    agent.activationEligible = active;
    agent.platformActivationEligible = false;
    agent.runtimeExecutionStatus = active ? 'RUNTIME_SMOKE_PENDING' : 'RUNTIME_PROFILE_NOT_YET_OBSERVED';
  }
  save(registryPath, registry);
  const compatPath = resolve(root, COMPAT_REGISTRY_PATH);
  const compat = json(compatPath);
  compat.Version = active ? '2.1.0-development-active' : '2.1.0-provisional';
  compat.PlatformState = active ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL_PLATFORM_BUILD';
  compat.ActiveCustomAgents = active ? FIRST_WAVE.length : 0;
  compat.ProvisionedAgents = FIRST_WAVE.length;
  compat.MandatoryAgentAvailability = active ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL_AVAILABLE_ACTIVATION_CLOSED';
  compat.ActivationAllowed = active;
  for (const agent of compat.Agents) {
    agent.Status = active ? 'IMPLEMENTED' : 'PROVISIONAL';
    agent.ActivationEligible = active;
  }
  save(compatPath, compat);

  const registerPath = resolve(root, REGISTER_PATH);
  const register = json(registerPath);
  register.platformState = registry.platformState;
  register.platformActivationEligible = false;
  register.activationGate = active ? 'OPEN_FOR_PROJECT_DEVELOPMENT' : 'CLOSED';
  register.activationCommand = 'node tools/agents/activate-first-wave.mjs';
  register.activationOperationStatus = active ? 'OWNER_AUTHORIZED_ACTIVE_RUNTIME_SMOKE_PENDING' : 'OWNER_AUTHORIZED_DEACTIVATED';
  register.runtimeDiscoveredPlatformAgents = active ? FIRST_WAVE.length : 0;
  register.activeAgents = active ? FIRST_WAVE.length : 0;
  register.ownerDecisionRequired = false;
  register.productionGovernanceEligible = false;
  register.provisionalAgents = register.provisionalAgents.map((item) => ({
    ...item,
    status: active ? 'ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL',
    activationEligible: active,
  }));
  save(registerPath, register);
  const matrixPath = resolve(root, MATRIX_PATH);
  const matrix = json(matrixPath);
  const oldControl = active ? 'activation-closed' : 'development-activation-owner-authorized';
  const newControl = active ? 'development-activation-owner-authorized' : 'activation-closed';
  const replaceControl = (value) => Array.isArray(value) ? value.map((item) => item === oldControl ? newControl : item) : value;
  matrix.BaselineControls = replaceControl(matrix.BaselineControls);
  matrix.Version = active ? '2.1.0-development-active' : '2.1.0-provisional';
  matrix.PlatformState = active ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL_PLATFORM_BUILD';
  for (const rule of matrix.Rules) rule.RequiredControls = replaceControl(rule.RequiredControls);
  matrix.FailClosed.MandatoryAvailability = active ? 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT' : 'PROVISIONAL_AVAILABLE_ACTIVATION_CLOSED';
  matrix.Transition.ActiveCustomAgents = active ? FIRST_WAVE.length : 0;
  matrix.Transition.ProvisionalAgents = active ? 0 : FIRST_WAVE.length;
  matrix.Transition.ActivationGate = active ? 'OPEN_FOR_PROJECT_DEVELOPMENT' : 'CLOSED';
  matrix.ExceptionPolicy.CannotDisableControls = replaceControl(matrix.ExceptionPolicy.CannotDisableControls);
  save(matrixPath, matrix);
  save(resolve(root, DISPATCH_PATH), {
    schemaVersion: '1.0.0',
    state: active ? 'ACTIVE_RUNTIME_SMOKE_PENDING' : 'NOT_DISPATCHED_ACTIVATION_CLOSED',
    agentIds: FIRST_WAVE,
    runtimeDiscoveryPath: DISCOVERY_PATH,
    runtimeDiscoveredPlatformAgents: active ? FIRST_WAVE.length : 0,
    productionGovernanceEligible: false,
    trustedExternalAttestation: 'MISSING',
  });
}

export function activateFirstWave(root, { dryRun = false } = {}) {
  const verification = verifyActivationInputs(root);
  if (!verification.ok) return { ...verification, operation: 'ACTIVATE', dryRun };
  const current = listRuntimeProfiles(root);
  if (current.length && JSON.stringify(current) !== JSON.stringify(expectedFiles())) {
    return { ok: false, operation: 'ACTIVATE', dryRun, errors: ['RUNTIME_PROFILE_SET_NOT_EXACT'] };
  }
  if (dryRun) return { ok: true, operation: 'ACTIVATE', dryRun, wouldDiscover: expectedFiles(), errors: [] };
  mkdirSync(resolve(root, DISCOVERY_PATH), { recursive: true });
  for (const id of FIRST_WAVE) {
    copyFileSync(resolve(root, STAGING_PATH, `${id}.toml`), resolve(root, DISCOVERY_PATH, `${id}.toml`));
  }
  setRegistryState(root, true);
  const after = verifyActivationInputs(root);
  const exact = JSON.stringify(after.runtimeProfiles) === JSON.stringify(expectedFiles());
  return { ok: after.ok && exact, operation: 'ACTIVATE', dryRun: false, runtimeProfiles: after.runtimeProfiles, errors: exact ? after.errors : [...after.errors, 'RUNTIME_PROFILE_SET_NOT_EXACT'] };
}

export function deactivateFirstWave(root, { dryRun = false } = {}) {
  const runtime = listRuntimeProfiles(root);
  const additional = runtime.filter((name) => !expectedFiles().includes(name));
  if (additional.length) return { ok: false, operation: 'DEACTIVATE', dryRun, errors: [`ADDITIONAL_RUNTIME_PROFILES:${additional.join(',')}`] };
  if (dryRun) return { ok: true, operation: 'DEACTIVATE', dryRun, wouldRemove: runtime, errors: [] };
  for (const name of expectedFiles()) {
    const path = resolve(root, DISCOVERY_PATH, basename(name));
    if (existsSync(path)) rmSync(path);
  }
  setRegistryState(root, false);
  return { ok: listRuntimeProfiles(root).length === 0, operation: 'DEACTIVATE', dryRun: false, runtimeProfiles: listRuntimeProfiles(root), errors: [] };
}
