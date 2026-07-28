import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateJsonSchema } from './json-schema-validator.mjs';

export const REVIEW_STATUSES = [
  'PASS', 'PASS_WITH_WARNINGS', 'BLOCKED', 'FAIL',
  'NOT_APPLICABLE', 'NOT_EXECUTED',
];
export const SEVERITIES = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'BLOCKER'];
export const EXECUTION_MODES = [
  'REAL_SUBAGENT', 'CODEX_ROLE_SIMULATION', 'CI_VALIDATOR',
  'MANUAL_REVIEW', 'NOT_AVAILABLE',
];
export const IMPLEMENTATION_STATUSES = [
  'DRAFT', 'READY',
];
export const CANONICAL_AGENT_IDS = [];

export function readJsonCompatibleYaml(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse JSON-compatible YAML ${path}: ${error.message}`);
  }
}

function readGovernanceJson(path, label, maximumBytes = 2_000_000) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label}: unsafe file type`);
  if (stat.size > maximumBytes) throw new Error(`${label}: exceeds ${maximumBytes} byte cap`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function normalizeRepoPath(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
}

function escapeRegex(char) {
  return /[\\^$+?.()|{}\[\]]/.test(char) ? `\\${char}` : char;
}

export function globToRegExp(glob) {
  const pattern = normalizeRepoPath(glob);
  let source = '^';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === '*' && pattern[index + 1] === '*') {
      const followedBySlash = pattern[index + 2] === '/';
      source += followedBySlash ? '(?:.*/)?' : '.*';
      index += followedBySlash ? 2 : 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else if (char === '?') {
      source += '[^/]';
    } else {
      source += escapeRegex(char);
    }
  }
  return new RegExp(`${source}$`, 'i');
}

