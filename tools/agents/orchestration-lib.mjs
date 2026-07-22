import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readJsonCompatibleYaml } from '../agent-governance-lib.mjs';

export const ORCHESTRATOR_ID = 'ios-agent-orchestrator';

export function assertAcyclic(nodes) {
  const ids = new Set(nodes.map((node) => node.id));
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new Error(`DAG_CYCLE:${id}`);
    if (visited.has(id)) return;
    const node = nodes.find((item) => item.id === id);
    if (!node) throw new Error(`DAG_UNKNOWN_NODE:${id}`);
    visiting.add(id);
    for (const dependency of node.dependsOn || []) {
      if (!ids.has(dependency)) throw new Error(`DAG_UNKNOWN_DEPENDENCY:${id}:${dependency}`);
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) visit(id);
  return true;
}

function availabilityKey(model, reasoning) {
  return `${model}/${reasoning}`;
}

export function validateModelBindings(requiredAgents, registry, modelRegistry, availability) {
  const contracts = new Map(modelRegistry.agents.map((item) => [item.agentId, item]));
  const available = new Map(availability.models.map((item) => [availabilityKey(item.requestedSlug, item.requestedReasoningLevel), item]));
  return requiredAgents.map((agentId) => {
    const registryAgent = registry.agents.find((item) => item.agentId === agentId);
    const contract = contracts.get(agentId);
    if (!registryAgent || !contract) return { agentId, status: 'MODEL_NOT_AVAILABLE', reason: 'MODEL_CONTRACT_MISSING' };
    if (contract.silentDowngradeAllowed !== false) return { agentId, status: 'MODEL_NOT_AVAILABLE', reason: 'SILENT_DOWNGRADE_NOT_FORBIDDEN' };
    const runtime = available.get(availabilityKey(contract.primaryModel, contract.primaryReasoning));
    const usable = runtime?.runtimeAvailability === 'RUNTIME_AVAILABLE' && runtime?.resolvedSlug === contract.primaryModel && runtime?.resolvedReasoningLevel === contract.primaryReasoning && runtime?.substitutionUsed === false;
    return {
      agentId,
      requestedModel: contract.primaryModel,
      requestedReasoning: contract.primaryReasoning,
      resolvedModel: runtime?.resolvedSlug ?? null,
      resolvedReasoning: runtime?.resolvedReasoningLevel ?? null,
      status: usable ? 'RUNTIME_AVAILABLE' : 'MODEL_NOT_AVAILABLE',
      silentDowngradeUsed: runtime?.substitutionUsed ?? false,
    };
  });
}

export function buildExecutionPlan({ phase, resolution, registry, modelRegistry, availability }) {
  if (!['PRE_CHANGE', 'POST_CHANGE'].includes(phase)) throw new Error(`UNKNOWN_PHASE:${phase}`);
  const selfChange = resolution.MatchedRules.includes('ORCHESTRATOR_SELF_CHANGE');
  const required = [...resolution.RequiredAgents].sort();
  const executable = selfChange ? required.filter((id) => id !== ORCHESTRATOR_ID) : required;
  const nodes = [];
  if (required.includes(ORCHESTRATOR_ID) && !selfChange) nodes.push({ id: ORCHESTRATOR_ID, type: 'SUPERVISOR', dependsOn: [] });
  for (const agentId of executable.filter((id) => id !== ORCHESTRATOR_ID)) {
    nodes.push({ id: agentId, type: 'INDEPENDENT_REVIEW', dependsOn: nodes.some((node) => node.id === ORCHESTRATOR_ID) ? [ORCHESTRATOR_ID] : [] });
  }
  const reviewers = nodes.filter((node) => node.type === 'INDEPENDENT_REVIEW').map((node) => node.id);
  if (reviewers.length) nodes.push({ id: `${phase.toLowerCase()}-report-collection`, type: 'REPORT_COLLECTION', dependsOn: reviewers });
  assertAcyclic(nodes);
  const modelBindings = validateModelBindings(executable, registry, modelRegistry, availability);
  const modelUnavailable = modelBindings.filter((item) => item.status !== 'RUNTIME_AVAILABLE').map((item) => item.agentId);
  const activationClosed = registry.activationAllowed === false || registry.agents.some((agent) => agent.activationEligible === false);
  const blockers = [...new Set([
    ...resolution.BlockedByUnavailableAgents,
    ...modelUnavailable.map((id) => `MODEL_NOT_AVAILABLE:${id}`),
    ...(activationClosed ? ['PLATFORM_ACTIVATION_CLOSED'] : []),
    ...(selfChange ? ['ORCHESTRATOR_SELF_REVIEW_FORBIDDEN'] : []),
    'TRUSTED_EXTERNAL_ATTESTATION_MISSING',
  ])].sort();
  return {
    schemaVersion: '1.0.0', phase, platformState: registry.platformState,
    automaticDispatchStatus: 'AUTOMATIC_DISPATCH_CONFIGURED',
    runtimeDispatchStatus: 'NOT_DISPATCHED_ACTIVATION_CLOSED',
    trustedAttestationStatus: 'TRUSTED_EXTERNAL_ATTESTATION_MISSING',
    requiredAgents: required, advisoryAgents: resolution.AdvisoryCandidateRoles,
    executionDag: nodes,
    parallelGroups: [
      ...nodes.filter((node) => node.type === 'SUPERVISOR').map((node) => [node.id]),
      reviewers,
      ...nodes.filter((node) => node.type === 'REPORT_COLLECTION').map((node) => [node.id]),
    ].filter((group) => group.length),
    modelBindings,
    selfReviewProtection: { subjectIsOrchestrator: selfChange, orchestratorMayReview: false },
    blockedBy: blockers,
    result: blockers.length ? 'BLOCKED' : 'READY_FOR_RUNTIME_DISPATCH',
    productionApproval: false,
    activationEligible: false,
  };
}

export function loadPlatform(root) {
  return {
    registry: readJsonCompatibleYaml(resolve(root, 'architecture/agents/registry/agents.yaml')),
    modelRegistry: readJsonCompatibleYaml(resolve(root, 'architecture/agents/registry/model-registry.yaml')),
    availability: JSON.parse(readFileSync(resolve(root, 'architecture/agents/registry/model-availability.yaml'), 'utf8')),
  };
}
