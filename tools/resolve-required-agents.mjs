#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  changedPathsFromGit, readJsonCompatibleYaml, resolveRequiredAgents,
} from './agent-governance-lib.mjs';

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    if (['--owner-approved', '--allow-empty'].includes(key)) args[key.slice(2)] = true;
    else args[key.slice(2)] = argv[++index];
  }
  return args;
}

export function resolveForPaths({ paths, branch = '', matrix, exceptions = [], ownerApproved = false, now, allowEmpty = false }) {
  return resolveRequiredAgents({ changedPaths: paths, branch, matrix, exceptions, ownerApproved, now, allowEmpty });
}

export function resolveForGit({ root, base, head, branch = '', matrix, exceptions = [], ownerApproved = false }) {
  const diff = changedPathsFromGit(root, base, head);
  return {
    BaseSHA: base,
    HeadSHA: head,
    Changes: diff.changes,
    ...resolveRequiredAgents({ changedPaths: diff.paths, branch, matrix, exceptions, ownerApproved }),
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.root || import.meta.dirname, args.root ? '.' : '..');
  const matrixPath = resolve(root, args.matrix || 'architecture/agents/review-matrix.yaml');
  const matrix = readJsonCompatibleYaml(matrixPath);
  const exceptions = args.exceptions ? JSON.parse(readFileSync(resolve(root, args.exceptions), 'utf8')) : [];
  let result;
  if (args.paths) {
    result = resolveForPaths({
      paths: JSON.parse(args.paths), branch: args.branch || '', matrix, exceptions,
      ownerApproved: Boolean(args['owner-approved']), allowEmpty: Boolean(args['allow-empty']),
    });
  } else {
    if (!args.base || !args.head) throw new Error('--base and --head are required unless --paths is used.');
    result = resolveForGit({
      root, base: args.base, head: args.head, branch: args.branch || '', matrix,
      exceptions, ownerApproved: Boolean(args['owner-approved']),
    });
  }
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) writeFileSync(resolve(root, args.output), serialized, 'utf8');
  process.stdout.write(serialized);
  if (result.FailClosed && result.ExceptionResults.some((item) => !item.valid)) process.exitCode = 2;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 2; }
}
