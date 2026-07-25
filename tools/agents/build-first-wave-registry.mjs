#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.argv[2] || resolve(import.meta.dirname, '../..'));
const ids = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer', 'ios-codebase-auditor'];
const displayNames = {
  'ios-agent-orchestrator': 'IOS Agent Orchestrator',
  'agent-governance-auditor': 'Agent Governance Auditor',
  'security-privacy-auditor': 'Security and Privacy Auditor',
  'audit-traceability-reviewer': 'Audit Traceability Reviewer',
  'ios-codebase-auditor': 'IOS Codebase Auditor',
};
const purposes = {
  'ios-agent-orchestrator': 'Deterministic supervisor for Resolver, review DAG and report collection.',
  'agent-governance-auditor': 'Independent validation of Registry, Matrix, Resolver, profiles, evidence and anti-tamper controls.',
  'security-privacy-auditor': 'Read-only security, privacy, secret and supply-chain review across all artifact classes.',
  'audit-traceability-reviewer': 'Requirement-to-production traceability and evidence/status consistency review.',
  'ios-codebase-auditor': 'Read-only repository-wide runtime, symbol, dependency and architecture audit.',
};
const priorities = { 'ios-agent-orchestrator': 'P0', 'agent-governance-auditor': 'P0', 'security-privacy-auditor': 'P0', 'audit-traceability-reviewer': 'P0', 'ios-codebase-auditor': 'P0' };
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const agents = ids.map((agentId) => {
  const overlayPath = `architecture/agents/overlays/${agentId}.yaml`;
  const compositionPath = `architecture/agents/compositions/${agentId}.yaml`;
  const overlay = readJson(resolve(root, overlayPath));
  const composition = readJson(resolve(root, compositionPath));
  return {
    agentId, displayName: displayNames[agentId], status: 'PROVISIONAL', purpose: purposes[agentId], priority: priorities[agentId],
    upstreamComposition: composition.bases,
    overlayPath, compositionPath, generatedProfilePath: composition.generatedPath,
    triggers: agentId === 'ios-agent-orchestrator' ? ['significant task start', 'scope change', 'pre-commit', 'pre-push', 'pre-PR', 'post-change'] : overlay.responsibilities,
    permissions: overlay.permissionEnvelope,
    forbiddenActions: overlay.forbiddenActions,
    requiredInputs: overlay.requiredInputs,
    requiredOutputs: overlay.requiredOutputs,
    executionModes: ['REAL_SUBAGENT', 'CI_VALIDATOR'],
    modelContract: overlay.modelContract,
    independenceContract: { selfReviewAllowed: false, trustedExternalAttestation: 'MISSING', selfReportedEvidenceSufficient: false },
    runtimeExecutionStatus: 'RUNTIME_PROFILE_NOT_YET_OBSERVED',
    activationEligible: false,
    platformActivationEligible: false,
  };
});

const canonical = { schemaVersion: '1.0.0', sourceOfTruth: 'architecture/agents/registry/agents.yaml', canonicalBranch: 'integration/ios-current', platformState: 'PROVISIONAL_PLATFORM_BUILD', activationAllowed: false, activeAgents: 0, provisionalAgents: agents.length, agents };
writeFileSync(resolve(root, 'architecture/agents/registry/agents.yaml'), `${JSON.stringify(canonical, null, 2)}\n`, 'utf8');

const compatibility = {
  Version: '2.1.0-provisional', CanonicalBranch: canonical.canonicalBranch, PlatformState: canonical.platformState,
  ActiveCustomAgents: 0, ProvisionedAgents: agents.length, MandatoryAgentAvailability: 'PROVISIONAL_AVAILABLE_ACTIVATION_CLOSED', ActivationAllowed: false,
  SourceOfTruth: canonical.sourceOfTruth,
  Agents: agents.map((agent) => ({
    AgentId: agent.agentId, Name: agent.displayName, SpecificationSources: ['IOS Master Specification v4.0', 'IOS Agent Platform Specification v2.1', 'OWNER_DECISION_FIRST_WAVE_20260722'], Purpose: agent.purpose,
    Scope: agent.triggers, Triggers: agent.triggers, RequiredInputs: agent.requiredInputs, Checks: agent.requiredOutputs,
    ForbiddenActions: agent.forbiddenActions, RequiredOutputs: agent.requiredOutputs, SeverityLevels: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'BLOCKER'], BlockingLevels: ['HIGH', 'CRITICAL', 'BLOCKER'],
    CanModifyCode: false, CanModifyDocs: false, CanUseNetwork: false, CanUseMCP: false, CanWriteRemote: false, CanApproveMerge: false, CanDeploy: false, CanProductionWrite: false, CanModifySecrets: false,
    Escalation: agent.modelContract, FallbackMode: 'NOT_AVAILABLE_NO_SILENT_DOWNGRADE', Version: '1.0.0', Status: 'PROVISIONAL', ActivationEligible: false,
    OverlayPath: agent.overlayPath, CompositionPath: agent.compositionPath, GeneratedProfilePath: agent.generatedProfilePath,
  })),
};
writeFileSync(resolve(root, 'architecture/agents/agent-registry.yaml'), `${JSON.stringify(compatibility, null, 2)}\n`, 'utf8');
writeFileSync(resolve(root, 'architecture/agents/agent-registry.json'), `${JSON.stringify({ Version: compatibility.Version, Purpose: 'Compatibility index; canonical source is architecture/agents/registry/agents.yaml.', PlatformState: compatibility.PlatformState, ActiveCount: 0, ProvisionalCount: agents.length, Roles: agents.map((agent) => ({ AgentId: agent.agentId, Status: agent.status, ActivationEligible: false })) }, null, 2)}\n`, 'utf8');

