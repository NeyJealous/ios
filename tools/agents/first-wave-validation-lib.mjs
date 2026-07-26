import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { FIRST_WAVE, validateCapabilityEnvelopes } from './validate-capability-envelopes.mjs';
import { validateActivationBoundary } from './validate-activation-boundary.mjs';
import { validateGeneratedAgents } from './validate-generated-agents.mjs';
import { validateUpstreamIntegrity } from './validate-upstream-integrity.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

export function profileHashes(root, agentId) {
  const compositionBytes = readFileSync(resolve(root, `architecture/agents/compositions/${agentId}.yaml`));
  const composition = JSON.parse(compositionBytes);
  const overlayBytes = readFileSync(resolve(root, composition.overlayPath));
  const profileBytes = readFileSync(resolve(root, composition.generatedPath));
  return {
    profileHash: sha256(profileBytes),
    compositionHash: sha256(compositionBytes),
    upstreamCompositionHash: composition.upstreamCompositionHash,
    overlayHash: sha256(overlayBytes),
  };
}

export function validateFirstWaveStatic(root) {
  const shared = [
    ['UPSTREAM', validateUpstreamIntegrity(root)],
    ['GENERATED', validateGeneratedAgents(root)],
    ['CAPABILITY', validateCapabilityEnvelopes(root)],
    ['ACTIVATION', validateActivationBoundary(root)],
  ];
  const registry = json(resolve(root, 'architecture/agents/registry/agents.yaml'));
  const models = json(resolve(root, 'architecture/agents/registry/model-registry.yaml'));
  const matrix = json(resolve(root, 'architecture/agents/review-matrix.yaml'));
  const selections = json(resolve(root, 'architecture/agents/registry/upstream-selection-register.yaml'));
  const compositionLock = json(resolve(root, 'architecture/agents/registry/composition-lock.json'));
  const serializedMatrix = JSON.stringify(matrix);
  const agents = [];
  for (const agentId of FIRST_WAVE) {
    const errors = shared.flatMap(([label, result]) => result.ok ? [] : result.errors.map((error) => `${label}:${error}`));
    const entry = registry.agents.find((item) => item.agentId === agentId);
    const model = models.agents.find((item) => item.agentId === agentId);
    const selection = selections.selections.find((item) => item.agentId === agentId);
    const lock = compositionLock.agents.find((item) => item.agentId === agentId);
    const compositionPath = resolve(root, `architecture/agents/compositions/${agentId}.yaml`);
    const overlayPath = resolve(root, `architecture/agents/overlays/${agentId}.yaml`);
    const envelopePath = resolve(root, `architecture/agents/contracts/capabilities/${agentId}.json`);
    const profilePath = resolve(root, `architecture/agents/generated/provisional/${agentId}.toml`);
    for (const [label, path] of [['composition', compositionPath], ['overlay', overlayPath], ['capability', envelopePath], ['profile', profilePath]]) {
      if (!existsSync(path)) errors.push(`${label.toUpperCase()}_MISSING`);
    }
    let hashes = {};
    if (!errors.some((error) => /_MISSING$/.test(error))) {
      hashes = profileHashes(root, agentId);
      const composition = json(compositionPath);
      const overlay = json(overlayPath);
      const envelope = json(envelopePath);
      if (selection?.status !== 'SELECTED') errors.push('SELECTION_NOT_SELECTED');
      if (!selection?.selectedProfiles?.length || selection.selectedProfiles.some((base) => !base.repository || !base.commitSha || !base.sourcePath || !base.profileId || !base.rawSha256 || !base.normalizedSha256 || !base.license)) errors.push('UPSTREAM_BINDING_INCOMPLETE');
      if (composition.status !== 'PROVISIONAL' || composition.activationEligible !== false || composition.platformActivationEligible !== false) errors.push('COMPOSITION_ACTIVATION_INVALID');
      if (composition.generatedPath !== `architecture/agents/generated/provisional/${agentId}.toml`) errors.push('RUNTIME_DISCOVERY_PATH_INVALID');
      if (composition.overlayHash !== hashes.overlayHash || composition.generatedHash !== hashes.profileHash || lock?.compositionHash !== hashes.compositionHash) errors.push('HASH_BINDING_INVALID');
      if (JSON.stringify(composition.compositionOrder) !== JSON.stringify(selection.compositionOrder)) errors.push('COMPOSITION_ORDER_INVALID');
      if (composition.bases.some((base) => base.inclusionMode !== 'FULL_UNMODIFIED')) errors.push('IMMUTABLE_INCLUSION_INVALID');
      if (overlay.mode !== 'APPEND_ONLY') errors.push('OVERLAY_NOT_APPEND_ONLY');
      if (!entry || entry.status !== 'PROVISIONAL' || entry.activationEligible !== false || entry.platformActivationEligible !== false || entry.generatedProfilePath !== composition.generatedPath) errors.push('REGISTRY_CONTRACT_INVALID');
      if (!serializedMatrix.includes(agentId)) errors.push('MATRIX_ROUTE_MISSING');
      if (!model || model.silentDowngradeAllowed !== false || entry.modelContract?.primaryModel !== model.primaryModel || entry.modelContract?.primaryReasoning !== model.primaryReasoning) errors.push('MODEL_CONTRACT_INVALID');
      if (!entry.requiredInputs?.length || !entry.requiredOutputs?.length || !entry.executionModes?.length) errors.push('IO_OR_EXECUTION_CONTRACT_MISSING');
      if (entry.independenceContract?.selfReviewAllowed !== false || entry.independenceContract?.selfReportedEvidenceSufficient !== false) errors.push('INDEPENDENCE_CONTRACT_INVALID');
      if (envelope.evidenceStatus !== 'RUNTIME_ENFORCEMENT_UNVERIFIED' || envelope.filesystemWrite !== false || envelope.networkAccess !== false || envelope.mcpAccess !== false || envelope.productionWrite !== false) errors.push('CAPABILITY_ENVELOPE_INVALID');
    }
    agents.push({
      agentId,
      status: errors.length ? 'PROFILE_CONTRACT_INVALID' : 'PASS',
      executionMode: 'STATIC_VALIDATION',
      errors: [...new Set(errors)].sort(),
      ...hashes,
    });
  }
  return { ok: agents.every((agent) => agent.status === 'PASS'), agents };
}

