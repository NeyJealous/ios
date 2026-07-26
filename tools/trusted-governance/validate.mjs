#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { findManifest, normalizeRepoPath, readJsonCompatibleYaml, resolveRequiredAgents, validateManifest } from '../agent-governance-lib.mjs';
import { validateJsonSchema } from '../json-schema-validator.mjs';

function args(argv) {
  const value = {};
  for (let index = 0; index < argv.length; index += 2) value[argv[index].replace(/^--/, '')] = argv[index + 1];
  return value;
}

function git(root, command) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=', '--no-optional-locks', ...command], { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error(`git ${command.join(' ')} failed`);
  return result.stdout.trim();
}

function tracked(root) {
  const output = git(root, ['ls-files', '-s', '-z']);
  const files = new Map();
  const foldedPaths = new Map();
  for (const record of output.split('\0').filter(Boolean)) {
    const match = /^(\d{6}) ([0-9a-f]+) \d+\t(.+)$/.exec(record);
    if (!match) throw new Error('Malformed git index record');
    const [, mode, oid, rawPath] = match;
    const path = normalizeRepoPath(rawPath);
    const unsafeSegment = path.split('/').some((segment) => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment) || /[:. ]$/.test(segment));
    if (path !== rawPath || path.includes('..') || /^\//.test(path) || /^[A-Za-z]:/.test(path) || /[\u0000-\u001f]/.test(path) || unsafeSegment) throw new Error(`Unsafe path: ${rawPath}`);
    if (['120000', '160000'].includes(mode)) throw new Error(`Symlink/submodule forbidden in reviewed tree: ${path}`);
    const folded = path.normalize('NFC').toLocaleLowerCase('en-US');
    if (foldedPaths.has(folded) && foldedPaths.get(folded) !== path) throw new Error(`Case/Unicode path collision: ${foldedPaths.get(folded)} <> ${path}`);
    foldedPaths.set(folded, path);
    files.set(path, { mode, oid });
  }
  return files;
}

function safeRead(root, repoPath, cap) {
  const path = resolve(root, ...repoPath.split('/'));
  if (!normalizeRepoPath(relative(root, path)) || normalizeRepoPath(relative(root, path)).startsWith('../')) throw new Error(`Path escape: ${repoPath}`);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > cap) throw new Error(`Unsafe input: ${repoPath}`);
  return readFileSync(path, 'utf8');
}

function changedPaths(baseFiles, headFiles) {
  const paths = new Set([...baseFiles.keys(), ...headFiles.keys()]);
  return [...paths].filter((path) => baseFiles.get(path)?.oid !== headFiles.get(path)?.oid || baseFiles.get(path)?.mode !== headFiles.get(path)?.mode).sort();
}

function unique(values) { return [...new Set(values)].sort(); }