const governanceAgents = ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor', 'audit-traceability-reviewer'];
const rules = [
  { RuleId: 'ORCHESTRATOR_SELF_CHANGE', TaskType: 'orchestrator self-change', PathPatterns: ['.codex/agents/ios-agent-orchestrator.toml', 'architecture/agents/generated/provisional/ios-agent-orchestrator.toml', 'architecture/agents/overlays/ios-agent-orchestrator.yaml', 'architecture/agents/compositions/ios-agent-orchestrator.yaml', 'tools/agents/orchestrate.mjs'], RequiredAgents: ['agent-governance-auditor', 'security-privacy-auditor'], RequiredControls: ['owner-approval', 'anti-self-review', 'governance-tamper-check'] },
  { RuleId: 'UPSTREAM_PROFILE_MODEL', TaskType: 'upstream/profile/model', PathPatterns: ['architecture/agents/upstream/**', 'architecture/agents/generated/provisional/**', 'architecture/agents/overlays/**', 'architecture/agents/compositions/**', 'architecture/agents/registry/**', '.codex/agents/**'], RequiredAgents: ['ios-agent-orchestrator', 'agent-governance-auditor', 'security-privacy-auditor'], RequiredControls: ['upstream-integrity', 'append-only-overlay', 'no-silent-downgrade', 'runtime-discovery-empty'] },
  { RuleId: 'GOVERNANCE_SELF_CHANGE', TaskType: 'governance', PathPatterns: ['AGENTS.md', '**/AGENTS.md', 'architecture/agents/**', 'docs/agents/**', 'tools/*agent*', 'tools/agents/**', 'tools/trusted-governance/**', '.github/workflows/*agent*', 'rfc/**', 'adr/**'], RequiredAgents: governanceAgents, RequiredControls: ['owner-approval', 'privacy', 'secret-scan', 'governance-tamper-check', 'activation-closed'] },
  { RuleId: 'REPOSITORY_ARCHITECTURE_AUDIT', TaskType: 'repository-wide architecture audit', PathPatterns: ['architecture/**', 'specification/**', 'IOS_SOURCE_SNAPSHOT/**', 'IOS_HANDOFF_v4/**'], RequiredAgents: ['ios-agent-orchestrator', 'ios-codebase-auditor', 'audit-traceability-reviewer'], RequiredControls: ['architecture-impact', 'traceability', 'activation-closed'] },
  { RuleId: 'DOCUMENTATION', TaskType: 'documentation only', PathPatterns: ['docs/**'], RequiredAgents: ['ios-agent-orchestrator', 'audit-traceability-reviewer'], RequiredControls: ['traceability', 'activation-closed'] },
  { RuleId: 'TESTS', TaskType: 'tests', PathPatterns: ['tests/**', '**/*.test.mjs'], RequiredAgents: ['ios-agent-orchestrator', 'agent-governance-auditor'], RequiredControls: ['determinism', 'no-production-access', 'activation-closed'] },
  { RuleId: 'PRODUCTION_RUNTIME_UNAVAILABLE', TaskType: 'production/runtime domain', PathPatterns: ['apps-script/**', 'IOS_SOURCE_SNAPSHOT/work/apps-script/**', '**/*Schema*.gs', '**/*Provider*.mjs', '**/MarketRegime.gs', '**/DecisionEngine.gs', '**/R030*', '**/TradePlan*'], RequiredAgents: governanceAgents, RequiredControls: ['mandatory-domain-reviewer-not-integrated', 'no-production-write', 'activation-closed'] },
];
const matrix = {
  Version: '2.1.0-provisional', PlatformState: 'PROVISIONAL_PLATFORM_BUILD', TaskTypes: [...new Set(rules.map((rule) => rule.TaskType)), 'mixed/unknown'],
  AlwaysRequiredAgents: [], BaselineControls: ['security', 'privacy', 'secret-scan', 'architecture-impact', 'activation-closed'], Rules: rules,
  FailClosed: { UnknownTaskType: 'mixed/unknown', EmptyDiff: 'BLOCK', RequiredAgents: governanceAgents, MandatoryAvailability: 'PROVISIONAL_AVAILABLE_ACTIVATION_CLOSED', OverallResult: 'BLOCKED' },
  Transition: { ActiveCustomAgents: 0, ProvisionalAgents: agents.length, OldRegistryReferences: 0, OldMatrixReferences: 0, OldResolverReferences: 0, OldManifestsAccepted: false, ResolverBehavior: 'FAIL_CLOSED', ActivationGate: 'CLOSED' },
  AntiTamperPaths: ['AGENTS.md', '**/AGENTS.md', '.codex/agents/**', 'architecture/agents/generated/provisional/**', 'architecture/agents/**', 'docs/agents/**', 'tools/agents/**', 'tools/trusted-governance/**', '.github/workflows/*agent*'],
  ExceptionPolicy: { VersionedFileRequired: true, RequiredFields: ['ExceptionId', 'RfcAdrReference', 'OwnerApproval', 'Reason', 'Expiry', 'RiskAcceptance', 'ExcludedAgents'], CannotExcludeAgents: ['agent-governance-auditor', 'security-privacy-auditor'], CannotDisableControls: ['security', 'privacy', 'secret-scan', 'architecture-impact', 'activation-closed'], ExpiredOrUnauthorized: 'BLOCK' },
};
writeFileSync(resolve(root, 'architecture/agents/review-matrix.yaml'), `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ agents: agents.length, activeAgents: 0, matrixRules: rules.length, activationAllowed: false }, null, 2));