export function matchesAny(value, patterns = []) {
  const normalized = normalizeRepoPath(value);
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

export function parseNameStatusZ(buffer) {
  const tokens = String(buffer).split('\0');
  if (tokens.at(-1) === '') tokens.pop();
  const changes = [];
  for (let index = 0; index < tokens.length;) {
    const status = tokens[index++];
    if (!status) throw new Error('Empty git diff status token.');
    if (/^[RC]/.test(status)) {
      const oldPath = tokens[index++];
      const newPath = tokens[index++];
      if (!oldPath || !newPath) throw new Error(`Incomplete ${status} record.`);
      changes.push({ status, oldPath: normalizeRepoPath(oldPath), path: normalizeRepoPath(newPath) });
    } else {
      const path = tokens[index++];
      if (!path) throw new Error(`Missing path for ${status}.`);
      changes.push({ status, path: normalizeRepoPath(path) });
    }
  }
  return changes;
}

export function git(cwd, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`);
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

export function changedPathsFromGit(cwd, base, head) {
  const result = git(cwd, ['diff', '--name-status', '-z', `${base}...${head}`]);
  const changes = parseNameStatusZ(result.stdout);
  const paths = [];
  for (const change of changes) {
    if (change.oldPath) paths.push(change.oldPath);
    paths.push(change.path);
  }
  return { changes, paths: [...new Set(paths)].sort() };
}

export function validateException(exception, matrix, { now = new Date(), ownerApproved = false } = {}) {
  const required = matrix.ExceptionPolicy.RequiredFields;
  const missing = required.filter((field) => exception[field] === undefined || exception[field] === '');
  const errors = missing.map((field) => `missing ${field}`);
  if (!/^(RFC|ADR)-/.test(exception.RfcAdrReference || '')) errors.push('invalid RFC/ADR reference');
  const expiry = new Date(exception.Expiry);
  if (Number.isNaN(expiry.valueOf())) errors.push('invalid expiry');
  else if (expiry <= now) errors.push('expired');
  if (!ownerApproved) errors.push('owner approval not verified by CI');
  const excluded = Array.isArray(exception.ExcludedAgents) ? exception.ExcludedAgents : [];
  for (const protectedAgent of matrix.ExceptionPolicy.CannotExcludeAgents) {
    if (excluded.includes(protectedAgent)) errors.push(`cannot exclude ${protectedAgent}`);
  }
  return { valid: errors.length === 0, errors };
}

export function resolveRequiredAgents({
  changedPaths, branch = '', matrix, exceptions = [], ownerApproved = false,
  now = new Date(), allowEmpty = false,
}) {
  const paths = [...new Set(changedPaths.map(normalizeRepoPath))].sort();
  if (paths.length === 0 && !allowEmpty) {
    throw new Error('Empty diff is blocked by fail-closed policy.');
  }
  const pathRules = new Map(paths.map((path) => [
    path,
    matrix.Rules.filter((rule) => matchesAny(path, rule.PathPatterns)),
  ]));
  const branchRules = matrix.Rules.filter((rule) => branch && matchesAny(branch, rule.BranchPatterns || []));
  const matchedRules = [...new Set([...pathRules.values()].flat().concat(branchRules))];
  const unknownPaths = paths.filter((path) => pathRules.get(path).length === 0);
  const unknown = unknownPaths.length > 0;
  const taskTypes = [...new Set(matchedRules.map((rule) => rule.TaskType))].sort();
  const required = new Set(matrix.AlwaysRequiredAgents);
  const controls = new Set(matrix.BaselineControls);
  const advisory = new Set();
  if (unknown) matrix.FailClosed.RequiredAgents.forEach((id) => required.add(id));
  for (const rule of matchedRules) {
    rule.RequiredAgents.forEach((id) => required.add(id));
    rule.RequiredControls.forEach((control) => controls.add(control));
    (rule.AdvisoryCandidateRoles || []).forEach((id) => advisory.add(id));
  }

  const exceptionResults = [];
  for (const exception of exceptions) {
    const validation = validateException(exception, matrix, { now, ownerApproved });
    exceptionResults.push({ ExceptionId: exception.ExceptionId || 'UNKNOWN', ...validation });
    if (!validation.valid) continue;
    for (const id of exception.ExcludedAgents) required.delete(id);
  }

  const developmentUnavailable = matrix.PlatformState !== 'SOURCE_AUTHORED_DEVELOPMENT_READY';
  const domainReviewerUnavailable = controls.has('mandatory-domain-reviewer-not-integrated');
  const invalidException = exceptionResults.some((result) => !result.valid);
  const blocked = developmentUnavailable || domainReviewerUnavailable || unknown || invalidException;
  return {
    TaskType: unknown || taskTypes.length !== 1 ? 'mixed/unknown' : taskTypes[0],
    MatchedTaskTypes: unknown ? ['mixed/unknown'] : taskTypes,
    ChangedPaths: paths,
    UnknownPaths: unknownPaths,
    MatchedRules: matchedRules.map((rule) => rule.RuleId),
    ApplicableAgents: [...required].sort(),
    RequiredAgents: [...required].sort(),
    RequiredControls: [...controls].sort(),
    AdvisoryCandidateRoles: [...advisory].sort(),
    ExceptionResults: exceptionResults,
    BlockedByUnavailableAgents: [
      ...(developmentUnavailable ? ['AGENT_PLATFORM_NOT_READY'] : []),
      ...(domainReviewerUnavailable ? ['MANDATORY_DOMAIN_REVIEWER_NOT_INTEGRATED'] : []),
    ],
    MandatoryAgentAvailability: matrix.FailClosed.MandatoryAvailability || 'AVAILABLE',
    OverallResult: blocked ? (matrix.FailClosed.OverallResult || 'BLOCKED') : 'RESOLVED',
    FailClosed: blocked,
  };
}

function requireFields(value, fields, label) {
  const errors = [];
  for (const field of fields) {
    if (value[field] === undefined || value[field] === null || value[field] === '') {
      errors.push(`${label}: missing ${field}`);
    }
  }
  return errors;
}

export function validateRegistry(registry) {
  const errors = requireFields(registry, ['Version', 'CanonicalBranch', 'Agents'], 'registry');
  if (!Array.isArray(registry.Agents)) return [...errors, 'registry: Agents must be an array'];
  if (registry.PlatformState !== 'SOURCE_AUTHORED_DEVELOPMENT_READY') errors.push('registry: development platform state mismatch');
  if (registry.Agents.length !== 5) errors.push('registry: expected five canonical agents');
  if (registry.ActiveCustomAgents !== registry.Agents.length) errors.push('registry: ready agent count mismatch');
  if (registry.ProvisionedAgents !== registry.Agents.length) errors.push('registry: provisioned agent count mismatch');
  if (registry.MandatoryAgentAvailability !== 'READY_FOR_PERSONAL_DEVELOPMENT') errors.push('registry: development availability mismatch');
  if (registry.ActivationAllowed !== false) errors.push('registry: production activation must remain disabled');
  const required = [
    'AgentId', 'Name', 'SpecificationSources', 'Purpose', 'Scope', 'Triggers',
    'RequiredInputs', 'Checks', 'ForbiddenActions', 'RequiredOutputs',
    'SeverityLevels', 'BlockingLevels', 'CanModifyCode', 'CanModifyDocs',
    'CanUseNetwork', 'CanUseMCP', 'CanWriteRemote', 'CanApproveMerge',
    'CanDeploy', 'CanProductionWrite', 'CanModifySecrets', 'Escalation',
    'FallbackMode', 'Version', 'Status',
  ];
  const ids = new Set();
  for (const agent of registry.Agents) {
    errors.push(...requireFields(agent, required, agent.AgentId || 'agent'));
    if (ids.has(agent.AgentId)) errors.push(`duplicate AgentId ${agent.AgentId}`);
    ids.add(agent.AgentId);
    if (!IMPLEMENTATION_STATUSES.includes(agent.Status)) errors.push(`${agent.AgentId}: unknown status ${agent.Status}`);
    if (agent.Status !== 'READY') errors.push(`${agent.AgentId}: canonical development agent must be READY`);
    if (agent.ActivationEligible !== false) errors.push(`${agent.AgentId}: production activation is not part of development readiness`);
    for (const field of ['CanWriteRemote', 'CanApproveMerge', 'CanDeploy', 'CanProductionWrite', 'CanModifySecrets']) {
      if (agent[field] !== false) errors.push(`${agent.AgentId}: forbidden permission ${field}`);
    }
    if (!Array.isArray(agent.SpecificationSources) || agent.SpecificationSources.length === 0) errors.push(`${agent.AgentId}: missing source`);
    if (!Array.isArray(agent.RequiredOutputs) || agent.RequiredOutputs.length < 2) errors.push(`${agent.AgentId}: missing output contract`);
  }
  for (const id of CANONICAL_AGENT_IDS) if (!ids.has(id)) errors.push(`missing canonical agent ${id}`);
  return errors;
}

export function validateMatrix(matrix, registry) {
  const errors = requireFields(matrix, ['Version', 'TaskTypes', 'AlwaysRequiredAgents', 'BaselineControls', 'Rules', 'FailClosed'], 'matrix');
  const ids = new Set(registry.Agents.map((agent) => agent.AgentId));
  const ruleIds = new Set();
  for (const rule of matrix.Rules || []) {
    errors.push(...requireFields(rule, ['RuleId', 'TaskType', 'PathPatterns', 'RequiredAgents', 'RequiredControls'], rule.RuleId || 'rule'));
    if (ruleIds.has(rule.RuleId)) errors.push(`duplicate RuleId ${rule.RuleId}`);
    ruleIds.add(rule.RuleId);
    if (!matrix.TaskTypes.includes(rule.TaskType)) errors.push(`${rule.RuleId}: unknown task type ${rule.TaskType}`);
    for (const id of rule.RequiredAgents || []) if (!ids.has(id)) errors.push(`${rule.RuleId}: unknown agent ${id}`);
  }
  for (const id of matrix.FailClosed?.RequiredAgents || []) if (!ids.has(id)) errors.push(`fail-closed: unknown agent ${id}`);
  for (const control of ['security', 'privacy', 'secret-scan']) if (!matrix.BaselineControls?.includes(control)) errors.push(`missing baseline control ${control}`);
  return errors;
}

const REVIEW_FIELDS = [
  'AgentId', 'AgentVersion', 'GateId', 'Branch', 'CommitSHA', 'ReviewScope',
  'FilesReviewed', 'SpecificationReferences', 'ChecksPerformed', 'Findings',
  'Severity', 'Evidence', 'RequiredFixes', 'ResidualRisk', 'Status',
  'Timestamp', 'ExecutionMode',
];

export function validateReview(review, expected = {}) {
  if (!review || typeof review !== 'object' || Array.isArray(review)) return ['review UNKNOWN: must be an object'];
  const errors = requireFields(review, REVIEW_FIELDS, `review ${review.AgentId || 'UNKNOWN'}`);
  const unexpected = Object.keys(review).filter((field) => !REVIEW_FIELDS.includes(field));
  for (const field of unexpected) errors.push(`${review.AgentId || 'UNKNOWN'}: unexpected property ${field}`);
  for (const field of ['FilesReviewed', 'SpecificationReferences', 'ChecksPerformed', 'Findings', 'Evidence', 'RequiredFixes']) {
    if (!Array.isArray(review[field])) errors.push(`${review.AgentId || 'UNKNOWN'}: ${field} must be an array`);
  }
  if (typeof review.CommitSHA !== 'string' || !/^[0-9a-f]{40}$/.test(review.CommitSHA)) errors.push(`${review.AgentId || 'UNKNOWN'}: invalid CommitSHA`);
  if (typeof review.Timestamp !== 'string' || Number.isNaN(Date.parse(review.Timestamp))) errors.push(`${review.AgentId || 'UNKNOWN'}: invalid Timestamp`);
  if (!REVIEW_STATUSES.includes(review.Status)) errors.push(`${review.AgentId}: invalid Status`);
  if (!SEVERITIES.includes(review.Severity)) errors.push(`${review.AgentId}: invalid Severity`);
  if (!EXECUTION_MODES.includes(review.ExecutionMode)) errors.push(`${review.AgentId}: invalid ExecutionMode`);
  for (const [field, value] of Object.entries(expected)) if (value !== undefined && review[field] !== value) errors.push(`${review.AgentId}: wrong ${field}`);
  if (review.Status === 'NOT_EXECUTED') errors.push(`${review.AgentId}: mandatory review NOT_EXECUTED`);
  if (['BLOCKED', 'FAIL'].includes(review.Status)) errors.push(`${review.AgentId}: mandatory review ${review.Status}`);
  if (review.ExecutionMode === 'NOT_AVAILABLE' && ['PASS', 'PASS_WITH_WARNINGS', 'NOT_APPLICABLE'].includes(review.Status)) errors.push(`${review.AgentId}: NOT_AVAILABLE cannot produce ${review.Status}`);
  if (review.Status === 'NOT_APPLICABLE' && (!review.Evidence?.length || !review.ResidualRisk)) errors.push(`${review.AgentId}: NOT_APPLICABLE lacks justification`);
  if (review.ExecutionMode === 'REAL_SUBAGENT' && !review.Evidence?.some((item) => String(item).startsWith('AgentThreadId='))) errors.push(`${review.AgentId}: REAL_SUBAGENT lacks AgentThreadId evidence`);
  const findings = Array.isArray(review.Findings) ? review.Findings : [];
  if (findings.some((finding) => ['CRITICAL', 'BLOCKER'].includes(finding.Severity || review.Severity))) errors.push(`${review.AgentId}: blocking finding present`);
  if (['CRITICAL', 'BLOCKER'].includes(review.Severity)) errors.push(`${review.AgentId}: blocking severity present`);
  return errors;
}

export function findManifest(root, branch) {
  if (!existsSync(root)) throw new Error(`Manifest root does not exist: ${root}`);
  const candidates = [];
  for (const gate of readdirSync(root, { withFileTypes: true })) {
    if (!gate.isDirectory()) continue;
    const path = join(root, gate.name, 'manifest.json');
    if (!existsSync(path)) continue;
    const value = readGovernanceJson(path, `manifest ${gate.name}`);
    if (value.Branch === branch) candidates.push({ path, value });
  }
  if (candidates.length !== 1) throw new Error(`Expected exactly one manifest for ${branch}; found ${candidates.length}.`);
  return candidates[0];
}

export function validateManifest({ manifestPath, required, root, branch, base, actualHead, schemaRoot: explicitSchemaRoot, forbiddenPassingExecutionModes = [] }) {
  const manifest = readGovernanceJson(manifestPath, 'manifest');
  const schemaRoot = explicitSchemaRoot || (existsSync(join(root, 'architecture', 'agents', 'review-manifest.schema.json'))
    ? root : resolve(import.meta.dirname, '..'));
  const manifestSchema = JSON.parse(readFileSync(join(schemaRoot, 'architecture', 'agents', 'review-manifest.schema.json'), 'utf8'));
  const reviewSchema = JSON.parse(readFileSync(join(schemaRoot, 'architecture', 'agents', 'review-contract.schema.json'), 'utf8'));
  const errors = validateJsonSchema(manifest, manifestSchema, { path: 'manifest' });
  const registryPath = join(root, 'architecture', 'agents', 'agent-registry.yaml');
  const transitionRegistry = existsSync(registryPath) ? readJsonCompatibleYaml(registryPath) : null;
  const zeroAgentTransition = transitionRegistry?.PlatformState === 'ZERO_AGENT_TRANSITION';
  if (manifest.Branch !== branch) errors.push('manifest: wrong branch');
  if (manifest.BaseSHA !== base) errors.push('manifest: wrong base SHA');
  if (manifest.TaskType !== required.TaskType) errors.push('manifest: wrong task type');
  if (!['PASS', 'BLOCKED', 'FAIL', 'INCOMPLETE'].includes(manifest.OverallStatus)) errors.push('manifest: invalid OverallStatus');
  const requiredIds = [...required.RequiredAgents].sort();
  if (JSON.stringify([...manifest.RequiredAgents].sort()) !== JSON.stringify(requiredIds)) errors.push('manifest: RequiredAgents differs from resolver');
  if (JSON.stringify([...manifest.ApplicableAgents].sort()) !== JSON.stringify([...required.ApplicableAgents].sort())) errors.push('manifest: ApplicableAgents differs from resolver');
  if (manifest.MissingAgents.length) errors.push(`manifest: missing agents ${manifest.MissingAgents.join(', ')}`);
  if (manifest.BlockingFindings.length) errors.push('manifest: blocking findings present');
  if (zeroAgentTransition) {
    if (manifest.AgentPlatformVersion !== '2.0.0-transition') errors.push('manifest: old agent platform version is not accepted');
    if (manifest.PlatformState !== 'ZERO_AGENT_TRANSITION') errors.push('manifest: old platform state is not accepted');
    if (manifest.RequiredAgents.length || manifest.ExecutedAgents.length) errors.push('manifest: zero-agent transition cannot execute agents');
    if (!manifest.BlockedByUnavailableAgents?.length) errors.push('manifest: mandatory NOT_AVAILABLE blocker missing');
    if (manifest.OverallStatus !== 'BLOCKED') errors.push('manifest: zero-agent transition must be BLOCKED');
    errors.push('manifest: ZERO_AGENT_TRANSITION_MANDATORY_AGENT_NOT_AVAILABLE');
  }
  if (manifest.OwnerBypass !== undefined) {
    const bypass = manifest.OwnerBypass;
    errors.push(...requireFields(bypass, [
      'ReviewMode', 'IndependentReviewer', 'CIEvidence', 'HumanAuthorization',
      'AuthorizedActor', 'Reason', 'Scope', 'OtherProtectionsBypassed',
      'ProductionDeploymentAuthorized', 'UnresolvedConversations', 'Timestamp',
    ], 'manifest.OwnerBypass'));
    if (bypass.ReviewMode !== 'SOLO_MAINTAINER_OWNER_BYPASS') errors.push('manifest.OwnerBypass: invalid ReviewMode');
    if (bypass.IndependentReviewer !== 'NOT_AVAILABLE') errors.push('manifest.OwnerBypass: independent reviewer must be NOT_AVAILABLE');
    if (bypass.CIEvidence !== 'PASS') errors.push('manifest.OwnerBypass: CI evidence must be PASS');
    if (!bypass.HumanAuthorization?.trim()) errors.push('manifest.OwnerBypass: missing human authorization');
    if (!bypass.AuthorizedActor?.trim()) errors.push('manifest.OwnerBypass: missing authorized actor');
    if (!bypass.Reason?.trim()) errors.push('manifest.OwnerBypass: missing reason');
    if (bypass.Scope !== 'APPROVAL_REQUIREMENT_ONLY') errors.push('manifest.OwnerBypass: scope exceeds approval requirement');
    if (bypass.OtherProtectionsBypassed !== false) errors.push('manifest.OwnerBypass: other protections cannot be bypassed');
    if (bypass.ProductionDeploymentAuthorized !== false) errors.push('manifest.OwnerBypass: production/deployment cannot be authorized');
    if (bypass.UnresolvedConversations !== 0) errors.push('manifest.OwnerBypass: unresolved conversations must be zero');
  }

  const ancestor = git(root, ['merge-base', '--is-ancestor', manifest.HeadSHA, actualHead], { allowFailure: true });
  if (ancestor.status !== 0) errors.push('manifest: HeadSHA is not actual HEAD or its ancestor');
  if (manifest.HeadSHA !== actualHead && ancestor.status === 0) {
    const tail = git(root, ['diff', '--name-only', `${manifest.HeadSHA}..${actualHead}`]).stdout
      .split(/\r?\n/).filter(Boolean).map(normalizeRepoPath);
    const unsafe = tail.filter((path) => !matchesAny(path, ['audit/agents/**', 'docs/reviews/**']));
    if (unsafe.length) errors.push(`manifest: stale review; non-attestation tail paths: ${unsafe.join(', ')}`);
  }

  const reviewedPaths = changedPathsFromGit(root, base, manifest.HeadSHA).paths;
  if (JSON.stringify([...manifest.ChangedPaths].sort()) !== JSON.stringify(reviewedPaths)) errors.push('manifest: ChangedPaths differs from reviewed diff');
  const manifestDir = resolve(root, relative(root, resolve(manifestPath, '..')));
  if (basename(manifestDir) !== manifest.GateId) errors.push('manifest: GateId differs from directory');
  const executed = [];
  for (const agentId of requiredIds) {
    const reviewPath = join(manifestDir, `${agentId}.json`);
    if (!existsSync(reviewPath)) {
      errors.push(`missing review JSON ${agentId}`);
      continue;
    }
    const review = readGovernanceJson(reviewPath, `review ${agentId}`);
    errors.push(...validateJsonSchema(review, reviewSchema, { path: `review ${agentId}` }));
    errors.push(...validateReview(review, {
      AgentId: agentId, GateId: manifest.GateId, Branch: branch, CommitSHA: manifest.HeadSHA,
    }));
    if (forbiddenPassingExecutionModes.includes(review.ExecutionMode) && ['PASS', 'PASS_WITH_WARNINGS', 'NOT_APPLICABLE'].includes(review.Status)) {
      errors.push(`${agentId}: ${review.ExecutionMode} cannot satisfy a mandatory trusted review`);
    }
    const markdownPath = join(root, 'docs', 'reviews', manifest.GateId, `${agentId}.md`);
    if (!existsSync(markdownPath)) errors.push(`missing review Markdown ${agentId}`);
    executed.push(agentId);
  }
  if (JSON.stringify([...manifest.ExecutedAgents].sort()) !== JSON.stringify(executed.sort())) errors.push('manifest: ExecutedAgents differs from reports');
  if (!zeroAgentTransition && errors.length === 0 && manifest.OverallStatus !== 'PASS') errors.push('manifest: OverallStatus must be PASS when all mandatory evidence passes');
  return { errors, manifest };
}

export function validateInstructionHierarchy(root) {
  const errors = [];
  const rootPath = join(root, 'AGENTS.md');
  if (!existsSync(rootPath)) return ['missing root AGENTS.md'];
  const rootText = readFileSync(rootPath, 'utf8');
  for (const phrase of ['direct push', 'Force push', 'CODEX_ROLE_SIMULATION', 'privacy/secret']) {
    if (!rootText.includes(phrase)) errors.push(`root AGENTS.md missing safety phrase: ${phrase}`);
  }
  const requiredScoped = [
    'docs/AGENTS.md', 'tests/AGENTS.md', 'tools/AGENTS.md',
    'architecture/AGENTS.md', 'research/AGENTS.md', 'specification/AGENTS.md',
    'apps-script/AGENTS.md',
    'IOS_HANDOFF_v4/master_specification/AGENTS.md',
    'IOS_SOURCE_SNAPSHOT/work/apps-script/AGENTS.md',
  ];
  const weakening = /^(?=.*(?:разреш(?:ён|ен|ить)|allow))(?=.*(?:direct push|force push|production write|clasp push)).*$/im;
  for (const path of requiredScoped) {
    const absolute = join(root, ...path.split('/'));
    if (!existsSync(absolute)) errors.push(`missing scoped instruction ${path}`);
    else if (weakening.test(readFileSync(absolute, 'utf8'))) errors.push(`scoped instruction weakens root: ${path}`);
  }
  return errors;
}

export function validateProjectAgentFiles(root, registry) {
  const errors = [];
  const provisioned = registry.Agents.filter((agent) =>
    ['DRAFT', 'READY'].includes(agent.Status));
  const sourceAuthored = registry.PlatformState?.startsWith('SOURCE_AUTHORED_');
  const dir = sourceAuthored ? join(root, '.codex', 'agents') : join(root, 'architecture', 'agents', 'generated', 'provisional');
  const files = existsSync(dir) ? readdirSync(dir).filter((file) => file.endsWith('.toml')) : [];
  if (files.length < provisioned.length) errors.push(`expected at least ${provisioned.length} project agents; found ${files.length}`);
  for (const file of files) {
    const text = readFileSync(join(dir, file), 'utf8');
    for (const field of ['name =', 'description =', 'developer_instructions =']) if (!text.includes(field)) errors.push(`${file}: missing ${field}`);
    if (!/remote write|push|perform writes/i.test(text)) errors.push(`${file}: missing remote-write prohibition`);
  }
  const runtimeDir = join(root, '.codex', 'agents');
  const runtimeFiles = existsSync(runtimeDir) ? readdirSync(runtimeDir).filter((file) => file.endsWith('.toml')) : [];
  if (sourceAuthored && runtimeFiles.length !== provisioned.length) errors.push(`source-authored state must contain exactly ${provisioned.length} canonical profiles; found ${runtimeFiles.length}`);
  return errors;
}

export function displayPath(path, root) {
  return normalizeRepoPath(relative(root, path)) || basename(path);
}