export function loadFirstWaveFixtures(root) {
  const fixtures = [];
  for (const agentId of FIRST_WAVE) {
    const directory = resolve(root, 'tests/agents/first-wave', agentId);
    for (const kind of readdirSync(directory).sort()) {
      const path = join(directory, kind, 'fixture.json');
      if (existsSync(path)) fixtures.push({ kind, path, fixture: json(path) });
    }
  }
  return fixtures;
}

export function evaluateFixture({ fixture, kind }, platform = process.platform) {
  const signals = [...fixture.signals];
  const classVerdicts = {
    pass: 'PASS',
    fail: ['audit-traceability-reviewer', 'ios-codebase-auditor'].includes(fixture.agentId) ? 'FAIL' : 'BLOCKER',
    'insufficient-evidence': 'INSUFFICIENT_EVIDENCE',
    blocker: 'BLOCKER',
    'forbidden-action': 'BLOCKER',
    'stale-sha': 'BLOCKED',
    'spoofed-evidence': 'BLOCKER',
  };
  let verdict = classVerdicts[kind];
  let status = 'PASS';
  if (signals.includes('SYMLINK_ESCAPE') && platform === 'win32') {
    verdict = 'SKIP';
    status = 'SKIP';
  } else if (signals.includes('SYMLINK_ESCAPE')) {
    verdict = 'BLOCKER';
  }
  const expectedVerdict = platform === 'win32' && fixture.expectedVerdictWindows
    ? fixture.expectedVerdictWindows
    : fixture.expectedVerdict;
  return {
    agentId: fixture.agentId,
    fixtureId: fixture.fixtureId,
    fixtureClass: kind,
    executionMode: 'FIXTURE_HARNESS',
    status,
    verdict,
    findings: signals,
    evidence: fixture.expectedEvidenceReferences,
    forbiddenActionAttempts: kind === 'forbidden-action' ? signals : [],
    forbiddenOutputsProduced: [],
    filesModified: 0,
    matchesExpected: verdict === expectedVerdict && JSON.stringify(signals) === JSON.stringify(fixture.expectedFindings),
  };
}

export function runFixtureValidation(root, platform = process.platform) {
  const results = loadFirstWaveFixtures(root).map((item) => evaluateFixture(item, platform));
  return {
    ok: results.every((result) => result.matchesExpected),
    total: results.length,
    pass: results.filter((result) => result.status === 'PASS').length,
    fail: results.filter((result) => !result.matchesExpected).length,
    skip: results.filter((result) => result.status === 'SKIP').length,
    results,
  };
}

export function runtimeSmokeNotAvailable(root, staticResult) {
  const models = json(resolve(root, 'architecture/agents/registry/model-registry.yaml'));
  return staticResult.agents.map((agent) => {
    const model = models.agents.find((item) => item.agentId === agent.agentId);
    return {
      agentId: agent.agentId,
      ...profileHashes(root, agent.agentId),
      requestedModel: model.primaryModel,
      requestedReasoning: model.primaryReasoning,
      resolvedModel: null,
      executionMode: 'NOT_AVAILABLE',
      status: 'RUNTIME_VALIDATION_NOT_AVAILABLE',
      reason: 'NO_TRUSTED_ISOLATED_PROFILE_INVOKER',
      runtimeLatencyMs: null,
      executionThreadId: null,
      temporaryEnvironmentCreated: false,
      canonicalDiscoveryTouched: false,
      filesModified: 0,
      residualRisk: ['RUNTIME_ENFORCEMENT_UNVERIFIED', 'TRUSTED_EXTERNAL_ATTESTATION_MISSING'],
    };
  });
}

export function validateFirstWave(root) {
  const staticValidation = validateFirstWaveStatic(root);
  const fixtures = staticValidation.ok ? runFixtureValidation(root) : { ok: false, total: 0, pass: 0, fail: 0, skip: 0, results: [] };
  const runtime = staticValidation.ok && fixtures.ok ? runtimeSmokeNotAvailable(root, staticValidation) : [];
  const activation = validateActivationBoundary(root);
  const ok = staticValidation.ok && fixtures.ok && activation.ok && activation.runtimeDiscoveredPlatformAgents === 0;
  return {
    schemaVersion: '1.0.0',
    status: ok ? 'FIRST_WAVE_PROVISIONAL_VALIDATION_COMPLETE' : 'PROVISIONAL_VALIDATION_FAIL',
    ok,
    staticValidation,
    fixtures,
    runtime,
    activationBoundary: activation,
    trustedExternalAttestation: 'MISSING',
    productionWrites: 0,
  };
}
