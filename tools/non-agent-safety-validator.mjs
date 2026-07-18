#!/usr/bin/env node
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readJsonCompatibleYaml, resolveRequiredAgents, validateReview } from './agent-governance-lib.mjs';
import { validateJsonSchema } from './json-schema-validator.mjs';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[index + 1]?.startsWith('--') ? true : argv[++index] ?? true;
  }
  return args;
}

function regularFile(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Unsafe governance input type: ${path}`);
  if (stat.size > 2_000_000) throw new Error(`Governance input exceeds size cap: ${path}`);
}

function trackedModeErrors(root) {
  const result = spawnSync('git', ['ls-files', '-s', '-z'], { cwd: root, encoding: 'utf8', shell: false });
  if (result.status !== 0) return [`git ls-files failed: ${(result.stderr || '').trim()}`];
  const critical = /^(?:AGENTS\.md|\.codex\/agents\/|architecture\/agents\/|docs\/agents\/|tools\/.*agent|\.github\/workflows\/.*agent)/i;
  return result.stdout.split('\0').filter(Boolean).flatMap((record) => {
    const match = /^(\d{6}) [0-9a-f]+ \d+\t(.+)$/.exec(record);
    if (!match) return ['Malformed git index record'];
    const [, mode, path] = match;
    if (critical.test(path) && ['120000', '160000'].includes(mode)) return [`Unsafe tracked mode ${mode}: ${path}`];
    if (path.includes('..') || path.includes('\\') || /^\//.test(path) || /[\u0000-\u001f]/.test(path)) return [`Unsafe tracked path: ${path}`];
    return [];
  });
}

export function runNonAgentSafety(root) {
  const paths = {
    registry: resolve(root, 'architecture/agents/agent-registry.yaml'),
    matrix: resolve(root, 'architecture/agents/review-matrix.yaml'),
    registrySchema: resolve(root, 'architecture/agents/agent-registry.schema.json'),
    matrixSchema: resolve(root, 'architecture/agents/review-matrix.schema.json'),
  };
  Object.values(paths).forEach(regularFile);
  const registry = readJsonCompatibleYaml(paths.registry);
  const matrix = readJsonCompatibleYaml(paths.matrix);
  const registrySchema = JSON.parse(readFileSync(paths.registrySchema, 'utf8'));
  const matrixSchema = JSON.parse(readFileSync(paths.matrixSchema, 'utf8'));
  const errors = [
    ...validateJsonSchema(registry, registrySchema, { path: 'registry' }),
    ...validateJsonSchema(matrix, matrixSchema, { path: 'matrix' }),
    ...trackedModeErrors(root),
  ];

  const probe = resolveRequiredAgents({
    changedPaths: ['docs/known.md', 'unmapped-critical.bin'], branch: 'feature/safety-probe', matrix,
  });
  if (!probe.FailClosed || !probe.UnknownPaths.includes('unmapped-critical.bin')) errors.push('Mixed known/unknown path probe did not fail closed');
  for (const id of matrix.FailClosed.RequiredAgents) if (!probe.RequiredAgents.includes(id)) errors.push(`Fail-closed probe omitted ${id}`);

  const unavailableProbe = {
    AgentId: 'TEST_GENERATOR', AgentVersion: 'probe', GateId: 'probe', Branch: 'probe',
    CommitSHA: '0'.repeat(40), ReviewScope: 'probe', FilesReviewed: [], SpecificationReferences: [],
    ChecksPerformed: [], Findings: [], Severity: 'INFO', Evidence: ['probe'], RequiredFixes: [],
    ResidualRisk: 'probe', Status: 'PASS', Timestamp: '2026-01-01T00:00:00Z', ExecutionMode: 'NOT_AVAILABLE',
  };
  if (!validateReview(unavailableProbe).some((error) => error.includes('NOT_AVAILABLE'))) errors.push('NOT_AVAILABLE + PASS probe was accepted');

  return {
    Validator: 'IOS_NON_AGENT_SAFETY', Version: '1.0.0', OverallStatus: errors.length ? 'FAIL' : 'PASS',
    ActiveAgentDependency: false, ProductionWrites: 0, errors,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || import.meta.dirname, args.root ? '.' : '..');
  const result = runNonAgentSafety(root);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.errors.length) process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try { main(); } catch (error) { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 3; }
}
