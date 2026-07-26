#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readJsonCompatibleYaml } from '../agent-governance-lib.mjs';
import { resolveForGit, resolveForPaths } from '../resolve-required-agents.mjs';
import { buildExecutionPlan, loadPlatform } from './orchestration-lib.mjs';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    args[key.slice(2)] = argv[++index];
  }
  return args;
}

export function runOrchestration(args) {
  const root = resolve(args.root || resolve(import.meta.dirname, '../..'));
  const matrix = readJsonCompatibleYaml(resolve(root, 'architecture/agents/review-matrix.yaml'));
  const resolution = args.paths
    ? resolveForPaths({ paths: JSON.parse(args.paths), branch: args.branch || '', matrix })
    : resolveForGit({ root, base: args.base, head: args.head, branch: args.branch || '', matrix });
  const plan = { ...buildExecutionPlan({ phase: args.phase, resolution, ...loadPlatform(root) }), resolution };
  if (args.output) writeFileSync(resolve(root, args.output), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return plan;
}

export function runCli(argv, forcedPhase) {
  const args = parseArgs(argv);
  if (forcedPhase) args.phase = forcedPhase;
  if (!args.phase) throw new Error('--phase is required');
  if (!args.paths && (!args.base || !args.head)) throw new Error('--base and --head are required unless --paths is used');
  const plan = runOrchestration(args);
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  if (plan.result === 'BLOCKED') process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try { runCli(process.argv.slice(2)); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
}