export function validateTrusted(options) {
  const trustedRoot = resolve(options['trusted-root']);
  const candidateRoot = resolve(options['candidate-root']);
  const baseSha = options['base-sha'];
  const headSha = options['head-sha'];
  const branch = options.branch;
  const errors = [];
  if (!/^[0-9a-f]{40}$/.test(baseSha || '') || !/^[0-9a-f]{40}$/.test(headSha || '')) throw new Error('Base/head must be exact 40-hex SHAs');
  if (git(trustedRoot, ['rev-parse', 'HEAD']) !== baseSha) errors.push('Trusted checkout does not match base SHA');
  if (git(candidateRoot, ['rev-parse', 'HEAD']) !== headSha) errors.push('Candidate checkout does not match head SHA');

  const floorText = safeRead(trustedRoot, 'tools/trusted-governance/policy-floor.json', 2_000_000);
  const floor = JSON.parse(floorText);
  const cap = floor.MaximumInputBytes;
  const baseFiles = tracked(trustedRoot);
  const headFiles = tracked(candidateRoot);
  const paths = changedPaths(baseFiles, headFiles);
  if (!paths.length) errors.push('Empty candidate diff is blocked');

  const schema = (name) => JSON.parse(safeRead(trustedRoot, `architecture/agents/${name}.schema.json`, cap));
  const load = (root, name) => readJsonCompatibleYaml(resolve(root, `architecture/agents/${name}.yaml`));
  const registrySchema = schema('agent-registry');
  const matrixSchema = schema('review-matrix');
  const baseRegistry = load(trustedRoot, 'agent-registry');
  const baseMatrix = load(trustedRoot, 'review-matrix');
  const headRegistryText = safeRead(candidateRoot, 'architecture/agents/agent-registry.yaml', cap);
  const headMatrixText = safeRead(candidateRoot, 'architecture/agents/review-matrix.yaml', cap);
  const headRegistry = JSON.parse(headRegistryText);
  const headMatrix = JSON.parse(headMatrixText);
  errors.push(...validateJsonSchema(baseRegistry, registrySchema, { path: 'base.registry' }));
  errors.push(...validateJsonSchema(baseMatrix, matrixSchema, { path: 'base.matrix' }));
  errors.push(...validateJsonSchema(headRegistry, registrySchema, { path: 'candidate.registry' }));
  errors.push(...validateJsonSchema(headMatrix, matrixSchema, { path: 'candidate.matrix' }));
  if (headRegistry.PlatformState === 'ZERO_AGENT_TRANSITION') errors.push('ZERO_AGENT_TRANSITION_MANDATORY_AGENT_NOT_AVAILABLE');
  if (headRegistry.PlatformState === 'PROVISIONAL_PLATFORM_BUILD' || headRegistry.ActivationAllowed === false) {
    errors.push('PROVISIONAL_PLATFORM_ACTIVATION_CLOSED');
  }
  if (headRegistry.PlatformState === 'FIRST_WAVE_ACTIVE_FOR_PROJECT_DEVELOPMENT') {
    errors.push('DEVELOPMENT_ACTIVATION_NOT_PRODUCTION_GOVERNANCE');
  }
  if (headRegistry.PlatformState === 'FIRST_WAVE_IMPLEMENTED_AND_CONFIGURED_IN_CANONICAL') {
    errors.push('CONFIGURED_RUNTIME_DISCOVERY_NOT_VERIFIED');
  }

  const baseResolution = resolveRequiredAgents({ changedPaths: paths, branch, matrix: baseMatrix });
  const headResolution = resolveRequiredAgents({ changedPaths: paths, branch, matrix: headMatrix });
  const requiredAgents = unique([...floor.MandatoryAgents, ...baseResolution.RequiredAgents, ...headResolution.RequiredAgents]);
  const requiredControls = unique([...floor.MandatoryControls, ...baseResolution.RequiredControls, ...headResolution.RequiredControls]);
  if (!floor.ProductionWritesAllowed && !requiredControls.includes('governance-tamper-check')) errors.push('Trusted governance control floor missing');
  const trustRootChanged = paths.some((path) =>
    path.startsWith('tools/trusted-governance/') ||
    path === '.github/workflows/trusted-agent-governance.yml' ||
    path === 'tools/json-schema-validator.mjs' ||
    path === 'tools/agent-governance-lib.mjs' ||
    path === 'architecture/agents/schemas/execution-attestation.schema.json' ||
    path === 'specification/NORMATIVE-SOURCE-REGISTER.json' ||
    path === 'specification/IOS_Master_Specification_v4.0_Package.manifest.json' ||
    path.startsWith('specification/IOS_Master_Specification_v4.0_Package/') ||
    path.startsWith('specification/agent-platform/v2.1/') ||
    /^architecture\/agents\/(?:agent-registry|review-matrix|review-contract|review-manifest)\.schema\.json$/.test(path));
  if (trustRootChanged) errors.push('TRUST_ROOT_CHANGE_REQUIRES_OWNER_GATE');

  let manifestResult;
  try {
    const located = findManifest(resolve(candidateRoot, 'audit/agents'), branch);
    const required = {
      TaskType: baseResolution.TaskType === headResolution.TaskType ? baseResolution.TaskType : 'mixed/unknown',
      RequiredAgents: requiredAgents,
      ApplicableAgents: requiredAgents,
    };
    manifestResult = validateManifest({
      manifestPath: located.path, required, root: candidateRoot, branch, base: baseSha,
      actualHead: headSha, schemaRoot: trustedRoot,
      forbiddenPassingExecutionModes: floor.ForbiddenPassingExecutionModes,
    });
    errors.push(...manifestResult.errors);
  } catch (error) {
    errors.push(`Trusted manifest validation failed: ${error.message}`);
  }

  const validatorHash = createHash('sha256').update(readFileSync(import.meta.filename)).digest('hex');
  const missingAgents = manifestResult?.manifest?.MissingAgents || requiredAgents;
  const attestationErrors = errors.filter((error) => error.includes('cannot satisfy a mandatory trusted review'));
  if (floor.TrustedExecutionAttestation === 'REQUIRED_EXTERNAL') {
    attestationErrors.push('TRUSTED_EXECUTION_ATTESTATION_INSUFFICIENT_EVIDENCE');
  }
  const integrityErrors = errors.filter((error) => !attestationErrors.includes(error));
  const blockingFindings = unique([...errors, ...attestationErrors]);
  const overallStatus = blockingFindings.length === 0 && manifestResult?.manifest?.OverallStatus === 'PASS' ? 'PASS' : 'BLOCKED';
  return {
    ValidatorVersion: '1.0.0', TrustedValidatorSHA256: validatorHash, BaseSHA: baseSha, HeadSHA: headSha,
    ChangedPaths: paths, TrustRootChanged: trustRootChanged,
    BasePolicyVersion: baseMatrix.Version, CandidatePolicyVersion: headMatrix.Version,
    RequiredAgents: requiredAgents, RequiredControls: requiredControls,
    MissingAgents: missingAgents, IntegrityStatus: integrityErrors.length ? 'FAIL' : 'PASS',
    IntegrityErrors: integrityErrors, AttestationStatus: attestationErrors.length ? 'INSUFFICIENT_EVIDENCE' : 'VERIFIED',
    AttestationErrors: attestationErrors, BlockingFindings: blockingFindings,
    OverallStatus: overallStatus,
  };
}

function main() {
  const options = args(process.argv.slice(2));
  const result = validateTrusted(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.OverallStatus === 'PASS' ? 0 : 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try { main(); } catch (error) { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 3; }
}
