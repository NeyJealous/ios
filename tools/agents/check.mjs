#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
const root = resolve(rootArg >= 0 ? process.argv[rootArg + 1] : resolve(import.meta.dirname, '../..'));
const steps = [
  ['upstream integrity', 'tools/agents/validate-upstream-integrity.mjs', []],
  ['generated profiles', 'tools/agents/validate-generated-agents.mjs', []],
  ['activation boundary', 'tools/agents/validate-activation-boundary.mjs', []],
  ['governance structures', 'tools/validate-agent-governance.mjs', ['--root', root, '--base', 'HEAD', '--head', 'HEAD']],
  ['governance tests', '--test', ['tests/agent-governance/*.test.mjs']],
  ['privacy', 'tools/publication-privacy-check.mjs', []],
];
const results = [];
for (const [name, target, args] of steps) {
  const command = target === '--test' ? [target, ...args] : [resolve(root, target), ...args];
  const run = spawnSync(process.execPath, command, { cwd: root, encoding: 'utf8' });
  results.push({ name, status: run.status, stdout: run.stdout.trim(), stderr: run.stderr.trim() });
  if (run.status !== 0) break;
}
const ok = results.length === steps.length && results.every((item) => item.status === 0);
console.log(JSON.stringify({ schemaVersion: '1.0.0', ok, productionWrites: 0, results }, null, 2));
process.exitCode = ok ? 0 : 2;
