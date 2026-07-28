#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const rootArg = process.argv.indexOf('--root');
const root = resolve(rootArg >= 0 ? process.argv[rootArg + 1] : resolve(import.meta.dirname, '../..'));
const steps = [
  ['upstream provenance', 'tools/agents/validate-upstream-integrity.mjs', []],
  ['canonical integrity', 'tools/agents/validate-agent-integrity-registry.mjs', [root]],
  ['capability envelopes', 'tools/agents/validate-capability-envelopes.mjs', [root]],
  ['first-wave validation', 'tools/agents/validate-first-wave-agents.mjs', ['--root', root]],
  ['governance structures', 'tools/validate-agent-governance.mjs', ['--root', root, '--base', 'HEAD', '--head', 'HEAD']],
  ['development agent tests', '--test', [
    'tests/agent-governance/capability-envelope.test.mjs',
    'tests/agent-governance/model-availability.test.mjs',
    'tests/agent-governance/orchestrator.test.mjs',
    'tests/agent-governance/privacy-scan.test.mjs',
    'tests/agent-governance/registry-matrix.test.mjs',
    'tests/agent-governance/resolver.test.mjs',
    'tests/agent-governance/source-authored-agent-platform.test.mjs',
    'tests/agent-governance/upstream-selection.test.mjs',
  ]],
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
console.log(JSON.stringify({ schemaVersion: '2.0.0', ok, productionWrites: 0, activationPerformed: false, results }, null, 2));
process.exitCode = ok ? 0 : 2;
