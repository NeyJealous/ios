#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIRST_WAVE = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor'];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
function forbiddenOverlayKeys(value, path = '', findings = []) {
  if (Array.isArray(value)) value.forEach((item, index) => forbiddenOverlayKeys(item, `${path}[${index}]`, findings));
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (/^(?:remove|replace|rewrite|override|upstreamOverrides)$/i.test(key)) findings.push(`${path}.${key}`);
    forbiddenOverlayKeys(child, path ? `${path}.${key}` : key, findings);
  }
  return findings;
}

export function validateGeneratedAgents(root) {
  const errors = [];
  try {
    const register = readJson(resolve(root, 'architecture/agents/registry/upstream-selection-register.yaml'));
    const upstreamLock = readJson(resolve(root, 'architecture/agents/registry/upstream-lock.json'));
    const compositionLock = readJson(resolve(root, 'architecture/agents/registry/composition-lock.json'));
    if (compositionLock.status !== 'PROVISIONAL' || compositionLock.activationAllowed !== false || compositionLock.agents.length !== FIRST_WAVE.length) errors.push('COMPOSITION_LOCK_INVALID');
    const lockByKey = new Map(upstreamLock.entries.map((entry) => [`${entry.repository}:${entry.sourcePath}`, entry]));
    for (const agentId of FIRST_WAVE) {
      const selection = register.selections.find((row) => row.agentId === agentId);
      const overlayPath = resolve(root, 'architecture/agents/overlays', `${agentId}.yaml`);
      const capabilityEnvelopePath = resolve(root, 'architecture/agents/contracts/capabilities', `${agentId}.json`);
      const compositionPath = resolve(root, 'architecture/agents/compositions', `${agentId}.yaml`);
      for (const path of [overlayPath, capabilityEnvelopePath, compositionPath]) if (lstatSync(path).isSymbolicLink()) errors.push(`${agentId}:SYMLINK_REJECTED`);
      const overlayBytes = readFileSync(overlayPath);
      const overlay = JSON.parse(overlayBytes.toString('utf8'));
      const capabilityEnvelopeBytes = readFileSync(capabilityEnvelopePath);
      const capabilityEnvelope = JSON.parse(capabilityEnvelopeBytes.toString('utf8'));
      const compositionBytes = readFileSync(compositionPath);
      const composition = JSON.parse(compositionBytes.toString('utf8'));
      if (overlay.agentId !== agentId || overlay.mode !== 'APPEND_ONLY' || overlay.status !== 'PROVISIONAL' || overlay.activationEligible !== false || overlay.platformActivationEligible !== false) errors.push(`${agentId}:OVERLAY_INVALID`);
      if (forbiddenOverlayKeys(overlay).length) errors.push(`${agentId}:OVERLAY_NOT_APPEND_ONLY`);
      if (overlay.modelContract?.silentDowngradeAllowed !== false || JSON.stringify(overlay.modelContract).includes('gpt-5.6-luna')) errors.push(`${agentId}:MODEL_CONTRACT_INVALID`);
      if (!Array.isArray(overlay.forbiddenActions) || !overlay.forbiddenActions.length || !Array.isArray(overlay.failClosedOn) || !overlay.failClosedOn.includes('UNKNOWN')) errors.push(`${agentId}:FAIL_CLOSED_OVERLAY_MISSING`);
      if (composition.agentId !== agentId || composition.status !== 'PROVISIONAL' || composition.activationEligible !== false || composition.platformActivationEligible !== false) errors.push(`${agentId}:COMPOSITION_STATUS_INVALID`);
      const expectedGeneratedPath = `architecture/agents/generated/provisional/${agentId}.toml`;
      if (composition.generatedPath !== expectedGeneratedPath || composition.generatedPath.includes('..') || composition.generatedPath.includes('\\')) errors.push(`${agentId}:GENERATED_STAGING_PATH_INVALID`);
      if (composition.overlayHash !== sha(overlayBytes) || composition.overlayPath !== `architecture/agents/overlays/${agentId}.yaml`) errors.push(`${agentId}:OVERLAY_HASH_MISMATCH`);
      if (composition.capabilityEnvelopeHash !== sha(capabilityEnvelopeBytes) || composition.capabilityEnvelopePath !== `architecture/agents/contracts/capabilities/${agentId}.json`) errors.push(`${agentId}:CAPABILITY_ENVELOPE_HASH_MISMATCH`);
      if (composition.capabilityContractStatus !== 'LOCALLY_VALIDATED' || composition.capabilityEvidenceStatus !== 'RUNTIME_ENFORCEMENT_UNVERIFIED') errors.push(`${agentId}:CAPABILITY_ENFORCEMENT_STATUS_INVALID`);
      if (!Array.isArray(composition.conflictResolution) || !composition.conflictResolution.length) errors.push(`${agentId}:CONFLICT_RESOLUTION_MISSING`);
      const expectedOrder = selection.selectedProfiles.map((profile) => `${profile.repository}:${profile.sourcePath}`);
      if (JSON.stringify(composition.compositionOrder) !== JSON.stringify(expectedOrder)) errors.push(`${agentId}:COMPOSITION_ORDER_MISMATCH`);
      if (composition.bases.length !== selection.selectedProfiles.length) errors.push(`${agentId}:BASE_COUNT_MISMATCH`);
      for (let index = 0; index < composition.bases.length; index += 1) {
        const base = composition.bases[index];
        const selected = selection.selectedProfiles[index];
        const locked = lockByKey.get(`${base.repository}:${base.sourcePath}`);
        if (!locked || base.inclusionMode !== 'FULL_UNMODIFIED' || base.repository !== selected.repository || base.commit !== selected.commitSha || base.profileId !== selected.profileId || base.rawHash !== selected.rawSha256 || base.normalizedHash !== selected.normalizedSha256 || base.snapshotPath !== locked.snapshotPath) errors.push(`${agentId}:BASE_BINDING_MISMATCH:${index}`);
      }
      const lockEntry = compositionLock.agents.find((item) => item.agentId === agentId);
      if (!lockEntry || lockEntry.compositionHash !== sha(compositionBytes) || lockEntry.overlayHash !== composition.overlayHash || lockEntry.capabilityEnvelopeHash !== composition.capabilityEnvelopeHash || lockEntry.upstreamCompositionHash !== composition.upstreamCompositionHash) errors.push(`${agentId}:COMPOSITION_LOCK_MISMATCH`);
      const profilePath = resolve(root, composition.generatedPath);
      if (existsSync(profilePath)) {
        const profileBytes = readFileSync(profilePath);
        const profileText = profileBytes.toString('utf8');
        const instructionLiteral = /^developer_instructions = (.+)$/m.exec(profileText)?.[1];
        let instructions = '';
        try { instructions = JSON.parse(instructionLiteral); } catch { errors.push(`${agentId}:GENERATED_INSTRUCTIONS_INVALID`); }
        if (composition.generatedHash !== sha(profileBytes) || lockEntry.generatedHash !== composition.generatedHash) errors.push(`${agentId}:GENERATED_HASH_MISMATCH`);
        if (!profileText.includes('# status = PROVISIONAL') || !profileText.includes('# activationEligible = false') || !profileText.includes(`# capabilityEnvelopeHash = ${sha(capabilityEnvelopeBytes)}`) || !instructions.includes(JSON.stringify(overlay, null, 2)) || !instructions.includes(JSON.stringify(capabilityEnvelope, null, 2))) errors.push(`${agentId}:GENERATED_METADATA_MISSING`);
        if (!profileText.includes(`model = ${JSON.stringify(overlay.modelContract.primaryModel)}`) || !profileText.includes(`model_reasoning_effort = ${JSON.stringify(overlay.modelContract.primaryReasoning)}`) || !profileText.includes('sandbox_mode = "read-only"')) errors.push(`${agentId}:GENERATED_MODEL_OR_SANDBOX_MISMATCH`);
        for (const base of composition.bases) if (!instructions.includes(readFileSync(resolve(root, base.snapshotPath), 'utf8'))) errors.push(`${agentId}:UPSTREAM_BASE_NOT_FULLY_INCLUDED`);
      } else if (composition.generatedHash !== null || lockEntry.generatedHash !== null) errors.push(`${agentId}:GENERATED_PROFILE_MISSING`);
    }
    const stagingDir = resolve(root, 'architecture/agents/generated/provisional');
    const staged = existsSync(stagingDir) ? readdirSync(stagingDir).filter((name) => name.endsWith('.toml')).sort() : [];
    const expected = FIRST_WAVE.map((id) => `${id}.toml`).sort();
    if (JSON.stringify(staged) !== JSON.stringify(expected)) errors.push('PROVISIONAL_STAGING_PROFILE_SET_INVALID');
    const agentDir = resolve(root, '.codex/agents');
    const discovered = existsSync(agentDir) ? readdirSync(agentDir).filter((name) => name.endsWith('.toml')).sort() : [];
    const activation = readJson(resolve(root, 'architecture/agents/registry/activation-register.json'));
    const active = activation.activationGate === 'OPEN_FOR_PROJECT_DEVELOPMENT';
    if (active) {
      if (JSON.stringify(discovered) !== JSON.stringify(expected)) errors.push('RUNTIME_DISCOVERY_ACTIVE_SET_INVALID');
      for (const name of expected) {
        if (existsSync(resolve(agentDir, name)) && sha(readFileSync(resolve(agentDir, name))) !== sha(readFileSync(resolve(stagingDir, name)))) {
          errors.push(`RUNTIME_PROFILE_HASH_MISMATCH:${name}`);
        }
      }
    } else if (discovered.some((name) => expected.includes(name))) errors.push('RUNTIME_DISCOVERY_CONTAINS_PROVISIONAL_PROFILE');
  } catch (error) { errors.push(error.message); }
  return { ok: errors.length === 0, agents: FIRST_WAVE.length, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
  const result = validateGeneratedAgents(root);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 2;
}
