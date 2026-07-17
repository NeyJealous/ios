#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  findManifest, readJsonCompatibleYaml, validateInstructionHierarchy,
  validateManifest, validateMatrix, validateProjectAgentFiles, validateRegistry,
} from './agent-governance-lib.mjs';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    if (key === '--all') args.all = true;
    else args[key.slice(2)] = argv[++index];
  }
  return args;
}

export function validateStaticGovernance(root) {
  const registry = readJsonCompatibleYaml(resolve(root, 'architecture/agents/agent-registry.yaml'));
  const matrix = readJsonCompatibleYaml(resolve(root, 'architecture/agents/review-matrix.yaml'));
  const errors = [
    ...validateRegistry(registry),
    ...validateMatrix(matrix, registry),
    ...validateInstructionHierarchy(root),
    ...validateProjectAgentFiles(root, registry),
  ];
  return { errors, registry, matrix };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || import.meta.dirname, args.root ? '.' : '..');
  const staticResult = validateStaticGovernance(root);
  const errors = [...staticResult.errors];
  let manifestResult;
  if (args.manifest || args['manifest-root']) {
    for (const requiredArg of ['required-file', 'branch', 'base', 'head']) {
      if (!args[requiredArg]) errors.push(`missing --${requiredArg}`);
    }
    if (errors.length === staticResult.errors.length) {
      const located = args.manifest
        ? { path: resolve(root, args.manifest) }
        : findManifest(resolve(root, args['manifest-root']), args.branch);
      const required = JSON.parse(readFileSync(resolve(root, args['required-file']), 'utf8'));
      manifestResult = validateManifest({
        manifestPath: located.path, required, root, branch: args.branch,
        base: args.base, actualHead: args.head,
      });
      errors.push(...manifestResult.errors);
    }
  }
  const result = {
    ok: errors.length === 0,
    registryAgents: staticResult.registry.Agents.length,
    matrixRules: staticResult.matrix.Rules.length,
    manifest: manifestResult?.manifest?.GateId || null,
    errors,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (errors.length) process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try { main(); } catch (error) { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 2; }
}
